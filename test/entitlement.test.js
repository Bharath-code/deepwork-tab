import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto as crypto } from 'node:crypto';
import { verifyWith } from '../lib/entitlement.js';

const ALG = { name: 'ECDSA', namedCurve: 'P-256' };
const SIG = { name: 'ECDSA', hash: 'SHA-256' };
const b64u = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function mint(email) {
  const pair = await crypto.subtle.generateKey(ALG, true, ['sign', 'verify']);
  const pub = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const payload = new TextEncoder().encode(JSON.stringify({ e: email, t: Date.now() }));
  const sig = await crypto.subtle.sign(SIG, pair.privateKey, payload);
  return { key: `${b64u(payload)}.${b64u(sig)}`, jwk: { kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y } };
}

test('accepts a correctly signed key and returns the email', async () => {
  const { key, jwk } = await mint('buyer@example.com');
  assert.deepEqual(await verifyWith(key, jwk), { valid: true, email: 'buyer@example.com' });
});

test('rejects a key signed by a different keypair', async () => {
  const { key } = await mint('buyer@example.com');
  const { jwk: otherJwk } = await mint('someone@else.com');
  assert.deepEqual(await verifyWith(key, otherJwk), { valid: false, email: null });
});

test('rejects a key whose payload was edited after signing', async () => {
  const { key, jwk } = await mint('buyer@example.com');
  const tampered =
    b64u(new TextEncoder().encode(JSON.stringify({ e: 'pirate@example.com', t: Date.now() }))) +
    '.' + key.split('.')[1];
  assert.deepEqual(await verifyWith(tampered, jwk), { valid: false, email: null });
});

test('rejects malformed input without throwing', async () => {
  const { jwk } = await mint('buyer@example.com');
  for (const bad of ['', 'nodot', 'a.b.c', '...', '!!!.???']) {
    assert.deepEqual(await verifyWith(bad, jwk), { valid: false, email: null }, `input: ${bad}`);
  }
});
