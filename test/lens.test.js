import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lens, arcPath, lensSvg } from '../shared/lens.js';

test('lens under cap: one segment per slot, gaps open, count lit', () => {
  const l = lens(3, 7);
  assert.equal(l.segments.length, 7);
  assert.equal(l.segments.filter((s) => s.on).length, 3);
  assert.equal(l.full, false);
  assert.equal(l.over, 0);
  assert.ok(l.segments[1].from > l.segments[0].to);
  assert.equal(l.label, '3 of 7 tabs open');
});

test('lens at cap closes the gaps', () => {
  const l = lens(7, 7);
  assert.equal(l.full, true);
  assert.equal(l.segments[1].from, l.segments[0].to);
});

test('lens over cap reports the overflow and says it in words', () => {
  const l = lens(12, 7);
  assert.equal(l.over, 5);
  assert.equal(l.label, '12 of 7 tabs open');
});

test('lens survives a nonsense cap', () => {
  assert.equal(lens(2, 0).segments.length, 1);
});

test('arcPath starts at 12 o’clock and flags large arcs', () => {
  assert.equal(arcPath(10, 8, 0, 90), 'M10.000 2.000A8 8 0 0 1 18.000 10.000');
  assert.match(arcPath(10, 8, 0, 270), /A8 8 0 1 1/);
});

test('lensSvg is labelled and draws the over-cap notch only when over', () => {
  assert.match(lensSvg(7, 7), /role="img" aria-label="7 of 7 tabs open"/);
  assert.doesNotMatch(lensSvg(7, 7), /lens-over/);
  assert.match(lensSvg(9, 7), /lens-over/);
  assert.equal(lensSvg(3, 7).match(/lens-on/g).length, 3);
});
