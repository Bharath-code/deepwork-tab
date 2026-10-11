# Licensing, Privacy & Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This is a **multi-subsystem master plan**: before executing a phase, expand that phase's tasks into step-level TDD plans (`docs/superpowers/plans/YYYY-MM-DD-<phase>.md`) using the interfaces, schema and test cases fixed here.

**Goal:** A paying customer can buy, activate, renew, lapse, refund, move devices, export and delete their data. Every state works end to end. Free users get product analytics only if they consent. Nobody's browsing data leaves their machine.

**Architecture:** Local-first extension (unchanged), plus one Cloudflare Worker (`api/`) on a custom domain. Lemon Squeezy is Merchant of Record and owns billing PII, tax and invoices. The Worker keeps a minimal license ledger in D1 (EU jurisdiction), driven by signed webhooks. It issues short-lived ECDSA **entitlement tokens** that the extension verifies offline with the code it already has. Analytics are consented, anonymous and aggregated at write time, so no per-user rows exist.

**Tech Stack:** Vanilla MV3 + ES modules (no build step, no runtime deps) · Cloudflare Workers, D1 (`--jurisdiction=eu`), KV (EU), Workers Rate Limiting binding · R2 (EU, phase 3 only) · Lemon Squeezy (hosted checkout, License keys, Webhooks) · `node:test` + built-in `node:sqlite` as a D1 test double.

**Spec:** this document §1–§6 · `docs/STRATEGY.md` (north star, evidence ladder, stage gates) · `README.md` NEVER BUILD · `PRODUCT.md` · `PRICING.md` ($29/yr, $59 lifetime) · `site/privacy.html` (current promises) · `TODO.md` (Lemon Squeezy + domain items).

---

## 1. Decision: accounts vs. license key vs. hybrid

### Options

| | A. Full accounts + cloud data | B. License key + local only (today) | **C. Local-first + license ledger (recommended)** |
|---|---|---|---|
| What lives on our servers | Email, password/OAuth, queue URLs, reasons, settings | Nothing (key is offline-signed) | License hash, plan, paid-through date, device list. Billing PII stays at Lemon Squeezy |
| Annual subscription works? | Yes | **No**: key never expires, so $29/yr behaves as lifetime | Yes: 30-day tokens, refreshed weekly |
| Refund / chargeback revocation | Yes | No | Yes |
| Device moves | Yes | Paste key again | Paste key again; least-recently-seen device evicted |
| Data survives reinstall/new laptop | Yes (synced) | **No** | Yes, via local JSON backup (Free) and optional E2E-encrypted backup (Pro, phase 3) |
| GDPR surface | Large: browsing history can reveal Art. 9 special-category data (health, religion, politics), plus DSARs and breach exposure | ~Zero | Small: licensing data only; no browsing data |
| Brand promise ("No browsing history leaves your machine") | **Broken** | Kept | Kept |
| `README.md` NEVER BUILD | **Violates "Sync"** | OK | OK (phase 3 backup needs an explicit README amendment) |
| Build cost for a solo founder pre-PMF | Weeks + ongoing ops | 0 | ~4–6 focused days for phases 0–2 |

### Recommendation: **C**

Typical practice for privacy-positioned paid extensions and indie desktop tools (Cold Turkey, one sec and similar) is a **licence key with server-side validation, data local, export always available**. Accounts plus cloud sync tend to appear only once multi-device sync *is* the product. Here, sync is on NEVER BUILD.

Three principles that settle the "data lost over time" question:

1. **A lapsed payment never destroys or locks data.** Pro features become absent and everything else keeps working. Export is never gated. This is also what GDPR Art. 20 portability expects.
2. **Data loss is a device problem, not a licensing problem.** `chrome.storage.local` lives until uninstall. Loss happens on uninstall, profile reset or a new machine. The fix is backup/restore, not accounts.
3. **Offline must not punish payers.** Tokens last 30 days and refresh weekly, so an API outage or a flight never turns Pro off.

> Honest limit: in an open-source, client-side extension, any Pro check can be patched out. That is accepted for a $29 tool. Do not invest in DRM. The server exists to make renewals, refunds and devices *correct*, not to stop crackers.

Not legal advice. Before marketing to the EU, a one-hour review of §4 with a privacy lawyer is cheap insurance.

---

## 2. System design

```
                ┌──────────────────────── Lemon Squeezy (Merchant of Record) ────────────────────────┐
  buyer ──────▶ │ hosted checkout · VAT/GST · invoices · email w/ license key · customer portal (billing)│
                └───────────────┬──────────────────────────────────────────────▲─────────────────────┘
                                │ signed webhooks (X-Signature HMAC-SHA256)     │ License API validate
                                ▼                                              │ (fallback on race)
 ┌────────────── api.<domain>  (Cloudflare Worker: api/) ──────────────────────┴──────────┐
 │ /v1/webhooks/lemonsqueezy   /v1/licenses/{activate,refresh,deactivate}                 │
 │ /v1/privacy/{export,delete} /v1/ping  /v1/ping/forget  /v1/usage  /v1/subscribe        │
 │ /v1/stats (Bearer)          cron: retention purge + webhook-failure check              │
 │  bindings: DB (D1, eu) · PINGS (KV, eu) · RL_* (ratelimit) · secrets                   │
 └───────▲───────────────────────────────▲──────────────────────────────────────────────────┘
         │ fetch (token, consented ping) │ form POST
 ┌───────┴──────── Extension (local-first) ─┐   ┌──── site (static Worker) ────────────────┐
 │ storage.local: queue, reasons, rules,    │   │ pricing → plain links to hosted checkout │
 │   entitlement {token, iid, secret}       │   │ thanks.html · privacy · terms · refunds  │
 │ lib/entitlement.js verifies token offline│   │ no third-party scripts, no cookies       │
 └──────────────────────────────────────────┘   └──────────────────────────────────────────┘
```

