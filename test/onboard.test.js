import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reasonReady, clampCap, nextStep, stepLabel, capNote, shelveOrder } from '../lib/onboard.js';

test('reason needs 12 real characters', () => {
  assert.equal(reasonReady('   short    '), false);
  assert.equal(reasonReady('I finish things.'), true);
  assert.equal(reasonReady(undefined), false);
});

test('cap clamps to 1..20 and falls back to 7', () => {
  assert.equal(clampCap(0), 1);
  assert.equal(clampCap(99), 20);
  assert.equal(clampCap('abc'), 7);
  assert.equal(clampCap(5.4), 5);
});

test('steps run in order; clear-down only when over cap', () => {
  assert.equal(nextStep('welcome'), 'reason');
  assert.equal(nextStep('day'), 'pin');
  assert.equal(nextStep('pin', 3), 'clear');
  assert.equal(nextStep('pin', 0), 'done');
  assert.equal(nextStep('clear', 0), 'done');
  assert.equal(stepLabel('cap'), 'Step 3 of 4');
  assert.equal(stepLabel('pin'), '');
});

test('cap note states the fact, no pressure', () => {
  assert.match(capNote(12, 7), /5 over/);
  assert.match(capNote(4, 7), /3 to spare/);
});

test('shelve order: least recently used first, never the active tab', () => {
  const tabs = [
    { id: 1, lastAccessed: 30 },
    { id: 2, lastAccessed: 10, active: true },
    { id: 3, lastAccessed: 20 },
    { id: 4, lastAccessed: 5 }
  ];
  assert.deepEqual(shelveOrder(tabs, 2).map((t) => t.id), [4, 3]);
  assert.deepEqual(shelveOrder(tabs, -1), []);
});
