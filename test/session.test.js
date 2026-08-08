import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sessionState, effectiveCap, formatRemaining } from '../lib/session.js';

const NOW = 1_754_560_000_000;

test('no session is inactive', () => {
  assert.deepEqual(sessionState(null, NOW), { active: false, remainingMs: 0 });
});

test('a future endsAt is active with the remaining time', () => {
  assert.deepEqual(sessionState({ cap: 3, endsAt: NOW + 5000 }, NOW), { active: true, remainingMs: 5000 });
});

test('an elapsed session is inactive', () => {
  assert.deepEqual(sessionState({ cap: 3, endsAt: NOW }, NOW), { active: false, remainingMs: 0 });
  assert.deepEqual(sessionState({ cap: 3, endsAt: NOW - 1 }, NOW), { active: false, remainingMs: 0 });
});

test('an active session tightens the cap but never loosens it', () => {
  assert.equal(effectiveCap(7, { cap: 3, endsAt: NOW + 5000 }, NOW), 3);
  assert.equal(effectiveCap(2, { cap: 3, endsAt: NOW + 5000 }, NOW), 2);
});

test('an elapsed or absent session leaves the cap alone', () => {
  assert.equal(effectiveCap(7, { cap: 3, endsAt: NOW - 1 }, NOW), 7);
  assert.equal(effectiveCap(7, null, NOW), 7);
});

test('remaining time reads as human minutes', () => {
  assert.equal(formatRemaining(0), 'less than a minute');
  assert.equal(formatRemaining(59_000), 'less than a minute');
  assert.equal(formatRemaining(60_000), '1 minute');
  assert.equal(formatRemaining(120_000), '2 minutes');
  assert.equal(formatRemaining(3_600_000), '60 minutes');
});
