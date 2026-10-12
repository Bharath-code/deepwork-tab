import { test } from 'node:test';
import assert from 'node:assert/strict';
import { streakDays, loosened, missedYesterday, phase, topFeeling, reofferDue, frogCollapsed, easeCap, easeOffer, triageItems, REOFFER_MS } from '../lib/habit.js';

test('one loosened day keeps the streak, two in a row break it', () => {
  const s = { startDay: '2026-10-01', longest: 3 };
  const first = loosened(s, '2026-10-10');
  assert.equal(first.startDay, '2026-10-01');
  assert.equal(first.missDay, '2026-10-10');
  assert.equal(loosened(first, '2026-10-10'), first);
  assert.equal(missedYesterday(first, '2026-10-11'), true);
  const second = loosened(first, '2026-10-11');
  assert.equal(second.startDay, '2026-10-11');
  assert.equal(second.longest, 11);
  assert.equal(second.missDay, undefined);
});

test('a miss followed by a clean day, then another miss, keeps the streak', () => {
  const first = loosened({ startDay: '2026-10-01', longest: 0 }, '2026-10-10');
  const later = loosened(first, '2026-10-12');
  assert.equal(later.startDay, '2026-10-01');
  assert.equal(later.missDay, '2026-10-12');
});

test('streak days count inclusively; missing streak is zero', () => {
  assert.equal(streakDays({ startDay: '2026-10-10' }, '2026-10-12'), 3);
  assert.equal(streakDays(null), 0);
});

test('66-day phases follow Lally', () => {
  assert.deepEqual([1, 21, 22, 45, 46, 65, 66].map(phase), ['Building', 'Building', 'Settling', 'Settling', 'Becoming automatic', 'Becoming automatic', 'Automatic']);
  assert.equal(phase(0), '');
});

test('top feeling counts the last 7 days only', () => {
  const now = Date.UTC(2026, 9, 12);
  const log = [
    { type: 'feeling', value: 'stuck', ts: now - 1000 },
    { type: 'feeling', value: 'stuck', ts: now - 2000 },
    { type: 'feeling', value: 'tired', ts: now - 3000 },
    { type: 'feeling', value: 'bored', ts: now - 9 * 86400000 },
    { type: 'feeling', value: 'bogus', ts: now - 10 },
    { type: 'intercept', ts: now }
  ];
  assert.deepEqual(topFeeling(log, now), { value: 'stuck', count: 2 });
  assert.equal(topFeeling([], now), null);
});

test('re-offer is due only after remindAt', () => {
  const now = 1_000_000;
  const q = [{ url: 'a' }, { url: 'b', remindAt: now + REOFFER_MS }, { url: 'c', remindAt: now - 1 }];
  assert.equal(reofferDue(q, now).url, 'c');
  assert.equal(reofferDue(q.slice(0, 2), now), null);
});

test('frog first collapses the shelf until the One Thing is done or noon', () => {
  const at = (h) => new Date(2026, 9, 12, h).getTime();
  const one = { day: '2026-10-12', text: 'ship' };
  assert.equal(frogCollapsed({ oneThing: one, now: at(9) }), true);
  assert.equal(frogCollapsed({ oneThing: one, now: at(12) }), false);
  assert.equal(frogCollapsed({ oneThing: { ...one, done: true }, now: at(9) }), false);
  assert.equal(frogCollapsed({ oneThing: { ...one, day: '2026-10-11' }, now: at(9) }), false);
  assert.equal(frogCollapsed({ oneThing: null, now: at(9) }), false);
});

test('ease-in drops one a day and stops at the target', () => {
  const e = { from: 15, to: 7, start: '2026-10-12' };
  assert.equal(easeCap(e, '2026-10-12'), 15);
  assert.equal(easeCap(e, '2026-10-15'), 12);
  assert.equal(easeCap(e, '2026-10-30'), 7);
  assert.equal(easeOffer(14, 7), true);
  assert.equal(easeOffer(9, 7), false);
  assert.equal(easeOffer(30, 15), false);
});

test('triage lists stale items oldest first, at most 10', () => {
  const now = Date.now();
  const d = 86400000;
  const q = [{ url: 'new', ts: now - d }, { url: 'b', ts: now - 9 * d }, { url: 'a', ts: now - 20 * d }];
  assert.deepEqual(triageItems(q, now).map((i) => i.url), ['a', 'b']);
  assert.equal(triageItems(Array.from({ length: 30 }, (_, i) => ({ url: `u${i}`, ts: now - 30 * d })), now).length, 10);
});
