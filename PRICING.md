# Pricing Strategy

*Drafted 2026-07-18, pre-launch. Do not act on this until roadmap gates pass (README).*

## Positioning

Selling **kept commitments**, not tab management (tab management is free everywhere — OneTab, tab groups). Competitive band:

| Alternative | Price |
|---|---|
| OneTab / tab groups | Free |
| one sec | ~$5/mo |
| Freedom | $8.99/mo, $99 lifetime |
| Cold Turkey | $59 one-time |

Price between one sec and Freedom.

## Structure

- **Value metric: flat fee.** No seats, no usage metering (charging per focus session punishes the behavior the product builds).
- **One paid tier.** Single persona: "opens 30 tabs, escapes to YouTube."
- **Free forever**: cap, intercept, gate, queue, streaks — everything that forms the habit. Pricing must never fight the D14 metric.
- **Pro**: ultra focus sessions, YouTube de-pandora, stuck ramp, snooze queue, full weekly receipt.

## Price points

- **$29/year** headline (≈$2.40/mo, under subscription-resentment threshold; annual matches the habit arc, near-zero churn ops for a solo maintainer)
- **$59 lifetime** as anchor/second option (decoy effect; captures subscription-fatigued buyers; ~zero marginal cost)
- **No monthly at launch** — add only if the $29 page shows abandonment
- First 50 customers: visible founding price **$19/yr → $29**, grandfathered

## Sequencing

1. ~~**Now: nothing.** Week-2 gate (dogfood 7 straight days) and Day-30 gate (D14 ≥10%) first.~~ — dogfood gate passed 2026-08-07. D14 gate still open (needs a published listing to measure).
2. **Gates pass** → put price live before features are polished. Stripe payment link or ExtensionPay. Real click-throughs are the pricing research. — **live 2026-08-07** at `site/index.html#pricing`, as *reservations* rather than charges: the four Pro features don't exist yet, so the button locks the $19/yr founding price and takes no money. Payment link goes in when the first reservation lands.
3. Upgrade surface = **weekly receipt only**. Never upsell on the intercept screen. — implemented, `popup/popup.html`.

## Pricing page

- Two columns (Free vs Pro), Pro highlighted; lifetime as a text link under the Pro button, not a third column
- Pro column leads with outcome ("Break the YouTube spiral"), not features
- FAQ: what stays free forever · 14-day no-questions refund · why not monthly

## Skip

Tiering research, MaxDiff, enterprise/team pricing (NEVER BUILD), regional pricing, price A/B tests (no volume for significance — pick and watch).