### Flows

| Flow | Sequence | Failure behaviour |
|---|---|---|
| **Purchase** | Site link → LS checkout → LS emails key → webhooks `order_created` + `license_key_created` (+ `subscription_created`) → D1 upsert | Webhook retries are LS's job. Our handler is idempotent |
| **Activate** | Options: paste key → `POST /v1/licenses/activate {key, label}` → hash → D1 lookup (if missing: LS `validate`, then upsert) → enforce device limit (evict LRU) → return `{token, iid, secret, portalUrl}` | Bad key → 404 + human copy. Rate-limited → 429 + "try in a minute" |
| **Refresh** | SW alarm every 7 days (and on startup if `exp - now < 7d`) → `POST /v1/licenses/refresh {iid, secret}` → new token | Network error: keep current token until `exp`. `revoked`: drop Pro now |
| **Renewal** | LS `subscription_payment_success` / `subscription_updated` → `paid_through = renews_at` | n/a |
| **Cancel** | `subscription_cancelled` → `status=cancelled`, `paid_through=ends_at`. Tokens are capped at `paid_through` | Pro stays until period end |
| **Lapse** | `subscription_expired` → `status=expired`. Refresh returns `{status:'expired'}`. Client keeps token until `exp`, then Pro is absent | Data untouched. Receipt says "Pro ended {date}. Everything you saved is still here." |
| **Refund / dispute** | `order_refunded` / `license_key_updated (disabled)` → `status=refunded/disabled`. Refresh returns `revoked` | Pro off at next refresh (≤7 d) |
| **New device** | Paste the same key → new activation. If over `max_devices`, evict least-recently-seen | Never lock out a payer |
| **Lost key** | Link to LS "My Orders" (LS already lists keys). We store only a hash, so we cannot resend | — |
| **Export / delete (server data)** | Options → `POST /v1/privacy/{export,delete} {iid, secret}` | Email path for people without a device: manual, ≤30 days |
| **Telemetry** | Consent screen at onboarding → if yes: daily `POST /v1/ping {id}` + `POST /v1/usage {v, counts}` (no id) | No consent → zero network calls except licensing |

### Entitlement token (v2)

Same wire format as today: `b64u(payload).b64u(ECDSA-P256-SHA256 sig)`. The extension reuses `verifyWith`.

```json
{ "v": 2, "kid": "k2", "lid": "lic_…", "iid": "act_…", "plan": "annual|lifetime|legacy",
  "iat": 1760227200000, "exp": 1762819200000 }
```

- `exp = min(now + 30d, paid_through ?? ∞)` for `active`/`cancelled`. No token is issued for `expired | refunded | disabled`.
- No email in the token (data minimisation). Options shows `plan` and `exp`, not the email.
- `kid` lets the signing key rotate. The extension ships a `{kid: jwk}` map.
- Legacy v1 keys (`{e, t}` signed by today's key) stay valid as `plan:"legacy"` forever. Never break an early supporter.

---

## 3. Database schema (D1, `--jurisdiction=eu`)

`api/migrations/0001_init.sql`

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE customers (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  ls_customer_id  INTEGER UNIQUE,
  created_at      INTEGER NOT NULL,
  deleted_at      INTEGER
);

CREATE TABLE licenses (
  id                  TEXT PRIMARY KEY,
  customer_id         TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  key_hash            TEXT NOT NULL UNIQUE,
  key_last4           TEXT NOT NULL,
  plan                TEXT NOT NULL CHECK (plan IN ('annual','lifetime','legacy')),
  status              TEXT NOT NULL CHECK (status IN ('active','cancelled','expired','refunded','disabled')),
  ls_order_id         INTEGER,
  ls_subscription_id  INTEGER,
  ls_license_id       INTEGER UNIQUE,
  paid_through        INTEGER,
  max_devices         INTEGER NOT NULL DEFAULT 5,
  source_updated_at   INTEGER NOT NULL,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL
);
CREATE INDEX licenses_customer ON licenses(customer_id);
CREATE INDEX licenses_subscription ON licenses(ls_subscription_id);

CREATE TABLE activations (
  id            TEXT PRIMARY KEY,
  license_id    TEXT NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  secret_hash   TEXT NOT NULL,
  label         TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  last_seen_at  INTEGER NOT NULL,
  revoked_at    INTEGER
);
CREATE INDEX activations_license_live ON activations(license_id, revoked_at, last_seen_at);

CREATE TABLE webhook_events (
  id            TEXT PRIMARY KEY,
  event_name    TEXT NOT NULL,
  received_at   INTEGER NOT NULL,
  processed_at  INTEGER,
  error         TEXT
);

CREATE TABLE usage_daily (
  day      TEXT NOT NULL,
  version  TEXT NOT NULL,
  event    TEXT NOT NULL,
  count    INTEGER NOT NULL DEFAULT 0,
  reports  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, version, event)
);

