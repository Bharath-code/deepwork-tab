import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrapFocus } from '../lib/focus.js';

test('wrapFocus cycles forward and backward', () => {
  const nodes = ['a', 'b', 'c'];
  assert.equal(wrapFocus(nodes, 'a', false), 'b');
  assert.equal(wrapFocus(nodes, 'c', false), 'a');
  assert.equal(wrapFocus(nodes, 'a', true), 'c');
  assert.equal(wrapFocus(nodes, 'b', true), 'a');
});

test('wrapFocus with an empty list or a stranger returns the first', () => {
  assert.equal(wrapFocus([], 'x', false), null);
  assert.equal(wrapFocus(['a', 'b'], 'z', false), 'a');
  assert.equal(wrapFocus(['a', 'b'], 'z', true), 'b');
});
