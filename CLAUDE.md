# DeepWork Tab

A focus mode for Chrome: hard tab cap, calm intercept, safe queue. Not a tab manager, not a blocker. Solo founder, public repo, local-first.

@DESIGN.md

## Commands

- Test: `npm test` (`node --test`, no deps). CI runs the same (`.github/workflows/test.yml`).
- Load the extension: `chrome://extensions` → Developer mode → Load unpacked → repo root.
- Site deploy: `cd site && cp ../shared/tokens.css . && npx wrangler deploy` (see `site/README.md`).
- Ping Worker deploy: `cd heartbeat && npx wrangler deploy`. It moves to `api/` in plan Task 0.1.
- License key (legacy): `node tools/make-license.mjs <email>`. `license-private.jwk.json` must never be committed.

## Architecture

- MV3, vanilla ES modules, no build step, **no runtime dependencies**.
- Decision logic is pure and tested in `lib/`. Chrome API calls stay in `background/`, `popup/`, `intercept/`, `options/`.
- The service worker is stateless: all state lives in `chrome.storage.local` and every handler re-reads it.
- Backend: Cloudflare Workers. `heartbeat/` = anonymous ping + waitlist (KV). `site/` = static site. Planned: one `api/` Worker with D1 (EU jurisdiction) for licensing.

## Rules (non-negotiable)

- **NEVER BUILD** (`README.md`): AI classification · second brain/notes/tags · teams · sync · mobile · other browsers. Changes need an explicit README amendment approved by the founder.
- **No browsing data leaves the device.** No URLs, titles, domains or typed reasons in any request, log or error.
- **Telemetry needs consent.** Only licensing calls are allowed without it. Analytics are aggregate-only, never a per-user row.
- **A lapsed payment never deletes or locks data.** Export is never Pro-gated. Unlicensed Pro is absent, not teased. Never upsell on the intercept.
- **Tightening is instant, loosening waits 60 seconds.** Closing must feel safe: no URL becomes unrecoverable.
- Code style: no explanatory comments. A `ponytail:` comment marks a deliberate simplification and names its ceiling.
- Copy: calm, honest, firm. No guilt, no engagement mechanics, no medical claims.
- Accessibility: WCAG 2.1 AA, 24px+ targets, visible focus, reduced-motion support.

## Where things live

| Topic | File |
|---|---|
| Product voice, principles | `PRODUCT.md` |
| Visual system | `DESIGN.md`, `docs/DESIGN_V2.md` |
| Moat, north star, evidence ladder, enterprise gates | `docs/STRATEGY.md` |
| Licensing, privacy, backend system design + DB schema | `docs/superpowers/plans/2026-10-12-licensing-backend.md` |
| Long-range plan (ceiling scenarios, not forecasts) | `docs/MASTER_PLAN.md` |
| Pricing / finance / GTM / research | `PRICING.md`, `FINANCE.md`, `GTM.md`, `RESEARCH.md` |
| Live task list | `TODO.md` |
| Founder strategy notes (private, gitignored, local only) | `founder/` |

## Key metrics

- **Kill line:** 30 days after a public listing, D14 actives ≥ 10% of installs aged ≥ 14 days, or maintenance mode.
- **North star:** held moments per weekly active user. A held moment is an intercept not followed by loosening the cap (raise, disable or new exemption via the delay gate) within 10 minutes (`docs/STRATEGY.md` §3).