CREATE TABLE privacy_requests (
  id            TEXT PRIMARY KEY,
  subject_hash  TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('export','delete')),
  requested_at  INTEGER NOT NULL,
  completed_at  INTEGER
);
```

Design notes:
- **`key_hash` = SHA-256(normalised key)**. The raw key is a bearer secret and is never stored. `secret_hash` follows the same rule for the per-device refresh secret.
- **`source_updated_at`** holds LS's `updated_at` from the payload. Handlers ignore events older than the stored value, so out-of-order delivery cannot resurrect a cancelled license.
- **`usage_daily`** aggregates on write. There is no install id and no per-user row, so it is not personal data. `reports` counts submissions and serves as the denominator.
- **`privacy_requests.subject_hash`** = SHA-256(email). It proves we honoured a deletion without keeping the email.
- Pings stay in KV (`i:<id>`, `idx:<id>`) with `expirationTtl` = 400 days.
- Times are epoch ms (`INTEGER`). `day` is UTC `YYYY-MM-DD`.

### Data inventory and retention (feeds the privacy policy and ROPA)

| Data | Where | Purpose | Lawful basis (GDPR Art. 6) | Retention |
|---|---|---|---|---|
| Tabs, queue, reasons, rules | Device only | Core function | n/a (never processed by us) | Until uninstall |
| Billing name, address, card, VAT | Lemon Squeezy | Payment, tax | LS as MoR/controller | LS policy (tax law) |
| Email, LS ids, license hash, plan, dates | D1 | Deliver/verify licence | Contract (6(1)(b)) | Licence life + 30 d, then deleted (tax records stay at LS) |
| Activation label ("Chrome on macOS"), last seen | D1 | Device limit | Contract | Revoked + 30 d |
| Install id + ping days | KV | D14 retention metric | **Consent** (6(1)(a) + ePrivacy 5(3)) | 400 d TTL, or immediately on opt-out |
| Aggregated event counts | D1 | Product decisions | Not personal data (aggregated, no id) | Indefinite |
| Waitlist email | KV `e:` | Launch email | Consent | Until unsubscribe, or 30 d after launch email |
| Webhook bodies | **Not stored** (id + name only) | Idempotency | Legitimate interest | 90 d |
| Worker logs | CF Workers Logs | Debugging | Legitimate interest | CF default; **no email/key/IP in log lines** |

---

## 4. Compliance checklist

**GDPR / UK GDPR**
- [ ] Art. 13 notice: privacy policy rewritten from §3's inventory, plain-language, versioned.
- [ ] Art. 6 basis per row (above). Consent for telemetry is freely given: equal-weight Yes/No buttons, no pre-ticked box, revocable in Options.
- [ ] Art. 15/20 access and portability: `/v1/privacy/export` + local JSON backup.
- [ ] Art. 17 erasure: `/v1/privacy/delete` + email path, ≤30 days. `privacy_requests` logs it.
- [ ] Art. 25 privacy by design: hashes not keys, no email in tokens, aggregate analytics, EU jurisdiction.
- [ ] Art. 28 processors: accept Cloudflare's DPA (Self-Serve Subscription Agreement + DPA). Lemon Squeezy acts as MoR for payments; record that in the subprocessor list.
- [ ] Art. 30 ROPA: `docs/privacy/ROPA.md`.
- [ ] Art. 33 breach runbook: `docs/privacy/BREACH.md` (72-hour clock, who and what to notify).
- [ ] Art. 44 transfers: data stored in EU jurisdiction. Cloudflare's DPA covers SCCs/DPF for edge processing.

**ePrivacy 5(3):** storing an install id on the device and reading it back for analytics needs consent. Licensing storage is "strictly necessary" and exempt.

**Chrome Web Store User Data Policy:** fill in the Privacy practices tab to match exactly. Limited Use certification. Prominent disclosure before any collection (the consent screen). No sale or transfer.

**India DPDP Act 2023 (+ Rules):** the same consent screen and notice satisfy the notice-and-consent model. Give grievance contact = privacy email. Breach → Data Protection Board notification (in the runbook).

**CCPA/CPRA:** below thresholds today. The "no sale/share" statement in the policy costs nothing.

---

## Global Constraints

- **No runtime dependencies, no build step.** The extension stays vanilla MV3. `api/` is plain ES modules with no framework and no router library. Tests use `node --test` + `node:sqlite`. CI moves to `node-version: '24'`.
- **NEVER BUILD** (`README.md`): AI classification · second brain · teams · **sync** · mobile · other browsers. Phase 3 backup requires a README amendment approved by the founder before any code.
- **No browsing data leaves the device.** Ever: no URLs, titles, domains or reasons in any request body, log line, or error.
- **Lapse never deletes or locks data.** Export is never Pro-gated.
- **Unlicensed Pro stays absent**, never disabled or teasing (existing rule). Never upsell on the intercept.
- **Only licensing calls happen without consent.** Ping and usage are off until the user says yes.
- **Secrets are never stored raw:** license keys and device secrets are stored as SHA-256 hashes. The signing key lives only in `wrangler secret`.
- **Site loads no third-party scripts and sets no cookies.** Checkout is a plain link to LS-hosted checkout, not `lemon.js`.
- **Every webhook is verified** (HMAC-SHA256 over the raw body, constant-time compare) before parsing.
- **Code style:** no explanatory comments. `ponytail:` marks a deliberate simplification and names its ceiling.
- **Copy:** calm, plain, no guilt. Error messages say what to do next.

## Review Focus

1. **Activation before the webhook lands.** The user pastes the key seconds after checkout and D1 has no row yet. Expected: activation succeeds via the LS `validate` fallback. → test in Task 1.4.
2. **Out-of-order or duplicate webhooks.** `subscription_updated` (older) arrives after `subscription_cancelled`, or any event is delivered twice. Expected: final status reflects the newest `updated_at`, with no double-insert. → tests in Task 1.2.
3. **Offline or API down for 3 weeks.** Expected: Pro keeps working until `exp`, with no error UI before then. → test in Task 1.3 (`entitlementState`) and Task 1.6.
4. **Reinstall on the same laptop five times.** Each reinstall is a new activation. Expected: the oldest is evicted and the payer is never told "device limit reached". → test in Task 1.4.
5. **Pasted key wrapped in email text, or LS UUID-format keys.** `extractLicenseKey` today only matches `b64u.b64u`. Expected: both LS keys and legacy keys are extracted. → test in Task 1.6.

---

## File Structure

| File | Responsibility |
|---|---|
| `api/wrangler.jsonc` (new) | Worker on `api.<domain>`; D1, KV, ratelimit bindings; cron |
| `api/migrations/0001_init.sql` (new) | Schema §3 |
| `api/src/index.js` (new) | Router + CORS + error boundary |
| `api/src/http.js` (new) | `json()`, `readJson()`, `authorizedBearer()`, `timingSafeEqual()` |
| `api/src/crypto.js` (new) | `sha256Hex()`, `hmacHex()`, `randomId(prefix)`, `signToken()` |
| `api/src/pings.js` (moved from `heartbeat/src/worker.js`) | `recordPing`, `forgetPing`, `computeStats` |
| `api/src/subscribe.js` (moved) | `normalizeEmail`, `subscribe` |
| `api/src/webhooks.js` (new) | Verify + dispatch LS events |
| `api/src/licenses.js` (new) | activate / refresh / deactivate + `issueToken` |
| `api/src/lemon.js` (new) | `validateWithLemon(key)`, the only outbound call |
| `api/src/usage.js` (new) | Allowlist, clamp, aggregate upsert |
| `api/src/privacy.js` (new) | export / delete + `privacy_requests` |
| `api/src/cron.js` (new) | Retention purge, stuck-webhook alarm |
| `test/helpers/d1.js` (new) | D1-shaped shim over `node:sqlite` running migrations |
| `test/api/*.test.js` (new) | One per `api/src` module |
| `lib/entitlement.js` | v2 tokens, `entitlementState`, LS key extraction, `isPro()` from token |
| `lib/backup.js` (new) | Pure: `buildBackup(storage)`, `validateBackup(json)` |
| `lib/usage.js` (new) | Pure: local counters, payload shaping, `interceptOutcome`, `heldMoments` |
| `lib/policy.js` (new), `managed_schema.json` (new) | Managed IT policy → effective settings (Task 2.6) |
| `lib/donation.js` (new), `api/src/research.js` (new) | Research cohort weekly summary + intake (Task 3.3) |
| `background/service-worker.js` | Refresh alarm, consented ping/usage, new API host |
| `options/*` | License panel, Privacy panel (consent toggle, backup, export/delete) |
| `onboarding` (in existing first-run surface) | Consent choice |
| `site/thanks.html`, `site/terms.html`, `site/refunds.html` (new); `site/index.html`, `site/privacy.html` | Checkout links + legal |
| `docs/privacy/{ROPA,BREACH,SUBPROCESSORS}.md` (new) | Accountability docs |

`heartbeat/` is deleted after the move. No public install exists yet, so the host change costs nothing now and more with every install.

### Shared interfaces (fixed here; every task uses these names)

```js
// api/src/crypto.js
export async function sha256Hex(str): Promise<string>
export async function hmacHex(secret, rawBody): Promise<string>
export function randomId(prefix): string            // 'lic_' | 'act_' | 'cus_' | 'prq_' + 22 b64u chars
export async function signToken(payload, privateJwk): Promise<string>

// api/src/licenses.js
export async function issueToken(license, activationId, now, env): Promise<string|null>
export async function activate(db, env, { key, label }, now): Promise<{status, token?, iid?, secret?, portalUrl?}>
export async function refresh(db, env, { iid, secret }, now): Promise<{status:'ok'|'expired'|'revoked', token?}>
export async function deactivate(db, { iid, secret }, now): Promise<{status:'ok'|'not_found'}>

// api/src/webhooks.js
export async function handleWebhook(db, env, rawBody, signature, eventName, now): Promise<{status:number}>

// lib/entitlement.js (extension)
export async function verifyEntitlement(token, keys /* {kid: jwk} */): Promise<{valid, plan, exp, iat, lid, iid, legacy}>
export function entitlementState(claims, now): 'active' | 'refresh_due' | 'lapsed'   // refresh_due = exp - now < 7d
export function extractLicenseKey(raw): string     // LS UUID or legacy b64u.b64u
export async function isPro(): Promise<boolean>    // reads storage.entitlement, verifies, state !== 'lapsed'
```

---

## Phase 0: Foundations (before any paid user)

### Task 0.1: Domain + `api/` Worker skeleton, pings and subscribe moved

**Files:** Create `api/wrangler.jsonc`, `api/src/{index,http,pings,subscribe}.js`, `test/api/pings.test.js`, `test/api/subscribe.test.js`. Move tests from `test/heartbeat.test.js`. Modify `manifest.json` (host_permissions → `https://api.<domain>/*`), `background/service-worker.js:8` (`PING_URL`), `site/privacy.html`. Delete `heartbeat/`.

