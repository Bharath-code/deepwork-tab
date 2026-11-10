import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heldMoments, rollup, eventKey, shouldPing } from '../lib/usage.js';

const MIN = 60000;
const T = new Date(2026, 10, 10, 10, 0, 0).getTime();
const at = (type, min, extra = {}) => ({ type, ts: T + min * MIN, ...extra });

test('held moments: table from the plan', () => {
  const cases = [
    ['intercept then queue is held', [at('intercept', 0), at('outcome', 1, { value: 'queued' })], 1, 1],
    ['intercept then swap is held', [at('intercept', 0), at('outcome', 1, { value: 'swapped' })], 1, 1],
    ['loosen at +9 min is not held', [at('intercept', 0), at('loosen', 9)], 1, 0],
    ['loosen at +11 min is held', [at('intercept', 0), at('loosen', 11)], 1, 1],
    ['loosen with no intercept before it has no effect', [at('loosen', 0), at('intercept', 1)], 1, 1],
    ['two intercepts, one loosen: only the most recent is lost', [at('intercept', 0), at('intercept', 2), at('loosen', 5)], 2, 1]
  ];
  for (const [name, log, intercepts, held] of cases) {
    const r = heldMoments(log);
    assert.equal(r.intercepts, intercepts, name);
    assert.equal(r.held, held, name);
  }
  assert.equal(heldMoments([]).holdRate, null);
  assert.equal(heldMoments(undefined).held, 0);
  assert.equal(heldMoments([at('intercept', 0), at('intercept', 1), at('loosen', 2)]).holdRate, 0.5);
});

test('rollup counts by day, carries no domain, and ignores unknown events', () => {
  let days = rollup({}, at('intercept', 0, { domain: 'youtube.com' }));
  days = rollup(days, at('outcome', 1, { value: 'back' }));
  days = rollup(days, at('feeling', 1, { value: 'stuck' }));
  days = rollup(days, at('loosen', 3), 1);
  assert.deepEqual(days, { '2026-11-10': { intercept: 1, back: 1, feel_stuck: 1, loosen: 1, lost: 1 } });
  assert.equal(rollup(days, at('outcome', 4, { value: 'https://evil.test' })), days);
  assert.equal(rollup(days, at('anything', 4)), days);
  assert.equal(eventKey({ type: 'feeling', value: 'hungry' }), '');
});

test('rollup keeps only the newest days', () => {
  let days = {};
  for (let i = 0; i < 5; i++) days = rollup(days, { type: 'intercept', ts: T + i * 86400000 }, 0, 3);
  assert.deepEqual(Object.keys(days), ['2026-11-12', '2026-11-13', '2026-11-14']);
});

test('no ping without a yes', () => {
  const base = { installId: 'a', lastPing: '2026-11-09' };
  assert.equal(shouldPing({ ...base, telemetry: 'yes' }, '2026-11-10'), true);
  assert.equal(shouldPing({ ...base, telemetry: 'no' }, '2026-11-10'), false);
  assert.equal(shouldPing(base, '2026-11-10'), false);
  assert.equal(shouldPing({ ...base, telemetry: 'yes' }, '2026-11-09'), false);
  assert.equal(shouldPing({ telemetry: 'yes' }, '2026-11-10'), false);
});
