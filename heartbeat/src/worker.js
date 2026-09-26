/**
 * Two unrelated jobs, one Worker, because one Worker is enough.
 *
 * 1. Anonymous daily heartbeat from the EXTENSION.
 *    POST / — Body: { id: uuid, day: "YYYY-MM-DD" }
 *    Stores only install id + calendar days pinged. No URLs, no personal data.
 *    Trust boundary: the client's `day` is ignored. The date and days-since-
 *    first-ping come from this Worker's clock, so a D14 active can't be forged
 *    without really pinging on two dates 14+ days apart.
 *
 *    D14 metric: GET /stats   (Authorization: Bearer STATS_KEY)
 *      d14Rate = installs with a ping on day d>=14 / total installs (aged >=14d)
 *
 * 2. Email signups from the WEBSITE.
 *    POST /subscribe — an address someone typed into a form on the site.
 *    This IS personal data, unlike everything above, and is kept apart from it
 *    under the `e:` prefix. It is never joined to an install id — there is no
 *    key that could join them. The extension never touches this route.
 *
 *    Export: GET /subscribers   (Authorization: Bearer STATS_KEY)
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

const DAY_MS = 86400000;

function json(data, status = 200, cors = true) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...(cors ? CORS : {}) }
  });
}

// Constant-time so response timing doesn't leak how much of the key matched.
function authorized(request, env) {
  const want = env.STATS_KEY ? `Bearer ${env.STATS_KEY}` : '';
  const got = request.headers.get('Authorization') || '';
  if (!want || got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ got.charCodeAt(i);
  return diff === 0;
}

const noContent = () => new Response(null, { status: 204, headers: CORS });

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return noContent();

    const url = new URL(request.url);

    if (request.method === 'GET' && (url.pathname === '/stats' || url.pathname === '/subscribers')) {
      if (!authorized(request, env)) return json({ error: 'unauthorized' }, 401, false);
      return json(url.pathname === '/stats' ? await computeStats(env, Date.now()) : await listSubscribers(env), 200, false);
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true });
    }

    if (request.method === 'POST' && url.pathname === '/subscribe') {
      return subscribe(request, env);
    }

    if (request.method !== 'POST' || url.pathname !== '/') {
      return json({ error: 'not found' }, 404);
    }

    let body;
    try {
      body = JSON.parse(await request.text());
    } catch {
      // no-cors clients still need a 2xx; ignore bad bodies
      return noContent();
    }

    const id = typeof body?.id === 'string' ? body.id.slice(0, 64) : '';
    if (!id || !env.PINGS) return noContent();

    await recordPing(env.PINGS, id, Date.now());
    return noContent();
  }
};

/**
 * One KV write per install per day (Workers Free allows 1,000/day), plus one
 * `idx:` write the first time an install is seen.
 */
export async function recordPing(kv, id, now) {
  const day = new Date(now).toISOString().slice(0, 10);
  const key = `i:${id}`;
  let prev = null;
  try {
    prev = await kv.get(key, 'json');
  } catch {}
  if (prev?.last === day) return;

  const rec = prev || { first: day, days: {} };
  const d = Math.round((Date.parse(day) - Date.parse(rec.first)) / DAY_MS);
  rec.last = day;
  rec.days = rec.days || {};
  rec.days[day] = d;
  // keep last 60 calendar days of pings per install
  const keys = Object.keys(rec.days).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - 60))) delete rec.days[k];

  await kv.put(key, JSON.stringify(rec));
  if (!prev) await kv.put(`idx:${id}`, '1');
}

/**
 * Trust boundary: this string came from a public form. Normalise it, bound it,
 * and shape-check it. Returns '' for anything we won't store.
 * Deliberately not RFC 5322 — that grammar accepts addresses no signup form
 * should, and rejecting a valid oddity is cheaper here than storing junk.
 */
export function normalizeEmail(raw) {
  if (typeof raw !== 'string') return '';
  const e = raw.trim().toLowerCase();
  if (e.length < 6 || e.length > 254) return '';
  if (!/^[^\s@,;:<>()[\]\\"]+@[^\s@.,;:<>()[\]\\"]+(\.[^\s@.,;:<>()[\]\\"]+)+$/.test(e)) return '';
  return e;
}

async function subscribe(request, env) {
  const type = request.headers.get('Content-Type') || '';
  let raw = '';
  let wantsHTML = false;

  try {
    if (type.includes('application/json')) {
      raw = JSON.parse(await request.text())?.email;
    } else {
      // No-JS path: a plain form POST navigates here and needs a page back.
      raw = (await request.formData()).get('email');
      wantsHTML = true;
    }
  } catch {
    raw = '';
  }

  const email = normalizeEmail(raw);
  if (!email) {
    return wantsHTML
      ? page(400, 'That address didn’t look right.', 'Go back and try again — nothing was saved.')
      : json({ error: 'invalid email' }, 400);
  }

  if (env.PINGS) {
    // Overwrite is intentional: re-submitting is idempotent, not a duplicate.
    // ponytail: no double opt-in and no captcha. Add Turnstile if a bot finds
    // this; KV writes are the only thing at stake and they are cheap.
    await env.PINGS.put(`e:${email}`, JSON.stringify({ at: new Date().toISOString().slice(0, 10) }));
  }

  return wantsHTML
    ? page(200, 'You’re on the list.', 'One email when it ships. Nothing else, ever.')
    : json({ ok: true });
}

async function listSubscribers(env) {
  if (!env.PINGS) return { count: 0, emails: [] };

  const emails = [];
  let cursor;
  do {
    const page = await env.PINGS.list({ prefix: 'e:', cursor });
    for (const k of page.keys) emails.push(k.name.slice(2));
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);

  return { count: emails.length, emails };
}

/* Minimal styled-enough page for the no-JavaScript form path. */
function page(status, head, body) {
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<title>${head}</title><style>` +
      `body{font:16px/1.6 system-ui,sans-serif;max-width:32rem;margin:20vh auto;padding:0 1.5rem;` +
      `color:#241c3a;background:#f1eff7}h1{font-size:1.4rem;margin:0 0 .5rem}` +
      `a{color:#5b3fd6}@media(prefers-color-scheme:dark){body{color:#e8e4f5;background:#0e0b1a}a{color:#a996f5}}` +
      `</style></head><body><h1>${head}</h1><p>${body}</p>` +
      `<p><a href="/">← DeepWork Tab</a></p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS } }
  );
}

/**
 * Aged = first seen 14+ days ago, whether or not it ever pinged again.
 * Active = pinged on day 14 or later. (Counting "aged" as "pinged on day 14+"
 * made the two numbers identical and the rate always 1.0.)
 */
export async function computeStats(env, now) {
  const today = Date.parse(new Date(now).toISOString().slice(0, 10));
  const out = { installs: 0, aged14: 0, d14Active: 0, d14Rate: null };
  if (!env.PINGS) return out;

  let cursor;
  do {
    const page = await env.PINGS.list({ prefix: 'idx:', cursor });
    for (const key of page.keys) {
      const rec = await env.PINGS.get(`i:${key.name.slice(4)}`, 'json');
      if (!rec) continue;
      out.installs += 1;
      if ((today - Date.parse(rec.first)) / DAY_MS < 14) continue;
      out.aged14 += 1;
      if (Object.values(rec.days || {}).some((d) => d >= 14)) out.d14Active += 1;
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);

  out.d14Rate = out.aged14 ? +(out.d14Active / out.aged14).toFixed(4) : null;
  return out;
}