**Interfaces:** Produces `json(data, status)`, `readJson(request, maxBytes=16384)`, `authorizedBearer(request, secret)`, and routes `GET /health`, `POST /v1/ping`, `POST /v1/subscribe`, `GET /v1/stats`.

**Acceptance criteria:**
- [ ] Domain bought; `api.<domain>` serves `GET /health → 200 {"ok":true}`.
- [ ] KV namespace recreated with `--jurisdiction=eu`. Every ping write sets `expirationTtl: 34560000` (400 d).
- [ ] Every existing heartbeat test passes against the moved modules (behaviour unchanged: server clock, 60-day trim, constant-time auth).
- [ ] Request bodies over 16 KB → 413. Unknown route → 404 JSON. Uncaught error → 500 JSON with no stack in the body.
- [ ] `manifest.json` lists exactly one host permission (the API host). `test/manifest.test.js` asserts it.
- [ ] Workers Logs enabled. A test asserts that the logger redacts any field named `email|key|secret|token`.

### Task 0.2: D1 schema + `node:sqlite` test double

**Files:** Create `api/migrations/0001_init.sql` (§3), `test/helpers/d1.js`, `test/api/schema.test.js`. Modify `.github/workflows/test.yml` (`node-version: '24'`), `api/wrangler.jsonc` (D1 binding `DB`).

