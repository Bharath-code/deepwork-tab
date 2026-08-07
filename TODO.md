# Remaining Tasks

*As of 2026-07-19. Retention plan build items shipped; launch plan below.*

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
- [ ] AC: listing submitted; status "pending review" or better — blocked on your Chrome Developer account

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
- [ ] **Dogfood 7 straight days** — gates the entire paid layer. AC: 7 consecutive days with the cap on and ≥1 organic intercept/day, tracked honestly (a missed day resets the count)
- [ ] **Publish to Chrome Web Store** — submission covered by launch item 2. AC: listing approved and publicly installable

## Gated (do NOT start until dogfood gate passes)

Paid layer: ultra focus sessions, YouTube de-pandora, stuck ramp, snooze queue, full weekly receipt. Pricing: PRICING.md.

## Skipped deliberately

Badges, points, leaderboards, re-engagement notifications — attention-grabbing mechanics poison an anti-distraction product. Everything on README's NEVER BUILD list.
