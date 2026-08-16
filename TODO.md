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
- [ ] **Pay the $5, create the Chrome developer account** ← the only thing between $0 and any revenue at all
- [ ] 5 screenshots @1280×800 + the 30s recording (`store-listing/listing.md` has the shot list and order)
- [ ] Lemon Squeezy: $29/yr + $59 lifetime products, licence-key email, replace all `mailto:` links
- [ ] Buy the domain; update the four canonical tags and the Worker URL
- [ ] Submit the listing
- [ ] Record the $19 founding reservations in-repo before the inbox loses them (`PRICING.md` promises them that price)
- [ ] File the GST LUT / talk to a CA before the first sale
- [ ] Metrics sheet, six numbers, weekly (`GTM.md` §8)
- [ ] Write the Show HN post in your own voice — the draft in `GTM.md` §5 is in mine, and HN can tell
- [ ] Rung 1 of the evidence play: publish your own numbers honestly, including what didn't work (`GTM.md` §7)

Nothing is charged until a payment link exists — the page still says so at the button.

## Product polish (0.3.0)

- [x] Restore-as-swap
- [x] No page-HTML fetch; ping-only host permission
- [x] YouTube optional, Pro-only
- [x] No toolbar badge
- [x] Intercept focus trap, Your-Words recall, 1–9
- [x] Gate trap, pin hint, license extract
- [x] Popup undo, 24px targets, session start
- [x] Alt+Shift+D / Alt+Shift+Q, uninstall page, CI

## Skipped deliberately

Badges, points, leaderboards, re-engagement notifications — attention-grabbing mechanics poison an anti-distraction product. Everything on README's NEVER BUILD list.
