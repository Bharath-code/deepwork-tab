import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visibleItems, nextWake, snoozeTargets } from '../lib/snooze.js';

// Pinned to a local morning: "Tonight" (20:00) must still be ahead of now, or
// it rolls to tomorrow and lands after "Tomorrow 9am".
const NOW = new Date(2026, 7, 7, 10, 0, 0).getTime();
const q = [
  { url: 'a', ts: 1 },
  { url: 'b', ts: 2, snoozedUntil: NOW - 1000 },
  { url: 'c', ts: 3, snoozedUntil: NOW + 60000 },
  { url: 'd', ts: 4, snoozedUntil: NOW + 10000 }
];

test('items with no snooze and expired snoozes are visible', () => {
  assert.deepEqual(visibleItems(q, NOW).map((i) => i.url), ['a', 'b']);
});

test('nextWake is the earliest future snooze', () => {
  assert.equal(nextWake(q, NOW), NOW + 10000);
});

test('nextWake is null when nothing is snoozed into the future', () => {
  assert.equal(nextWake([{ url: 'a', ts: 1 }], NOW), null);
  assert.equal(nextWake([], NOW), null);
});

test('a snooze exactly at now is visible again, not still hidden', () => {
  const edge = [{ url: 'e', ts: 5, snoozedUntil: NOW }];
  assert.equal(visibleItems(edge, NOW).length, 1);
});

test('snoozeTargets offers later-today, tonight and tomorrow morning', () => {
  const targets = snoozeTargets(NOW);
  assert.deepEqual(targets.map((t) => t.label), ['In 3 hours', 'Tonight', 'Tomorrow 9am']);
  assert.ok(targets.every((t) => t.at > NOW));
  assert.ok(targets[0].at < targets[1].at && targets[1].at < targets[2].at);
});
