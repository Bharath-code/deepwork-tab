import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { recordPing, computeStats } from '../heartbeat/src/worker.js';

const DAY = 86400000;
const T0 = Date.parse('2026-10-01T12:00:00Z');

function fakeKV() {
  const m = new Map();
  const kv = {
    writes: 0,
    async get(k, type) {
      const v = m.get(k);
      return v == null ? null : type === 'json' ? JSON.parse(v) : v;
    },
    async put(k, v) {
      kv.writes += 1;
      m.set(k, v);
    },
    async list({ prefix }) {
      return { keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    }
  };
  return kv;
}

const ping = (env, body) =>
  worker.fetch(new Request('https://w.dev/', { method: 'POST', body: JSON.stringify(body) }), env);

test('client-sent d and day are ignored; days come from the server clock', async () => {
  const PINGS = fakeKV();
  await ping({ PINGS }, { id: 'a', day: '2020-01-01', d: 30 });
  const rec = await PINGS.get('i:a', 'json');
  const today = new Date().toISOString().slice(0, 10);
  assert.equal(rec.first, today);
  assert.deepEqual(rec.days, { [today]: 0 });
});

test('first ping writes record + index; repeat pings write at most once a day', async () => {
  const kv = fakeKV();
  await recordPing(kv, 'a', T0);
  assert.equal(kv.writes, 2);
  await recordPing(kv, 'a', T0 + 1000);
  assert.equal(kv.writes, 2, 'same-day repeat writes nothing');
  await recordPing(kv, 'a', T0 + DAY);
  assert.equal(kv.writes, 3, 'next day writes only the record');
});

test('D14 rate counts installs aged 14+ days, active or not', async () => {
  const kv = fakeKV();
  await recordPing(kv, 'kept', T0);
  await recordPing(kv, 'kept', T0 + 15 * DAY);
  await recordPing(kv, 'churned', T0);
  await recordPing(kv, 'young', T0 + 10 * DAY);
  const s = await computeStats({ PINGS: kv }, T0 + 16 * DAY);
  assert.deepEqual(s, { installs: 3, aged14: 2, d14Active: 1, d14Rate: 0.5 });
});

test('admin routes need the bearer header, never a query key', async () => {
  const env = { STATS_KEY: 'sekrit', PINGS: fakeKV() };
  const get = (path, headers = {}) => worker.fetch(new Request('https://w.dev' + path, { headers }), env);
  assert.equal((await get('/stats?key=sekrit')).status, 401);
  assert.equal((await get('/subscribers?key=sekrit')).status, 401);
  assert.equal((await get('/stats', { Authorization: 'Bearer wrong!' })).status, 401);
  const ok = await get('/stats', { Authorization: 'Bearer sekrit' });
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('Access-Control-Allow-Origin'), null);
  assert.equal((await worker.fetch(new Request('https://w.dev/stats', { headers: { Authorization: 'Bearer ' } }), {})).status, 401);
});
