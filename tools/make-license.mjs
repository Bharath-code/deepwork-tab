import { webcrypto as crypto } from 'node:crypto';
import { writeFileSync, readFileSync } from 'node:fs';

const ALG = { name: 'ECDSA', namedCurve: 'P-256' };
const SIG = { name: 'ECDSA', hash: 'SHA-256' };
const b64u = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

if (process.argv[2] === '--genkey') {
  const pair = await crypto.subtle.generateKey(ALG, true, ['sign', 'verify']);
  const priv = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const pub = await crypto.subtle.exportKey('jwk', pair.publicKey);
  writeFileSync('license-private.jwk.json', JSON.stringify(priv, null, 2));
  console.log('Private key written to license-private.jwk.json — DO NOT COMMIT');
  console.log('Paste this into lib/entitlement.js as PUBLIC_KEY_JWK:');
  console.log(JSON.stringify({ kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y }, null, 2));
  process.exit(0);
}

const email = process.argv[2];
if (!email) {
  console.error('usage: node tools/make-license.mjs <email>   (or --genkey)');
  process.exit(1);
}
const jwk = JSON.parse(readFileSync('license-private.jwk.json', 'utf8'));
const key = await crypto.subtle.importKey('jwk', jwk, ALG, false, ['sign']);
const payload = new TextEncoder().encode(JSON.stringify({ e: email, t: Date.now() }));
const sig = await crypto.subtle.sign(SIG, key, payload);
console.log(`${b64u(payload)}.${b64u(sig)}`);
