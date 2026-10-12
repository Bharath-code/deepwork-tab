import test from 'node:test';
import assert from 'node:assert/strict';
import { cardModel, drawCard, CARD_W } from '../lib/card.js';

test('no activity yields no card', () => assert.equal(cardModel({}, 5), null));

test('numeral and labels follow the week', () => {
  assert.deepEqual(cardModel({ intercepts: 142, queued: 9 }, 3), {
    numeral: '142', label: 'tabs held this week', lines: ['9 shelved for later', 'Day 3 under the cap'], host: cardModel({ intercepts: 1 }).host
  });
  assert.equal(cardModel({ intercepts: 1 }).label, 'tab held this week');
  assert.equal(cardModel({ queued: 4 }).label, 'tabs shelved this week');
});

test('card carries no domains or names', () => {
  const m = cardModel({ intercepts: 5, queued: 2, top: 'reddit.com' }, 4);
  assert.ok(!JSON.stringify(m).includes('reddit'));
});

test('drawCard issues drawing calls against a stub context', () => {
  const calls = [];
  const ctx = new Proxy({ measureText: () => ({ width: 100 }), createLinearGradient: () => ({ addColorStop() {} }) }, {
    get: (t, k) => (k in t ? t[k] : (...a) => calls.push([k, a])),
    set: () => true
  });
  drawCard(ctx, cardModel({ intercepts: 7 }, 0));
  assert.ok(calls.some(([k, a]) => k === 'fillText' && a[0] === '7'));
  assert.ok(calls.some(([k, a]) => k === 'fillRect' && a[2] === CARD_W));
});
