export const PUBLIC_KEY_JWK = {
  kty: 'EC',
  crv: 'P-256',
  x: 'crrVWhnmxmzlQbIZNbEicQtf6b72W3bdXQGFkM45tHs',
  y: 'MICwNIXkzoU8JHQPuuVw6lOWTA8o6xkq3MIpJ17Nn1Y',
};

const ALG = { name: 'ECDSA', namedCurve: 'P-256' };
const SIG = { name: 'ECDSA', hash: 'SHA-256' };
const FAIL = { valid: false, email: null };

function fromB64u(s) {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(pad + '='.repeat((4 - (pad.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function verifyWith(licenseKey, jwk) {
  try {
    const [p, s] = String(licenseKey).split('.');
    if (!p || !s) return FAIL;
    const payload = fromB64u(p);
    const key = await crypto.subtle.importKey('jwk', jwk, ALG, false, ['verify']);
    const ok = await crypto.subtle.verify(SIG, key, fromB64u(s), payload);
    if (!ok) return FAIL;
    const { e } = JSON.parse(new TextDecoder().decode(payload));
    return typeof e === 'string' && e ? { valid: true, email: e } : FAIL;
  } catch {
    return FAIL;
  }
}

const KEY_RE = /[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/;

export function extractLicenseKey(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  if (!/\s/.test(s) && s.includes('.')) return s;
  const m = s.match(KEY_RE);
  return m ? m[0] : s;
}

export const verifyLicense = (licenseKey) => verifyWith(licenseKey, PUBLIC_KEY_JWK);

export async function isPro() {
  const { pro } = await chrome.storage.local.get('pro');
  return pro === true;
}