**Interfaces:** Produces `createTestD1(): D1Like`, implementing `prepare(sql).bind(...args).{first(), all(), run()}` and `batch(stmts)` over `DatabaseSync(':memory:')` with every `api/migrations/*.sql` applied in order.

**Acceptance criteria:**
- [ ] `wrangler d1 create deepwork --jurisdiction=eu`. Migrations applied remotely with `wrangler d1 migrations apply`.
- [ ] Schema tests: inserting a license with `plan='monthly'` fails CHECK. Duplicate `key_hash` fails UNIQUE. Deleting a customer cascades to licenses and activations.
- [ ] The shim's `first()` returns `null` (not `undefined`) on no row, matching D1.
- [ ] CI is green on Node 24.

---

## Phase 1: Paid licensing end to end

### Task 1.1: Lemon Squeezy store configuration (manual, dashboard)

**Acceptance criteria:**
- [ ] Products: "DeepWork Tab Pro – Annual" $29/yr and "– Lifetime" $59, both with **license keys enabled, activation limit unlimited** (we enforce devices), and the key never expiring for lifetime.
- [ ] Variant ids recorded as Worker vars `LS_VARIANT_ANNUAL` and `LS_VARIANT_LIFETIME`. Store id as `LS_STORE_ID`.
- [ ] Webhook → `https://api.<domain>/v1/webhooks/lemonsqueezy` with events: `order_created`, `order_refunded`, `license_key_created`, `license_key_updated`, `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_resumed`, `subscription_expired`, `subscription_payment_success`. Signing secret in `wrangler secret put LS_WEBHOOK_SECRET`.
- [ ] Test mode: one annual and one lifetime test purchase. Fixtures saved (keys/emails replaced) to `test/fixtures/ls/*.json`.
- [ ] Confirmation email copy tells the buyer to open DeepWork Tab → Options → paste key, and links `thanks.html`.

### Task 1.2: Webhook endpoint

**Files:** Create `api/src/webhooks.js`, `api/src/crypto.js`, `test/api/webhooks.test.js`. Route `POST /v1/webhooks/lemonsqueezy`.

**Interfaces:** Consumes `sha256Hex`, `hmacHex`, `randomId`, `createTestD1`. Produces `handleWebhook(...)` and D1 rows per §3.

**Acceptance criteria:**
- [ ] Missing or wrong `X-Signature` → 401 and no DB write. The signature is computed over the **raw** body before `JSON.parse`, compared in constant time.
- [ ] Event id = `sha256Hex(rawBody)`. A replay → 200 with no second write (`webhook_events` PK).
- [ ] `license_key_created` upserts the customer (email lowercased) and the license (`key_hash`, `key_last4`, plan from variant id, `status='active'`). Unknown variant → row in `webhook_events.error`, 200 (no LS retry storm).
- [ ] `subscription_payment_success|updated|resumed` sets `paid_through = renews_at`. `cancelled` → `status='cancelled'`, `paid_through=ends_at`. `expired` → `'expired'`. `order_refunded` → `'refunded'`. `license_key_updated` with `status=disabled` → `'disabled'`.
- [ ] **Out of order:** fixture `updated(t=1)` processed after `cancelled(t=2)` leaves `status='cancelled'` (compares `source_updated_at`).
- [ ] Handler exception → 500 (LS retries) and `webhook_events.error` set. The raw body is never logged.

### Task 1.3: Token signing (server) + v2 verification and state (client)

**Files:** Modify `lib/entitlement.js`, `test/entitlement.test.js`. Create `api/src/licenses.js` (`issueToken` only), `test/api/token.test.js`.

**Acceptance criteria:**
- [ ] `issueToken` returns `null` for `expired|refunded|disabled`. For `cancelled`, `exp = min(now+30d, paid_through)`. For `lifetime|legacy`, `exp = now+30d`.
- [ ] `verifyEntitlement` accepts tokens signed by any `kid` in the key map and rejects an unknown `kid`, a tampered payload, or `v` ∉ {2}. It accepts legacy v1 `{e,t}` keys as `{plan:'legacy', exp: Infinity, legacy:true}`.
- [ ] `entitlementState`: `now < exp-7d` → `active`; `exp-7d ≤ now < exp` → `refresh_due`; `now ≥ exp` → `lapsed`. Table-driven tests incl. exact boundaries and `exp=Infinity`.
- [ ] Round-trip test: a token signed by `signToken` with a generated key verifies in `verifyEntitlement` (same WebCrypto code path on both sides).
- [ ] `tools/make-license.mjs --genkey` gains `--kid`. The private JWK goes only to `wrangler secret put TOKEN_SIGNING_JWK`.

### Task 1.4: Activate endpoint

**Files:** `api/src/licenses.js` (`activate`), `api/src/lemon.js`, `test/api/activate.test.js`. Route `POST /v1/licenses/activate`. Ratelimit binding `RL_LICENSE` (10 / 60 s per IP).

