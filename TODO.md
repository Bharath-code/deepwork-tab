# Remaining Tasks

*Synced 2026-10-12 with `docs/MASTER_PLAN.md` §8, `docs/DESIGN_V2.md` §16 and the licensing plan. Launch target: Mon Nov 2 (HN), Tue Nov 3 (PH).*

## Now (2026-10-12)

- [x] Chrome developer account paid ($5)
- [x] Brand mark: Lens "focus segment" (`brand/`, PR #11). Gold accent and keep "DeepWork Tab" through D14 decided (`docs/DESIGN_V2.md` §16)
- [ ] **Buy `deepworktab.com`** (+ `.app` optional; both unregistered per registry RDAP on 2026-10-12). Unblocks licensing plan Task 0.1, canonical tags, share card
- [ ] Decide by Oct 22: land DESIGN_V2 P0–P3 (~3.5 days) for the screenshots, or submit v0.3.0 as is. `icons/` switches to `brand/png/` with P0
- [ ] Answer the rest of DESIGN_V2 §16: theme default · rituals opt-in · Queue → Shelf
- [ ] 5 screenshots + 30s recording → submit listing
- [ ] Payments: licensing plan Phase 1 (`docs/superpowers/plans/2026-10-12-licensing-backend.md`) supersedes the "Lemon Squeezy, ~30 min" item below

## Behavioral canon (added 2026-10-12, from `docs/MASTER_PLAN.md` §1 + `docs/DESIGN_V2.md` §2.3)

Already shipped: cap + intercept (Newport), 60s gate with your words (Clear), Alt+Shift+Q queue + Markdown export (Fogg), intent box + reason recall (Eyal), Pro focus session = single-handling block (Tracy/Keller), streaks. Not built yet, all local-only, no new permissions. Tier follows `PRICING.md`: whatever forms the habit is free.

| # | Item | Author | Tier | Phase |
|---|---|---|---|---|
| 1 | The One Thing (morning ritual) | Keller, Tracy | Free | P5 |
| 2 | Shutdown (end of work hours) | Newport | Free | P5 |
| 3 | Breath Minute (gate paced as 6 breaths) | Eyal | Free | P3 |
| 4 | Shelf note (intent saved with the queued page) | Fogg | Free | P5b |
| 5 | Name the feeling (5 optional chips on intercept) | Eyal | Free | P5b |
| 6 | Ask me in 10 min (re-offer queued page) | Eyal | Free (decided 2026-10-12) | P5b |
| 7 | Identity framing ("I'm someone who…") | Clear | Free | P5b |
| 8 | Never-miss-twice streak | Clear | Free | P5b |
| 9 | 66-day path (Building/Settling/Becoming automatic) | Keller/Lally | Free | P5b |
| 10 | Ease-in cap (15 → 7, one a day) | Fogg | Free | P5b |
| 11 | Frog first (shelf collapsed until One Thing done or noon) | Tracy | Free | P5b |
| 12 | Friday triage (keep / let go, one key) | Tracy | Free | P5b |

- [ ] AC (1): first tab of a work day opens S-06 in place; `Esc` skips; never asks twice a day; then continues to the requested URL
- [ ] AC (2): alarm at schedule end; shown on next open within 2h else skipped; "Shelve all" files tabs into a dated shelf group
- [x] AC (3): ring locked to the 60s timer; Cancel is default focus; reduced motion → static ring + captions
- [ ] AC (4–5): `note` ≤140 chars on queue items; feeling logged as `{type:'feeling',value,ts}` in `weekLog`, never sent anywhere; Ledger shows "Most reaches: *stuck* (n)"
- [ ] AC (6): `remindAt = now+10m`, re-offered as one quiet line on the next intercept/popup open; reuses `lib/snooze.js`
- [ ] AC (8): one loosened day keeps the streak, two consecutive break it — test in `test/`
- [ ] AC (10): lowering is tightening → instant, no gate; pure function + test
- [ ] AC (all): no badges, points or notifications (see Skipped deliberately)

## Launch plan (priority order, with acceptance criteria)

### 1. First-intercept explainer
One-time extra line on the very first intercept explaining the queue is safe.
- [x] AC: first intercept ever shows one added sentence ("Queued tabs aren't lost — reopen them anytime from the popup"); flag persisted in `chrome.storage`
- [x] AC: second and later intercepts never show it (survives service-worker restart)
- [x] AC: line meets AA contrast in light + dark, no new animation

### 2. Store listing + privacy policy → submit
Review takes days; start the clock before dogfood gate finishes.
- [x] AC: privacy policy page live at a public URL; states "no browsing history leaves your machine; one anonymous daily ping" and names the CF worker endpoint's data (install id + day only) — **live 2026-08-07**: https://deepwork-tab.kumarbharath63.workers.dev/privacy
- [x] AC: every `manifest.json` permission has a one-line justification written for the review form — `store-listing/permissions.md`
- [ ] AC: 5 screenshots (intercept, queue, popup, options, first-run) at 1280×800; 30s screen recording of hitting the cap → queueing → recovering a tab — needs real capture, blocked on you
- [ ] AC: listing submitted; status "pending review" or better — account paid; blocked on the assets

### 3. Landing page (static, CF Pages)
One `site/index.html` — no framework. Astro only when a second page (blog/SEO) exists.
- [ ] AC: page live on Cloudflare Pages with: headline, ≤20s video/gif of the intercept, 3-line how-it-works, privacy sentence, Web Store install link — **deployed 2026-08-07** at https://deepwork-tab.kumarbharath63.workers.dev; still missing the demo gif (`<img>` commented out until the asset exists) and the Web Store URL (CTA is an honest "submitted" line for now)
- [x] AC: no JS frameworks, no analytics beyond CF's built-in; Lighthouse perf + a11y ≥ 95 — no JS at all, reuses `shared/tokens.css`; re-verify with Lighthouse once deployed
- [x] AC: repo layout is `site/` alongside extension root, own deploy script — `site/` created, deploy command in `site/README.md`

### 4. Reason recall
Intercept shows the last reason typed for the same domain.
- [x] AC: opening a domain previously excused shows "Last time you wrote: '<reason>'" with the reason typographically dominant
- [x] AC: reasons stored per-domain in `chrome.storage.local` only (never sent to worker), capped at 50 domains, oldest evicted
- [x] AC: no stored reason → line absent entirely (no empty-state filler)

### 5. Queue export
Copy queue as markdown links from the popup.
- [x] AC: one button in queue view copies `- [title](url)` lines to clipboard; confirmation via existing live-region
- [x] AC: empty queue → button hidden; queue untouched by export

## Build (retention plan)

- [x] **First-run intercept during onboarding** — installed with tabs > cap → onboarding ends with "you have 12 tabs, cap is 7 — close 5 or queue them". Activation on day zero.
- [x] **Minimal weekly receipt** — popup section: intercepts this week, tabs queued, top distraction domain. Future Pro upgrade surface (see PRICING.md — only upsell location).
- [x] **Rotating intercept copy** — array of 3–4 calm lines on the intercept screen, avoids banner blindness.

## Product (README/PRICING gates)

- [x] **Cloudflare Worker for `PING_URL`** — deployed 2026-07-19 (`deepwork-tab-ping` + PINGS KV + STATS_KEY); `PING_URL` live in `background/service-worker.js`.
- [x] **Name collision check** — Chrome Web Store 2026-07-19: “DeepWork Tab” clear; “Tab Budget” taken. Keep DeepWork Tab.
- [x] **Dogfood 7 straight days** — gates the entire paid layer. AC: 7 consecutive days with the cap on and ≥1 organic intercept/day, tracked honestly (a missed day resets the count) — **passed 2026-08-07**, self-reported 2+ weeks of daily use
- [ ] **Publish to Chrome Web Store** — submission covered by launch item 2. AC: listing approved and publicly installable

## Paid layer (dogfood gate passed 2026-08-07)

Per PRICING.md sequencing, **price goes live before the features are built** — click-throughs are the research. Status:

- [x] Pricing section on the landing page (`site/index.html#pricing`) — two tiers, Pro highlighted, lifetime as a text link, Pro leads with the outcome
- [x] Pricing FAQ — what stays free forever · why no monthly · refund
- [x] Upgrade surface wired: one quiet line in the popup weekly receipt → `#pricing`. **The only upsell location in the product. Never the intercept.**
- [ ] Swap the `mailto:` links for a real payment link. **Reordered 2026-08-08** — `GTM.md` §5.4: the missing checkout is a plausible reason no reservation lands, so it goes in *before* the listing, not after. Lemon Squeezy, ~30 min, MoR handles the India/GST question.
- [x] Build the features — all five shipped in 0.2.0
- [x] `$59 lifetime` link restored under the Pro button (`PRICING.md` specified it; the page had lost it — worth ~+26% Yr-1 revenue, `FINANCE.md` §5.2). One line to revert if you disagree.

## Go to market (added 2026-08-08 — see `FINANCE.md`, `GTM.md`)

The product is finished and unsold. Everything here beats another feature.

- [x] Store listing copy written — `store-listing/listing.md` (title/short description now carry the search terms; the old ones carried none)
- [x] Email capture on the site + `/subscribe` route on the ping Worker, privacy policy updated to match
- [x] Three SEO pages — `vs-freedom`, `too-many-tabs-open`, `adhd-too-many-tabs`
- [x] **Pay the $5, create the Chrome developer account**
- [ ] 5 screenshots @1280×800 + the 30s recording (`store-listing/listing.md` has the shot list and order)
- [ ] Lemon Squeezy: $29/yr + $59 lifetime products, licence-key email, replace all `mailto:` links
- [ ] Buy the domain (`deepworktab.com`, see Now); update the four canonical tags and the Worker URL
- [ ] Submit the listing
- [ ] Record the $19 founding reservations in-repo before the inbox loses them (`PRICING.md` promises them that price)
- [ ] File the GST LUT / talk to a CA before the first sale
- [ ] Metrics sheet, six numbers, weekly (`GTM.md` §8)
- [ ] Write the Show HN post in your own voice — the draft in `GTM.md` §5 is in mine, and HN can tell
- [ ] Rung 1 of the evidence play: publish your own numbers honestly, including what didn't work (`GTM.md` §7)

Nothing is charged until a payment link exists — the page still says so at the button.

## Continue-or-kill (added 2026-09-05 — see `RESEARCH.md`)

Call: **continue, ship, do not rebuild.** 7-day validation while the listing is in flight (n=10 sideloads, real checkout live):

- [ ] ≥8 / 10 type a real onboarding reason
- [ ] ≥7 / 10 hit intercept in the first hour
- [ ] ≥5 / 10 still enforcing at day 7, cap ≤10
- [ ] ≥3 / 10 click checkout, or ≥1 paid $29
- [ ] Listing actually submitted (assets; $5 account done)

Fail wow → the job is not this. Fail day-7 → they wanted OneTab. Fail checkout only → keep free, delay Pro. D14 ≥10% after a public listing still kills the product if it misses (`README.md`).

## Product polish (0.3.0)

- [x] Restore-as-swap
- [x] No page-HTML fetch; ping-only host permission
- [x] YouTube optional, Pro-only
- [x] No toolbar badge
- [x] Intercept focus trap, Your-Words recall, 1–9
- [x] Gate trap, pin hint, license extract
- [x] Popup undo, 24px targets, session start
- [x] Alt+Shift+D / Alt+Shift+Q, uninstall page, CI

## Launch hardening (added 2026-09-26 — delta audit)

### YouTube registered at runtime, not in the manifest
- [x] AC: `manifest.json` has no `content_scripts`; `scripting` added; YouTube script registered on optional grant, unregistered on revoke, re-synced on install/update/startup — `test/manifest.test.js`
- [ ] AC: fresh unpacked install shows no youtube.com line in the permission prompt; de-pandora still works after granting — manual check

### Heartbeat you can trust
- [x] AC: client `d`/`day` ignored, dates from the Worker clock — a forged `d:30` on day 0 is stored as 0
- [x] AC: 1 KV write per install per day, `idx:` only on first sight
- [x] AC: `/stats`, `/subscribers` need `Authorization: Bearer`; `?key=` returns 401; no CORS on admin routes
- [x] AC: `aged14` = first seen ≥14 days ago (was "pinged on day 14+", which made `d14Rate` always 1.0) — `test/heartbeat.test.js`
- [ ] AC: `wrangler deploy` from `heartbeat/`; `curl -H "Authorization: Bearer $STATS_KEY" …/stats` returns JSON

### Docs and copy match the code
- [x] AC: ping payload is `{ id, day }`, matching privacy policy and FAQ ("install ID and today's date")
- [x] AC: `scripting` listed in privacy policy, site permissions and `store-listing/permissions.md`
- [x] AC: PRICING band, RESEARCH/FINANCE limiter counts updated with URL + 2026-09-26
- [x] AC: site redeployed so the live privacy page shows "Last updated 2026-09-26" — deployed 2026-09-26 (version a5a3da9e)

## Skipped deliberately

Badges (including any day-66 "master" badge), points, leaderboards, re-engagement notifications — attention-grabbing mechanics poison an anti-distraction product. Everything on README's NEVER BUILD list.
