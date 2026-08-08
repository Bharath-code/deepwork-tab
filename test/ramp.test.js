import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interceptsFor, rampDelayMs } from '../lib/ramp.js';

const NOW = 1_754_560_000_000;
const DAY = 86_400_000;
const log = [
  { type: 'intercept', ts: NOW - 1000, domain: 'youtube.com' },
  { type: 'intercept', ts: NOW - 2000, domain: 'youtube.com' },
  { type: 'intercept', ts: NOW - DAY - 1, domain: 'youtube.com' },
  { type: 'intercept', ts: NOW - 3000, domain: 'news.example' },
  { type: 'queue', ts: NOW - 500, domain: 'youtube.com' }
];

test('counts only intercepts, only for the domain, only inside the window', () => {
  assert.equal(interceptsFor(log, 'youtube.com', NOW, DAY), 2);
  assert.equal(interceptsFor(log, 'news.example', NOW, DAY), 1);
  assert.equal(interceptsFor(log, 'nowhere.example', NOW, DAY), 0);
});

test('an empty or missing log counts zero', () => {
  assert.equal(interceptsFor([], 'youtube.com', NOW, DAY), 0);
  assert.equal(interceptsFor(undefined, 'youtube.com', NOW, DAY), 0);
});

test('the first two visits of a day have no delay', () => {
  assert.equal(rampDelayMs(0), 0);
  assert.equal(rampDelayMs(1), 0);
});

test('the delay ramps and then caps', () => {
  assert.equal(rampDelayMs(2), 3000);
  assert.equal(rampDelayMs(3), 6000);
  assert.equal(rampDelayMs(4), 10000);
  assert.equal(rampDelayMs(9), 10000);
  assert.equal(rampDelayMs(500), 10000);
});