**Acceptance criteria:**
- [ ] Unknown key with `validateWithLemon` returning invalid → `404 {status:'not_found'}`. Rate limit exceeded → `429`.
- [ ] **Race (Review Focus 1):** key absent in D1 but LS says `valid, status active` → license row created from the LS response, activation succeeds. Test stubs `fetch`.
- [ ] Success returns `{status:'ok', token, iid, secret, portalUrl}`. D1 stores `secret_hash` only. `secret` is 32 random bytes in b64u.
- [ ] **Device limit (Review Focus 4):** with `max_devices=5` and 5 live activations, a 6th revokes the one with the oldest `last_seen_at` and succeeds.
- [ ] `label` is trimmed to 40 chars and must match `/^[\w .()-]+$/`, otherwise replaced by `"Browser"`.
- [ ] `expired|refunded|disabled` license → `403 {status}` with no activation row.

### Task 1.5: Refresh + deactivate endpoints

**Files:** `api/src/licenses.js`, `test/api/refresh.test.js`. Routes `POST /v1/licenses/refresh`, `POST /v1/licenses/deactivate`.

**Acceptance criteria:**
- [ ] Refresh with a valid `iid+secret` on an active license → new token and `last_seen_at = now`.
- [ ] Wrong secret, or a revoked activation → `{status:'revoked'}` (the same response for both, so callers cannot probe ids).
- [ ] License `expired` → `{status:'expired'}`. `refunded|disabled` → `{status:'revoked'}`.
- [ ] Deactivate sets `revoked_at` and is idempotent.

### Task 1.6: Extension license flow

**Files:** Modify `options/license.js`, `options/options.html`, `lib/entitlement.js`, `background/service-worker.js`, `test/entitlement.test.js`.

**Acceptance criteria:**
- [ ] **Review Focus 5:** `extractLicenseKey` returns the LS UUID from `"Your key: 38B1460A-5104-4067-A91D-77B872934D51 thanks"` and still extracts legacy `b64u.b64u` keys. Tests cover both, plus empty input.
- [ ] Activate stores `entitlement: {token, iid, secret}`. The **raw key is not persisted**. Legacy keys verify offline and need no network.
- [ ] Options shows: plan, "Renews/ends {date}" or "Lifetime", this device's label, **Remove this device**, **Manage billing** (portalUrl), and a link to LS My Orders for lost keys.
- [ ] SW: alarm `entitlement-refresh` every 24 h. It calls refresh only when `entitlementState` is `refresh_due`, or it has been 7+ days since `iat`. A network failure leaves storage untouched.
- [ ] `isPro()` derives from the verified token. A test asserts that a hand-set `pro:true` without a token returns false. Old `pro/proEmail` keys migrate on update: legacy key → legacy entitlement.
- [ ] Copy for every server status (`not_found`, `429`, `403`, offline) has one human sentence with a next step.

### Task 1.7: Lapse and revoke UX

**Files:** `popup/popup.js`, `lib/receipt.js`, `options/license.js`, relevant tests.

**Acceptance criteria:**
- [ ] With a `lapsed` or revoked entitlement: Pro features are absent (existing rule). The free cap, queue, intercept, gate and export all work. The queue and settings in storage are byte-identical before and after (test).
- [ ] An active focus session started under Pro runs to its end time even if lapse happens mid-session (sessions "cannot be ended early").
- [ ] The receipt (the only upgrade surface) says "Pro ended {date}. Everything you saved is still here." with a renew link. Nothing appears on the intercept.

### Task 1.8: Site checkout + legal pages

**Files:** `site/index.html`, create `site/thanks.html`, `site/terms.html`, `site/refunds.html`. Update `site/privacy.html`.

**Acceptance criteria:**
- [ ] Every `mailto:` buy link is replaced with plain `<a>` links to LS-hosted checkout (annual, lifetime). No `<script src>` to any third party. A test greps `site/*.html` for external script tags.
- [ ] `thanks.html`: 3 steps (copy key from email → Options → paste), plus a lost-key link.
- [ ] Refund policy states a clear window (recommend 14 days, no questions asked; this also covers the EU withdrawal right for digital content).
- [ ] Privacy policy rewritten from §3's inventory: names Cloudflare (EU storage) and Lemon Squeezy (MoR), lists retention, rights and how to exercise them, contact. "Last updated" changed.
- [ ] TODO.md items "Lemon Squeezy…" and "Swap the mailto: links…" checked off.

---

## Phase 2: Privacy, data ownership and product analytics (launch blocker)

### Task 2.1: Consent screen + consented ping + forget

**Files:** first-run surface, `options/*`, `background/service-worker.js`, `api/src/pings.js`, tests.

**Acceptance criteria:**
- [ ] First run shows: "Help improve DeepWork Tab? Sends a random ID once a day and anonymous counts like 'intercepts shown'. Never your tabs, sites or words." Two equal-weight buttons, no default. The choice is stored as `telemetry: 'yes'|'no'` with a timestamp.
- [ ] `telemetry !== 'yes'` → zero ping/usage requests (test with a stubbed `fetch`). Existing installs without the key are treated as `no` until asked.
- [ ] Options toggle. Turning it off calls `POST /v1/ping/forget {id}` (deletes `i:` and `idx:`), then rotates `installId`.
- [ ] `/v1/stats` output still computes D14 correctly on consented installs only.

### Task 2.2: Anonymous usage counters

**Files:** Create `lib/usage.js`, `api/src/usage.js`, tests. Modify SW, intercept, popup, options hooks.

