/**
 * Two unrelated jobs, one Worker, because one Worker is enough.
 *
 * 1. Anonymous daily heartbeat from the EXTENSION.
 *    POST / — Body: { id: uuid, day: "YYYY-MM-DD", d: daysSinceInstall }
 *    Stores only install id + calendar days pinged. No URLs, no personal data.
 *
 *    D14 metric: GET /stats?key=STATS_KEY
 *      d14Rate = installs with a ping on day d>=14 / total installs (aged >=14d)
 *
 * 2. Email signups from the WEBSITE.
 *    POST /subscribe — an address someone typed into a form on the site.
 *    This IS personal data, unlike everything above, and is kept apart from it
 *    under the `e:` prefix. It is never joined to an install id — there is no
 *    key that could join them. The extension never touches this route.
 *
 *    Export: GET /subscribers?key=STATS_KEY
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/stats') {
      if (!env.STATS_KEY || url.searchParams.get('key') !== env.STATS_KEY) {
        return json({ error: 'unauthorized' }, 401);
      }
      return json(await computeStats(env));
    }

    if (request.method === 'GET' && url.pathname === '/subscribers') {
      if (!env.STATS_KEY || url.searchParams.get('key') !== env.STATS_KEY) {
        return json({ error: 'unauthorized' }, 401);
      }
      return json(await listSubscribers(env));
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
      return new Response(null, { status: 204, headers: CORS });
    }

    const id = typeof body?.id === 'string' ? body.id.slice(0, 64) : '';
    const day = typeof body?.day === 'string' ? body.day.slice(0, 10) : '';
    const d = Number.isFinite(body?.d) ? Math.max(0, Math.min(10000, Math.floor(body.d))) : -1;

    if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(day) || d < 0) {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (env.PINGS) {
      const key = `i:${id}`;
      let rec = { first: day, last: day, days: {}, dMax: d };
      try {
        const prev = await env.PINGS.get(key, 'json');
        if (prev) rec = prev;
      } catch {}
      rec.last = day;
      rec.dMax = Math.max(rec.dMax || 0, d);
      rec.days = rec.days || {};
      rec.days[day] = d;
      // keep last 60 calendar days of pings per install
      const keys = Object.keys(rec.days).sort();
      if (keys.length > 60) {
        for (const k of keys.slice(0, keys.length - 60)) delete rec.days[k];
      }
      await env.PINGS.put(key, JSON.stringify(rec));
      // index for stats scan
      await env.PINGS.put(`idx:${id}`, '1');
    }

    return new Response(null, { status: 204, headers: CORS });
  }
};

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

async function computeStats(env) {
  if (!env.PINGS) return { installs: 0, aged14: 0, d14Active: 0, d14Rate: null };

  const list = await env.PINGS.list({ prefix: 'idx:' });
  let installs = 0;
  let aged14 = 0;
  let d14Active = 0;

  for (const key of list.keys) {
    const id = key.name.slice(4);
    const rec = await env.PINGS.get(`i:${id}`, 'json');
    if (!rec) continue;
    installs += 1;
    const dMax = rec.dMax || 0;
    if (dMax < 14) continue;
    aged14 += 1;
    // active on day 14+ if any stored ping has d >= 14
    const hit = Object.values(rec.days || {}).some((d) => d >= 14);
    if (hit) d14Active += 1;
  }

  // list() is paginated — follow cursors for large sets
  let cursor = list.list_complete ? null : list.cursor;
  while (cursor) {
    const page = await env.PINGS.list({ prefix: 'idx:', cursor });
    for (const key of page.keys) {
      const id = key.name.slice(4);
      const rec = await env.PINGS.get(`i:${id}`, 'json');
      if (!rec) continue;
      installs += 1;
      const dMax = rec.dMax || 0;
      if (dMax < 14) continue;
      aged14 += 1;
      if (Object.values(rec.days || {}).some((d) => d >= 14)) d14Active += 1;
    }
    cursor = page.list_complete ? null : page.cursor;
  }

  return {
    installs,
    aged14,
    d14Active,
    d14Rate: aged14 ? +(d14Active / aged14).toFixed(4) : null
  };
}
