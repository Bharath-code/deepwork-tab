# Remaining Tasks

*As of 2026-07-19. Retention plan build items shipped; product gates left.*

## Build (retention plan)

- [x] **First-run intercept during onboarding** — installed with tabs > cap → onboarding ends with "you have 12 tabs, cap is 7 — close 5 or queue them". Activation on day zero.
- [x] **Minimal weekly receipt** — popup section: intercepts this week, tabs queued, top distraction domain. Future Pro upgrade surface (see PRICING.md — only upsell location).
- [x] **Rotating intercept copy** — array of 3–4 calm lines on the intercept screen, avoids banner blindness.

## Product (README/PRICING gates)

- [x] **Cloudflare Worker for `PING_URL`** — deployed 2026-07-19 (`deepwork-tab-ping` + PINGS KV + STATS_KEY); `PING_URL` live in `background/service-worker.js`.
- [x] **Name collision check** — Chrome Web Store 2026-07-19: “DeepWork Tab” clear; “Tab Budget” taken. Keep DeepWork Tab.
- [ ] **Dogfood 7 straight days** — gates the entire paid layer
- [ ] **Publish to Chrome Web Store**

## Gated (do NOT start until dogfood gate passes)

Paid layer: ultra focus sessions, YouTube de-pandora, stuck ramp, snooze queue, full weekly receipt. Pricing: PRICING.md.

## Skipped deliberately

Badges, points, leaderboards, re-engagement notifications — attention-grabbing mechanics poison an anti-distraction product. Everything on README's NEVER BUILD list.