**North star (`docs/STRATEGY.md` §3):** *held moments per weekly active user*. A held moment is an intercept whose outcome is anything except `opened`. Today `weekLog` records only `intercept` and `queue`, so outcomes must be logged first.

**Metric dictionary (allowlist, server-enforced):** `intercept_shown`, `intercept_queued`, `intercept_opened_anyway`, `intercept_closed`, `held_moment`, `gate_completed`, `gate_abandoned`, `queue_added`, `queue_restored`, `queue_exported`, `snooze_used`, `session_started`, `receipt_viewed`, `receipt_upgrade_clicked`, `pro_activated`, `backup_exported`, `backup_restored`, `pmf_very`, `pmf_somewhat`, `pmf_not`, `cap_bucket_1_3`, `cap_bucket_4_7`, `cap_bucket_8_15`, `cap_bucket_16_plus`.

**Interfaces:** Produces in `lib/usage.js`: `interceptOutcome(events, interceptTs, windowMs = 120000): 'queued'|'opened'|'closed'` and `heldMoments(weekLog): {intercepts, held, holdRate}`. `lib/receipt.js` reuses `heldMoments`.

**Acceptance criteria:**
- [ ] Intercept page logs exactly one outcome per intercept: `queue` (existing), `open` (passed the gate and opened the target), or `close` (dismissed, tab closed, or no action within 2 min). `weekLog` entries keep `{type, ts, domain}`; the domain never leaves the device.
- [ ] `heldMoments` table-driven tests: intercept→queue = held; intercept→open = not held; intercept with no outcome = held (abandoned); two intercepts back to back are matched to their own outcomes by timestamp order.
- [ ] Weekly receipt shows "{held} of {intercepts} held" as its first line (L0 evidence). It is shared via the existing share text.
- [ ] **PMF survey:** on the first popup open at install age ≥ 14 days, consented users only, one question asked once: "How would you feel if you could no longer use DeepWork Tab?" with three equal answers plus "Skip". The answer is sent as one count (`pmf_*`), then never asked again. Skip sends nothing.
- [ ] Counters accumulate locally and are sent at most once per UTC day as `POST /v1/usage {v, counts}`, **with no id**, only when consented. Reset after a 2xx.
- [ ] Server drops unknown events, clamps each count to 0–10 000, rejects `v` not matching `/^\d+\.\d+\.\d+$/`, and upserts `usage_daily` in one `batch()`. Ratelimit `RL_USAGE` 5/60 s per IP.
- [ ] `/v1/stats` returns the D14 rate + last-28-day totals per event, plus **HM/WAU** (`held_moment` ÷ distinct weekly `reports`), hold rate, PMF "very disappointed" share (with n), and funnels: intercept → queued %, gate completed %, receipt → upgrade click %.
- [ ] Test: a payload containing `url`, `title` or any key outside `{v, counts}` → 400, nothing stored.

### Task 2.3: Full local backup and restore (Free)

**Files:** Create `lib/backup.js`, `test/backup.test.js`. Modify `options/*`.

**Acceptance criteria:**
- [ ] "Download backup" writes `deepwork-backup-YYYY-MM-DD.json` `{schema:1, exportedAt, data:{cap, queue, reasonsByDomain, intents, rules…}}`. Excludes `entitlement`, `installId`, `telemetry`.
- [ ] "Restore from file" validates the schema and types, shows a summary ("142 queued tabs, cap 7"), asks to confirm, then **merges** the queue (dedupe by URL) and replaces settings. Invalid file → nothing changes.
- [ ] Restoring never loosens the cap instantly: a higher cap from the backup goes through the existing 60-second loosening wait.
- [ ] Options nudges a backup once a queue passes 50 items, with no recurring nag.
- [ ] Uses an `<a download>` blob, so no `downloads` permission is added.

### Task 2.4: Server export/delete + retention cron

**Files:** Create `api/src/privacy.js`, `api/src/cron.js`, tests. Modify `options/*`, `api/wrangler.jsonc` (cron `0 3 * * *`).

**Acceptance criteria:**
- [ ] `export {iid, secret}` → JSON of the customer row (email), licenses (no hashes), activations (labels and dates). Logs `privacy_requests(kind='export')`.
- [ ] `delete {iid, secret}` → deletes the customer (cascade) and logs `privacy_requests(kind='delete', subject_hash)`. The response explains that LS keeps invoices under tax law and links LS's privacy contact. The extension then clears `entitlement` but keeps local data.
- [ ] The email path is documented in the privacy policy: manual ≤30 days, done with a script `tools/privacy-delete.mjs <email>` that runs the same function.
- [ ] Cron: deletes `webhook_events` older than 90 d, revoked activations older than 30 d, customers whose every license has been expired, refunded or disabled for 30+ d. If any `webhook_events.processed_at IS NULL` is older than 1 h, it emits an `error`-level log (pair with a Workers Logs alert).

### Task 2.5: Accountability docs + store disclosures (manual)

