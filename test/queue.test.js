import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queueAfterAdd, titleFor, restoreAction, queueCurrentPlan } from '../lib/queue.js';

test('queueAfterAdd prepends a new url and does not mutate the input', () => {
  const queue = [{ url: 'https://a.example', title: 'a', ts: 1 }];
  const next = queueAfterAdd(queue, { url: 'https://b.example', title: 'b', ts: 2 });
  assert.equal(queue.length, 1);
  assert.deepEqual(next.map((q) => q.url), ['https://b.example', 'https://a.example']);
});

test('queueAfterAdd ignores a duplicate url', () => {
  const queue = [{ url: 'https://a.example', title: 'a', ts: 1 }];
  assert.equal(queueAfterAdd(queue, { url: 'https://a.example', title: 'a2', ts: 2 }), queue);
});

test('queueAfterAdd caps at max', () => {
  const queue = [
    { url: 'https://a.example', title: 'a', ts: 1 },
    { url: 'https://b.example', title: 'b', ts: 2 }
  ];
  const next = queueAfterAdd(queue, { url: 'https://c.example', title: 'c', ts: 3 }, 2);
  assert.equal(next.length, 2);
  assert.equal(next[0].url, 'https://c.example');
  assert.equal(next[1].url, 'https://a.example');
});

test('titleFor keeps a real title and falls back to hostname', () => {
  assert.equal(titleFor('https://www.docs.example/api', 'Pagination'), 'Pagination');
  assert.equal(titleFor('https://www.docs.example/api', 'https://www.docs.example/api'), 'docs.example');
  assert.equal(titleFor('https://www.docs.example/api'), 'docs.example');
  assert.equal(titleFor('not-a-url'), 'not-a-url');
});

test('restoreAction focuses an already-open url, opens under cap, swaps at cap', () => {
  const url = 'https://queued.example';
  assert.deepEqual(
    restoreAction({ cap: 7, tabCount: 7, queuedUrl: url, openUrls: [url] }),
    { action: 'focus' }
  );
  assert.deepEqual(
    restoreAction({ cap: 7, tabCount: 4, queuedUrl: url, openUrls: [] }),
    { action: 'open' }
  );
  assert.deepEqual(
    restoreAction({ cap: 7, tabCount: 7, queuedUrl: url, openUrls: [] }),
    { action: 'swap' }
  );
  assert.deepEqual(
    restoreAction({ cap: 7, tabCount: 9, queuedUrl: url, openUrls: [] }),
    { action: 'swap' }
  );
  assert.deepEqual(
    restoreAction({ cap: 3, tabCount: 3, queuedUrl: url, openUrls: [] }),
    { action: 'swap' }
  );
});

test('queueCurrentPlan refuses chrome/extension/intercept urls and will not close the last tab', () => {
  const interceptBase = 'chrome-extension://id/intercept/intercept.html';
  assert.equal(queueCurrentPlan({ tabCount: 5, url: 'chrome://extensions', interceptBase }).action, 'noop');
  assert.equal(queueCurrentPlan({ tabCount: 5, url: interceptBase + '?target=x', interceptBase }).action, 'noop');
  assert.equal(queueCurrentPlan({ tabCount: 1, url: 'https://a.example', interceptBase }).action, 'enqueue-keep');
  assert.equal(queueCurrentPlan({ tabCount: 5, url: 'https://a.example', interceptBase }).action, 'enqueue-close');
});
