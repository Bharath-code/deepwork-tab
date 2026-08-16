import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weekSummary, fullSummary } from '../lib/receipt.js';

const NOW = new Date(2026, 7, 7, 12, 0, 0).getTime();
const DAY = 86_400_000;
const log = [
  { type: 'intercept', ts: NOW - 1000, domain: 'youtube.com' },
  { type: 'intercept', ts: NOW - 2000, domain: 'youtube.com' },
  { type: 'queue', ts: NOW - 3000, domain: 'youtube.com' },
  { type: 'intercept', ts: NOW - DAY, domain: 'news.example' },
  { type: 'queue', ts: NOW - DAY, domain: 'news.example' },
  { type: 'intercept', ts: NOW - 8 * DAY, domain: 'old.example' }
];

test('weekSummary matches the shipped free behavior', () => {
  assert.deepEqual(weekSummary(log, NOW), { intercepts: 3, queued: 2, top: 'youtube.com' });
});

test('weekSummary handles an empty or missing log', () => {
  assert.deepEqual(weekSummary([], NOW), { intercepts: 0, queued: 0, top: '' });
  assert.deepEqual(weekSummary(undefined, NOW), { intercepts: 0, queued: 0, top: '' });
});

test('fullSummary buckets the last seven days oldest-first', () => {
  const { byDay } = fullSummary(log, NOW);
  assert.equal(byDay.length, 7);
  assert.equal(byDay[6], 2);
  assert.equal(byDay[5], 1);
  assert.equal(byDay[0], 0);
});

test('fullSummary ranks the top three domains by intercepts', () => {
  const { topDomains } = fullSummary(log, NOW);
  assert.deepEqual(topDomains, [
    { domain: 'youtube.com', count: 2 },
    { domain: 'news.example', count: 1 }
  ]);
});

test('topDomains never returns more than three', () => {
  const many = ['a', 'b', 'c', 'd', 'e'].map((d, i) => ({
    type: 'intercept',
    ts: NOW - i,
    domain: `${d}.example`
  }));
  assert.equal(fullSummary(many, NOW).topDomains.length, 3);
});

test('queueRate is queued over intercepted, rounded to a percent', () => {
  assert.equal(fullSummary(log, NOW).queueRate, 67);
  assert.equal(fullSummary([], NOW).queueRate, 0);
});

test('events older than seven days are excluded everywhere', () => {
  const { topDomains, byDay } = fullSummary(log, NOW);
  assert.ok(!topDomains.some((d) => d.domain === 'old.example'));
  assert.equal(byDay.reduce((a, b) => a + b, 0), 3);
});
