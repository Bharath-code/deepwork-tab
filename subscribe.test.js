import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmail } from './heartbeat/src/worker.js';

test('accepts ordinary addresses, normalised', () => {
  assert.equal(normalizeEmail('Someone@Example.com'), 'someone@example.com');
  assert.equal(normalizeEmail('  spaced@example.com  '), 'spaced@example.com');
  assert.equal(normalizeEmail('a.b+tag@sub.example.co.uk'), 'a.b+tag@sub.example.co.uk');
});

test('rejects anything we would not want in KV', () => {
  for (const bad of [
    '',
    'no-at-sign',
    'no@tld',
    '@example.com',
    'trailing@example.',
    'two@@example.com',
    'sp ace@example.com',
    'a@b.c\nBcc: victim@example.com',
    'x@y.z',                       // under the 6-char floor
    'a'.repeat(250) + '@ex.com',   // over the 254 cap
    'comma@ex.com,other@ex.com',   // no list injection
    '"quoted"@example.com',
    '<script>@example.com'
  ]) {
    assert.equal(normalizeEmail(bad), '', `should reject: ${JSON.stringify(bad)}`);
  }
});

test('rejects non-strings', () => {
  for (const bad of [null, undefined, 42, {}, [], ['a@b.co']]) {
    assert.equal(normalizeEmail(bad), '');
  }
});