**Acceptance criteria:**
- [ ] `docs/privacy/ROPA.md` (from §3's table), `SUBPROCESSORS.md` (Cloudflare, Lemon Squeezy), `BREACH.md` (detect → contain → assess → notify the lead EU authority within 72 h if risky / DPDP Board → notify users → postmortem).
- [ ] Cloudflare DPA accepted (dashboard). Date recorded in ROPA.
- [ ] Chrome Web Store Privacy practices tab: single purpose, permissions justifications, data-usage checkboxes match §3. Limited Use certified.
- [ ] One-hour privacy-lawyer review booked before EU-targeted marketing.

### Task 2.6: Managed policy for IT deployment (Stage 1.5 wedge)

**Precondition:** D14 ≥ 10%, and the founder approves in `README.md` that a configuration schema with no shared surfaces is *not* "Teams" (`docs/STRATEGY.md` §6).

**Files:** Create `managed_schema.json`, `lib/policy.js`, `test/policy.test.js`, `docs/ADMIN.md`. Modify `manifest.json` (`"storage": {"managed_schema": "managed_schema.json"}`), `background/service-worker.js`, `options/*`, `test/manifest.test.js`.

**Interfaces:** Produces `effectiveSettings(local, managed): {cap, workHours, rules, locked: string[]}`, where `locked` lists the keys the admin enforces.

**Acceptance criteria:**
- [ ] Schema keys: `defaultCap` (1–50), `enforceCap` (bool), `workHours` (same shape as the existing schedule), `exemptPatterns` (string[] ≤ 50), `telemetryAllowed` (bool, default false), `licenseKey` (string, optional, for volume licences).
- [ ] `effectiveSettings`: without `enforce*`, managed values are defaults the user may change. With `enforceCap`, the cap is locked and Options shows "Set by your organisation". Tests cover unset, default-only, enforced, and out-of-range values (clamped, never crashing).
- [ ] `telemetryAllowed: false` overrides user consent to `no`. The admin can only *prevent* collection, never force it.
- [ ] Managed `licenseKey` activates silently on install with label "Managed".
- [ ] The extension sends **nothing to the admin**. `docs/ADMIN.md` states this and shows Google Admin console + GPO JSON examples.
- [ ] Volume licence: an LS product with quantity, and an invoice option documented for orders over 10 seats.

---

## Phase 3: Gated (D14 ≥ 10 %, plus each task's own precondition)

### Task 3.1: End-to-end encrypted backup (Pro)

Precondition: README NEVER BUILD gains "Backup ≠ sync: one encrypted blob, manual restore, no merge" and is approved.

- [ ] The device generates a 256-bit recovery key, shown once as 24 base32 groups, with a "saved it" confirm. Data is AES-GCM encrypted with the recovery key (WebCrypto).
- [ ] `PUT/GET /v1/backup` (auth `iid+secret`) stores ciphertext ≤ 1 MB in R2 (`--jurisdiction=eu`) at `backups/<license_id>`. The server never receives the recovery key (test: request bodies contain no key material).
- [ ] Restore on a new device: activate → fetch → enter recovery key → the same validation and merge as Task 2.3.
- [ ] License delete removes the R2 object. Lapsed licences keep read access for 90 days (data is never held hostage).

### Task 3.2: Magic-link account page

Only if support email shows people without a device needing to manage licences.

- [ ] `site/account.html` → email → one-time link (token hash in D1, 15 min TTL, single use) → session cookie (`HttpOnly; Secure; SameSite=Strict`, 7 d) → view licences and devices, revoke devices, export/delete.
- [ ] Turnstile on the email form. Same response whether or not the email exists.

### Task 3.3: Research cohort (data donation)

**Precondition:** D14 ≥ 10%. A pre-registration draft (hypothesis: hold rate in weeks 3–6 > weeks 1–2; primary metric: hold rate) exists, ideally co-written with the academic partner from `GTM.md` §7.

**Files:** Create `lib/donation.js`, `test/donation.test.js`, `api/src/research.js`, `test/api/research.test.js`, `site/research.html`. Modify `options/*`, `api/migrations/0002_research.sql`.

**Interfaces:** Produces `weeklySummary(weekLog, settings, weekStart): {week, intercepts, held, queued, restored, daysWithinCap, cap}`. It contains integers only, plus the week index since joining.

**Acceptance criteria:**
- [ ] Separate opt-in from telemetry: a consent page explains the purpose, who sees the data (us, plus the named lab), retention, and withdrawal. Equal-weight buttons.
- [ ] On joining, the device creates a random `cohortId` unrelated to `installId`. Pre-survey (5 items) on join, post-survey at week 6.
- [ ] Before each weekly send, Options shows **the exact JSON** that will be sent, with "Send" / "Skip this week" / "Leave study". Auto-send is only allowed if the user ticks "send without asking".
- [ ] `weeklySummary` test: output keys are exactly the interface keys. A `weekLog` containing domains produces no string fields.
- [ ] `0002_research.sql`: `research_reports(cohort_id, week, payload_json, received_at)` and `research_withdrawals(cohort_id, at)`. Leaving deletes every row for that `cohort_id`.
- [ ] `site/research.html` publishes method, consent text, and (later) results, including null results.

**Explicitly not planned:** live cross-device sync, passwords, OAuth, team dashboards.

---

## Sequencing & effort

| Phase | Tasks | Est. | Blocks |
|---|---|---|---|
| 0 | 0.1, 0.2 | 1 d | Domain purchase |
| 1 | 1.1–1.8 | 3–4 d | LS account + test mode |
| 2 | 2.1–2.5 | 2.5 d | — (2.6 waits for the D14 gate + NEVER BUILD approval, ~1.5 d) |
| 3 | 3.1–3.3 | 4–5 d | D14 gate + demand / research partner |

Phases 0–2 sit on the critical path to the **2026-11-02** launch. Checkout should go live before the listing (`TODO.md`, `GTM.md` §5.4). Cost: Workers/D1/KV free tiers cover thousands of DAU. Workers Paid ($5/mo) is the first upgrade point.

## Open decisions (founder)

1. **Device limit:** 5 with LRU eviction (recommended), or 3.
2. **Telemetry default:** explicit choice with no default (recommended, consent-valid), or opt-out (more data, weaker under ePrivacy).
3. **Refund window:** 14 days (recommended), or 30.
4. **Domain name:** needed for Task 0.1.
