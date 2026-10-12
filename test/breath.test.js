import { test } from 'node:test';
import assert from 'node:assert/strict';
import { breathCaption, breathClock, announceAt, describeChange } from '../lib/breath.js';

test('six cycles of 4s in, 6s out, ending applied', () => {
  assert.equal(breathCaption(60), 'Breathe in');
  assert.equal(breathCaption(57), 'Breathe in');
  assert.equal(breathCaption(56), 'Breathe out');
  assert.equal(breathCaption(51), 'Breathe out');
  assert.equal(breathCaption(50), 'Breathe in');
  assert.equal(breathCaption(1), 'Breathe out');
  assert.equal(breathCaption(0), 'Change applied');
});

test('clock reads m:ss and never goes negative', () => {
  assert.equal(breathClock(60), '1:00');
  assert.equal(breathClock(42), '0:42');
  assert.equal(breathClock(5), '0:05');
  assert.equal(breathClock(-2), '0:00');
});

test('screen reader hears every 15s, not every second', () => {
  const heard = [];
  for (let s = 60; s >= 0; s--) if (announceAt(s)) heard.push(s);
  assert.deepEqual(heard, [45, 30, 15]);
});

test('describeChange names the loosening plainly', () => {
  const prev = { cap: 7, enabled: true };
  assert.equal(describeChange(prev, { cap: 10, enabled: true }), 'Raising your cap from 7 to 10.');
  assert.equal(describeChange(prev, { cap: 10, enabled: false }), 'Turning enforcement off.');
  assert.equal(describeChange(prev, { cap: 7, enabled: true }), 'Loosening what counts toward your cap.');
});
