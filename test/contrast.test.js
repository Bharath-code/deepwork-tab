import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../shared/tokens.css', import.meta.url), 'utf8');

const hexes = (block) => Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map(m => [m[1], m[2]]));
const light = hexes(css.match(/^:root\s*{([^}]*)}/m)[1]);
const dark = { ...light, ...hexes(css.match(/prefers-color-scheme: dark\)\s*{\s*:root\s*{([^}]*)}/)[1]) };

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const text = ['ink', 'ink-2', 'lumen-ink', 'settled', 'ember'];
const grounds = ['ground', 'surface', 'raised'];
const pairs = [
  ...text.flatMap(fg => grounds.map(bg => [fg, bg, 4.5])),
  ['on-lumen', 'lumen', 4.5],
  ['lumen-ink', 'ground', 3],
  ['lumen-ink', 'surface', 3],
];

for (const [name, theme] of [['light', light], ['dark', dark]]) {
  test(`token contrast meets WCAG AA (${name})`, () => {
    const fails = pairs
      .map(([fg, bg, min]) => [fg, bg, min, ratio(theme[fg], theme[bg])])
      .filter(([, , min, r]) => r < min)
      .map(([fg, bg, min, r]) => `${fg} on ${bg}: ${r.toFixed(2)} < ${min}`);
    assert.deepEqual(fails, []);
  });
}

test('contrast math matches the WCAG reference', () => {
  assert.equal(ratio('#000000', '#ffffff').toFixed(1), '21.0');
  assert.equal(ratio('#777777', '#ffffff').toFixed(2), '4.48');
});
