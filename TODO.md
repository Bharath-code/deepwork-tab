# Remaining Tasks

*As of 2026-07-18. Streaks (#1 of retention plan) shipped.*

## Build (retention plan)

- [ ] **First-run intercept during onboarding** — installed with tabs > cap → onboarding ends with "you have 12 tabs, cap is 7 — close 5 or queue them". Activation on day zero.
- [ ] **Minimal weekly receipt** — popup section: intercepts this week, tabs queued, top distraction domain. Future Pro upgrade surface (see PRICING.md — only upsell location).
- [ ] **Rotating intercept copy** — array of 3–4 calm lines on the intercept screen, avoids banner blindness.

## Product (README/PRICING gates)

- [ ] **Cloudflare Worker for `PING_URL`** — D14 heartbeat disabled until this exists; Day-30 gate depends on it. Do early so data collects from day one.
- [ ] **Name collision check** — Chrome Web Store search for "DeepWork Tab" (fallbacks: Tab Budget, browserfocus, onetab-mode)
- [ ] **Dogfood 7 straight days** — gates the entire paid layer
- [ ] **Publish to Chrome Web Store**

## Gated (do NOT start until dogfood gate passes)

Paid layer: ultra focus sessions, YouTube de-pandora, stuck ramp, snooze queue, full weekly receipt. Pricing: PRICING.md.

## Skipped deliberately

Badges, points, leaderboards, re-engagement notifications — attention-grabbing mechanics poison an anti-distraction product. Everything on README's NEVER BUILD list.
