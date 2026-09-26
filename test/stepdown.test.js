import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stepDownCap, daysToTarget } from '../lib/stepdown.js';

const DAY = 86_400_000;
const AT = Date.parse('2026-10-01T09:00:00Z');
const sd = (from) => ({ from, at: AT });

test('no step-down, or onboarded under target, is just the target', () => {
  assert.equal(stepDownCap(7, null, AT), 7);
  assert.equal(stepDownCap(7, sd(5), AT), 7);
  assert.equal(stepDownCap(7, sd(7), AT + 3 * DAY), 7);
});

test('day 0 leaves room for the next tab', () => {
  for (const from of [8, 12, 25, 60]) {
    assert.ok(stepDownCap(7, sd(from), AT) > from, `from ${from}`);
  }
});

test('integer, never below target, never rising, target by day 7', () => {
  for (const from of [8, 12, 25, 60]) {
    let prev = Infinity;
    for (let h = 0; h <= 40 * 24; h++) {
      const c = stepDownCap(7, sd(from), AT + h * 3_600_000);
      assert.ok(Number.isInteger(c), `integer at from ${from}, hour ${h}`);
      assert.ok(c >= 7, `below target at from ${from}, hour ${h}`);
      assert.ok(c <= prev, `rose at from ${from}, hour ${h}`);
      prev = c;
    }
    assert.equal(stepDownCap(7, sd(from), AT + 7 * DAY), 7, `from ${from} not at target by day 7`);
    assert.equal(daysToTarget(7, sd(from)), 7);
  }
});
