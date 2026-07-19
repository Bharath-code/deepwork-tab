/**
 * Anonymous daily heartbeat for DeepWork Tab.
 * Body: { id: uuid, day: "YYYY-MM-DD", d: daysSinceInstall }
 * Stores only install id + calendar days pinged. No URLs, no personal data.
 *
 * D14 metric: GET /stats?key=STATS_KEY
 *   d14Rate = installs with a ping on day d>=14 / total installs (among those aged >=14d)
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

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true });
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
