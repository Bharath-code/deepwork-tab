# Financial & GTM Report — DeepWork Tab

*Prepared 2026-08-08. All forward figures are projections under stated assumptions, not results.*

## Legend
| Symbol | Meaning |
|--------|---------|
| → | leads to |
| MoR | merchant of record |
| ACV | annual contract value |

---

## 0. Position as of today

| Fact | Value | Source |
|---|---|---|
| Revenue to date | **$0** | no payment link exists (`TODO.md`) |
| Paying customers | **0** | reserve CTA is a `mailto:` |
| Installs | **0** | not published to Chrome Web Store |
| Product completeness | 5/5 Pro features shipped, v0.2.0 | `manifest.json`, git log |
| Live list price | $29/yr, single SKU | `site/index.html#pricing` |
| Blocking item | CWS developer account + 5 screenshots + 30s recording | `TODO.md` §2 |
| Cash invested | ~$5 (CWS fee, unpaid) + ~200 dev hours | estimated |

**The product is finished and unsold.** The constraint is not features, pricing, or market — it is a $5 Google developer registration and an afternoon of screen capture. Nothing else in this report matters until that ships. Every day the listing is unsubmitted is a day of zero-cost, zero-learning burn.

---

## 1. Market sizing

### 1.1 TAM — the vanity number and the useful one

**Vanity TAM** (the number a deck would show): ~3.83B Chrome users globally, of whom desktop Chrome holds 65.5% of desktop share; global knowledge workers ≈ 1.0–1.25B, giving roughly **800M knowledge workers on Chrome desktop**. × $29/yr = **$23.2B**. This number is useless — it assumes universal payment for a habit tool most people will not pay for.

**Useful TAM** — annual consumer spend on focus/digital-wellbeing software: Freedom (~2.5M users, $8.99/mo or $39.99/yr), Cold Turkey ($39 one-time), RescueTime, Forest, Opal, one sec, Serene, BlockSite. Category consumer revenue is not publicly consolidated; triangulating from Freedom's user base and typical 4–6% paid conversion, the whole consumer focus-software category is plausibly **$250–450M/yr worldwide**.

> **TAM ≈ $350M/yr** (consumer focus & distraction software, all platforms).

### 1.2 SAM — what a Chrome-only, individual-seat, English product can address

Filters applied to TAM:
- Chrome desktop extension only (no mobile, no Firefox/Safari — `README.md` NEVER BUILD) → cuts the mobile-first half of the category
- Individual seats only (no teams — NEVER BUILD) → removes the B2B wellbeing budget, which is where the category's largest cheques live
- English-language, self-serve, USD pricing
- "Tab overload" framing, not "website blocking" — a narrower, less-searched job

Installed base of focus/blocker Chrome extensions (StayFocusd, BlockSite, LeechBlock, Momentum, Strict Workflow, one sec web, and the long tail) is on the order of **8–12M installs**. Applying a 2–5% willingness-to-pay band at $29:

> **SAM ≈ $7–14M/yr. Midpoint $9M/yr.**

This is the honest ceiling of the business as currently scoped. It is a real market, and it is a small one.

### 1.3 SOM — capturable in 24 months, solo, unfunded, no distribution

Two multipliers stand between SAM and reality: **discovery** (a new CWS listing gets near-zero organic traffic in month one) and **retention** (the D14 gate).

Conversion must be computed off *active* users, not installs — this is where most extension revenue models lie to themselves:

```
installs → D14 actives (your gate: ≥10%) → payers (10–15% of engaged actives)
        = 1.0–1.5% install→paid conversion
```

A 3% install→paid rate — the figure quoted in most extension-monetization blogs — implies converting 30% of your own D14 actives. Do not plan on it.

| Scenario | Yr-1 installs | Conv. | Payers | Gross ARR | Net ARR (−7% MoR) |
|---|---|---|---|---|---|
| **Bear** — no launch push, CWS organic only | 800 | 1.0% | 8 | $232 | $216 |
| **Base** — one solid launch week, decaying tail | 5,000 | 1.2% | 60 | $1,740 | $1,618 |
| **Bull** — HN front page + PH top-5 + ADHD community traction | 25,000 | 1.5% | 375 | $10,875 | $10,114 |
| **Blue sky** — sustained content/SEO engine, 24mo | 100,000 cum. | 1.5% | ~1,500 net of churn | $43,500 | $40,455 |

> **SOM (24mo, realistic) ≈ $1.5K–$11K/yr. Stretch: $40K/yr.**

### 1.4 The absolute ceiling of the current SKU

If DeepWork Tab reached Freedom's scale — 2.5M users, a decade of brand — at 1.5% conversion and $29: **~$1.09M/yr gross**. That is the theoretical maximum of one $29/yr consumer SKU sold to individuals on one browser. It requires ~5 years and a category-defining brand.

**Answer to "what maximum can we earn at current pricing":**
- Year 1, realistic: **$1.7K–$11K**
- Year 2–3 with sustained distribution work: **$15K–$45K**
- Lifetime ceiling of this SKU without changing the value metric: **~$1M/yr**, low probability

---

## 2. Unit economics

| Metric | Value | Note |
|---|---|---|
| ARPU | $29/yr = **$2.42/mo** | single SKU |
| COGS per user | **~$0.00** | licence verified locally; CF Worker ping is free-tier |
| Gross margin | **~93%** | after MoR fees only |
| Payment cost | **~7% effective** | Lemon Squeezy/Paddle 5% + $0.50 + ~1.5% intl. Stripe direct ≈ 5.9% but no tax handling |
| Net per customer/yr | **$26.97** | $29 − 7% |
| Assumed annual renewal | **60–70%** | annual consumer productivity SaaS; no data yet |
| Avg. customer lifetime | **2.5–3.3 yrs** | 1 / (1 − renewal) |
| **LTV (net)** | **~$74** | $26.97 × 2.75 |
| Max sustainable CAC (3:1) | **~$25** | |

### 2.1 The finding that kills paid acquisition

```
Google Ads CPC (productivity keywords)     $1.50–3.00
Landing page → install                     ~2%
Install → paid                             ~1.5%
─────────────────────────────────────────────────────
CAC = $2.00 / 0.02 / 0.015              = $6,667 per customer
Max sustainable CAC                     = $25
Overshoot                               = ~265×
```

**Paid acquisition is not merely unprofitable here — it is off by two and a half orders of magnitude.** No creative, no landing-page optimisation, no lookalike audience closes a 265× gap. Every dollar of ad budget is a dollar destroyed. This constraint is structural at a $29 ACV and does not relax with scale.

Corollary: **all growth must be zero-marginal-cost** — content, community, store SEO, and the free tier itself.

### 2.2 Cost structure

| Item | Cost |
|---|---|
| Chrome Web Store registration | $5 one-time |
| Cloudflare Workers (heartbeat + site) | $0 free tier → $5/mo above 100K req/day |
| Custom domain | ~$12/yr — **not yet purchased** |
| MoR / payments | 5–7% of revenue, variable |
| **Total fixed annual cash cost** | **< $80/yr** |
| Opportunity cost (200 hrs @ $30/hr) | ~$6,000 sunk |

Cash break-even: **3 paying customers.** Break-even against sunk time at base-scenario conversion: **~207 customers ≈ 17,000 installs** — roughly the Bull scenario. Treat the build as spent; judge only forward decisions.

### 2.3 India-specific (verify with a CA)

- Export of services is **zero-rated under GST** — but you must file a **LUT (Letter of Undertaking)** to export without paying IGST upfront. Miss it and you pay 18% and reclaim it slowly.
- Stripe India has restrictions on international collections for unregistered individuals; an **MoR (Lemon Squeezy / Paddle / Dodo) removes the whole problem** at ~2 points of extra cost. At $2K–10K/yr revenue, 2 points is $40–200/yr — trivially worth not thinking about tax.
- Revenue is business income; below the presumptive-taxation threshold, §44ADA/44AD may apply.

> **Recommendation: Lemon Squeezy or Dodo Payments as MoR.** ExtensionPay (5% + Stripe underneath) is the tightest technical fit for extension licensing but leaves you as merchant of record — i.e. holding the global tax question yourself.

---

## 3. Startup metrics — targets and current state

| Metric | Definition | Target | Current |
|---|---|---|---|
| **D14 retention** | actives on day 14 ÷ installs | **≥10%** (your own kill gate) | unmeasurable — not published |
| D1 / D7 | | ≥40% / ≥20% | — |
| Activation | onboarding completed + reason typed + first intercept | ≥60% of installs | — |
| Install → paid | | 1.0–1.5% | — |
| Free → Pro (of D14 actives) | | 10–15% | — |
| Annual renewal | | ≥65% | — |
| Refund rate | 14-day no-questions policy | <5% | — |
| CAC | | **$0** (paid channels excluded) | — |
| LTV:CAC | | ∞ / n.a. | — |
| Burn | | <$80/yr | ~$0 |
| Runway | | infinite (no burn) | infinite |

**AARRR read:**
- *Acquisition* — the entire funnel is currently a zero. Single point of failure.
- *Activation* — genuinely strong. First-run handoff, reason capture, first-intercept explainer are all built. This is the part most extensions get wrong and you did not.
- *Retention* — the D14 heartbeat instrumentation exists and is deployed. You can measure the gate the day you publish.
- *Revenue* — a `mailto:` link. Not a funnel.
- *Referral* — **structurally absent.** No sharing surface, no viral loop, nothing. See §4.5.

---

## 4. Go-to-market

### 4.1 On "blitzkrieg" / blitzscaling — the direct answer

Blitzscaling is prioritising speed over efficiency in the face of uncertainty, **funded by capital, justified by winner-take-all network effects.** DeepWork Tab has:

- no network effects (my cap does not improve your cap)
- no viral loop
- no capital
- $29 ACV against a $6,667 paid CAC
- a NEVER BUILD list that forbids teams, sync, and mobile — the three usual scaling vectors

Blitzscaling this product means spending money you do not have to buy customers worth 1/265th of what they cost. **Do not do it.** Anyone selling you a growth-hacking playbook for a $29/yr solo Chrome extension is selling you their playbook, not your outcome.

What *is* available is **aggressive, zero-marginal-cost GTM** — high intensity, no burn. That is below.

### 4.2 Launch stack — one concentrated week

Sequence matters; each channel feeds social proof to the next.

| Day | Channel | Angle |
|---|---|---|
| Mon | **Show HN** (Tue 8–10am ET is the actual sweet spot; adjust) | "Show HN: A hard tab cap for Chrome, because my editor has a focus mode and my browser doesn't" — the README line is already the hook |
| Tue | **Product Hunt** | Lead with the intercept screenshot, not a feature list |
| Wed | **r/productivity, r/getdisciplined** | Framed as a build log, not a launch |
| Thu | **r/ADHD, r/adhdwomen** | See §4.3 — the highest-yield channel you are not using |
| Fri | **r/chrome_extensions, Lobsters, Indie Hackers** | Technical: MV3 stateless service worker, no-analytics privacy stance |
| Ongoing | **X / build-in-public** | Post the D14 number publicly, whatever it is |

Realistic yield from a well-executed version of this: **2,000–15,000 installs**, ~70% arriving in 96 hours, then a hard decay. Plan for the decay — a launch is not a channel.

### 4.3 The underexploited wedge: ADHD

r/ADHD has ~2M members. "Forty tabs open and I can't start anything" is not a metaphor there — it is a daily, named, painful symptom. And that audience buys tools.

Your product is almost accidentally well-designed for it:
- external structure instead of willpower (cap is real, gate holds)
- **no shame mechanics** — `PRODUCT.md` explicitly rejects guilt-trip design, which is precisely why ADHD users abandon most productivity apps
- "closing feels safe" (queue) directly addresses object-permanence anxiety, which is *the* reason people don't close tabs
- the delay gate is a working implementation of the pause-before-impulse that the whole category talks about

**None of this is in your positioning.** The site sells to "developers, writers, researchers." An ADHD-facing page — honest, non-clinical, no medical claims — is plausibly the highest-conversion segment available.

**But you cannot reach it by posting.** r/ADHD is among the most aggressively moderated subs on Reddit: "I built an ADHD app" posts are instant-removal and sometimes a ban, app promotion is confined to designated threads, and a ~50-page approved-resources wiki gates what may be linked. In 2024 the mods auto-blocked ADDitude Magazine, the largest ADHD publisher, as "quack practices." A solo dev's Chrome extension has no path through the front door.

**Sizing the channel honestly.** The roster is not the market:

```
2,000,000  members (inflated by the auto-subscribe era)
×  35%     monthly active                        →  700,000
×  65%     Chrome desktop                        →  455,000
×  60%     in a paying country                   →  273,000
×  50%     actually work in desktop tabs         →  137,000 addressable
```

One post that performs well on a 2M sub sees 20–60K views (typical: 1–5K) → 2–4% click → 10–20% install (warm) → 1.5–2.5% pay ≈ **5–10 customers, ~$150–300 per post**. Across the sub cluster (r/ADHD, r/adhdwomen ~600K, r/ADHD_Programmers, r/adhd_anxiety) over a year: **50–200 customers ≈ $1.5K–$6K** — a 2–3× on the Base scenario, which is worth having.

For scale: "2% of the subreddit buys" = 40,000 customers = $1.16M/yr, which would require ~2.67M installs at base conversion — 7–25% of the entire Chrome focus-extension category, from one subreddit. It is the §1.4 lifetime ceiling, not a channel forecast. **Off by roughly 200–400×.**

**Routes that respect the rules:**
1. **SEO capture, not posting.** People leave Reddit and search `chrome extension too many tabs adhd`, `adhd tab overwhelm`, `can't close tabs adhd`. Own those pages (§4.4). Same audience, same intent, no moderator.
2. **Smaller, looser subs first** — r/ADHD_Programmers, r/adhd_anxiety, r/ADHDers. Read each sidebar before posting.
3. **Be useful without pitching.** Answer tab-overwhelm threads as a person with the problem. Let others surface the tool.
4. **Approved-resources wiki** — the only sanctioned path into r/ADHD proper. Long game, worth one polite mod-mail once there is a public listing and reviews.
5. **The free tier is the entry.** Nothing about the habit is paywalled, which is the honest answer to "is this another app monetising my disorder."

### 4.4 Programmatic SEO — the compounding channel

Buyer-intent long tail, one static page each, no framework needed (matches `site/` architecture):

- `deepwork-tab-vs-freedom`, `vs-cold-turkey`, `vs-onetab`, `vs-stayfocusd`, `vs-one-sec`
- `chrome-tab-limit-extension`, `how-to-limit-tabs-in-chrome`, `too-many-tabs-open-fix`
- `youtube-sidebar-blocker`, `disable-youtube-autoplay-extension` (Pro feature, standalone search demand)

Comparison pages convert at multiples of homepage traffic because the visitor has already decided to buy *something*. Ten pages is a weekend. This is the channel that still delivers installs in month 18, when the launch spike is a memory.

### 4.5 Chrome Web Store SEO — the largest lever at scale

At maturity, CWS internal search drives most installs for utility extensions. Controllable:
- **Title**: currently "DeepWork Tab" — carries no keyword. Consider `DeepWork Tab — Tab Limit & Focus Mode for Chrome`
- **Short description**: your existing line is excellent copy and weak SEO. It needs "tab limit", "focus mode", "too many tabs" present.
- **Reviews**: ask for one in the weekly receipt after a 14-day streak — a genuinely earned moment, not a nag. Rating is a ranking input.
- **Screenshots**: the intercept screen is your entire pitch. Make it screenshot 1.

### 4.6 The missing referral loop

The **weekly receipt is a shareable artifact** and currently isn't one. "You intercepted 34 tabs this week. Top distraction: youtube.com. 12-day streak." — that is a screenshot people post. One "copy as image/text" button next to the existing markdown-export button is a few lines of code against infrastructure you already built, and it is the only viral surface this product can honestly have. It does not violate any anti-reference: no gamification, no leaderboard, no nagging — just the user's own data, portable.

### 4.7 Channels to reject

Paid search/social (§2.1), newsletter sponsorships ($500–2,000 for a $29 ACV), influencer deals, cold email, affiliate programmes (20% of $29 = $5.80 motivates nobody).

---

## 5. Pricing findings

### 5.1 The competitive band in `PRICING.md` is stale

`PRICING.md` cites **Freedom at $8.99/mo, $99 lifetime**. Current public pricing is **$8.99/mo or $39.99/yr**. The strategy document's core instruction — "price between one sec and Freedom" — was written against a wrong anchor.

At $29 vs $39.99, you are **27% cheaper than Freedom** while offering Chrome-only coverage against Freedom's all-device blocking across Mac, Windows, iOS, Android. On a features-breadth comparison a buyer runs in ten seconds, that is a losing trade — *unless* the buyer accepts your framing that this is a different job entirely (a tab cap, not a blocker). Your FAQ argues this well. But comparison-shoppers categorise before they read.

**Options, in order of preference:**
1. **Restore the $59 lifetime.** `PRICING.md` specifies it as a text link under the Pro button; `site/index.html` does not contain it. This is a live gap, not a decision — see 5.2.
2. **Hold $29 and win on framing**, leaning harder on "not a blocker" and on privacy (no data leaves the machine — Freedom cannot say this).
3. Drop to $19–24/yr only if the $29 page shows measurable abandonment. You have no traffic yet, so there is nothing to measure. Do not pre-emptively discount.

### 5.2 The lifetime tier is missing from the live page — recover it

For a solo unfunded operator, a $59 lifetime is disproportionately valuable:
- **Cash forward.** $59 today beats $29/yr at any renewal rate below ~100%, discounted.
- **Decoy effect.** A lifetime option makes $29/yr read as the cautious, cheap choice. Removing it removes the anchor and leaves $29 sitting alone next to Freedom's $39.99.
- **Zero marginal cost.** Local licence verification means a lifetime customer costs you nothing forever.
- **No churn ops.** The stated reason for annual-only.

Typical mix where both are offered: **20–35% choose lifetime.** At Base scenario (60 payers): 45 × $29 + 15 × $59 = $2,190 vs $1,740 — **+26% Yr-1 revenue** and better cash timing.

### 5.3 Honour the $19 reservations

`PRICING.md` commits to grandfathering anyone who reserved at $19. Track these by hand in a file before the inbox loses them. A broken price promise to your first ten users is expensive out of all proportion to $10.

### 5.4 The `mailto:` is costing you most of your conversions

A "Get Pro" button that opens an email client, requires the user to compose a message, and promises a licence key "by email" at some unstated future time is a multi-step, high-friction, low-trust checkout. Expect it to convert at a small fraction of a hosted checkout. `TODO.md` defers the payment link until "≥1 reservation lands" — that is backwards: the missing payment link is a plausible reason no reservation lands. **A Lemon Squeezy link is a 30-minute setup and should exist before the store listing goes live.**

---

## 6. The structural ceiling — stated plainly

`README.md` NEVER BUILD forbids: AI, notes, **teams**, **sync**, **mobile**, other browsers.

Three of those are the standard routes out of a low-ACV consumer tool:
- **Teams** — takes ACV from $29 to $8–15/seat/mo, i.e. 4–8× per user, against a buyer with a budget
- **Sync / cross-device** — justifies a higher price and reduces churn
- **Mobile** — where the distraction problem is larger and the category's money actually is

Holding that list caps the business at roughly the §1.4 figure and is **entirely defensible**: it is why the product is finished, coherent, and shippable by one person, and why it does not have the bloat that made you write the list. But it should be a chosen ceiling, not a discovered one.

> **This is a $2K–$45K/yr high-margin side business.** It is not a venture-scale startup, and no marketing strategy changes that within the current NEVER BUILD constraints. If the goal is a business rather than a well-made tool with income attached, the honest lever is the value metric — and that means reopening the list, deliberately, later, with data.

---

## 7. Roadmap

### Q3 2026 (Aug–Sep) — Ship and measure
**Goal: exit the zero.**

| # | Action | Gate |
|---|---|---|
| 1 | Pay the $5, create the CWS developer account | today |
| 2 | Capture 5 screenshots @1280×800 + 30s recording | this week |
| 3 | Add keywords to CWS title/short description (§4.5) | before submit |
| 4 | **Lemon Squeezy checkout + licence-key delivery, replacing the `mailto:`** | before submit |
| 5 | Restore the $59 lifetime link on the pricing page | before submit |
| 6 | Buy a real domain; move off `*.workers.dev` | before launch |
| 7 | Submit listing | **hard gate: nothing below starts until approved** |
| 8 | Record the $19 reservation list in-repo | this week |
| 9 | File the GST LUT / talk to a CA | before first sale |

*Exit criteria: listing live, checkout working, first dollar collected.*

### Q4 2026 (Oct–Dec) — Launch and read the gate
**Goal: measure D14 honestly.**

- Launch week, full stack (§4.2)
- ADHD-facing landing page + the ADHD search pages; smaller subs only, never r/ADHD directly (§4.3)
- Ship the shareable weekly receipt (§4.6)
- Ask for a store review at the 14-day streak
- **Day-30 gate from `README.md`: D14 actives ≥10% of installs.**
  - Pass → Q1 plan proceeds
  - Fail → maintenance mode, as written. Honour the gate; the whole point of writing it down was to bind your future self.

*Exit criteria: 2,000+ installs, D14 number known, 10+ paying customers.*

### Q1 2027 (Jan–Mar) — Compound or stop
**Goal: build the channel that still works in month 18.**

- 10 programmatic-SEO comparison pages (§4.4)
- Review price against real abandonment data — first moment there is data to review
- Reconsider monthly billing only if the $29 page shows abandonment (`PRICING.md` sequencing)
- Renewal cohort watch: first annual renewals land here if launch was Q4

*Exit criteria: organic installs exceeding launch-tail decay; ≥$3K ARR.*

### Q2 2027 — Decision point
Three honest branches:
1. **≥$15K ARR** → the ceiling is worth raising. Reopen NEVER BUILD deliberately: sync first (lowest philosophical cost, real price justification), teams second.
2. **$2–15K ARR** → a working side business. Maintenance + SEO only. Do not add features; the margin comes from not touching it.
3. **<$2K ARR after a real launch** → the market said no. Maintenance mode, keep it free, keep using it. The tool was worth building for one user regardless.

---

## 8. Recommendations, ranked by expected value

1. **Publish.** Everything else is theory. ($5 and one afternoon.)
2. **Replace the `mailto:` with a real checkout before launch, not after.** (§5.4)
3. **Restore the $59 lifetime.** +~26% Yr-1 revenue, better cash timing, restores the decoy anchor. (§5.2)
4. **Do not spend money on ads. Ever, at this ACV.** (§2.1)
5. **Test the ADHD wedge via SEO, not Reddit posts.** Highest-conversion segment available, but direct promotion in r/ADHD is instant-removal. Build the search pages instead. (§4.3)
6. **Ship the shareable weekly receipt.** The only honest viral loop available. (§4.6)
7. **CWS title/description keywords.** Largest long-run install lever. (§4.5)
8. **Update `PRICING.md`'s competitor table.** Freedom is $39.99/yr, not $99 lifetime. (§5.1)
9. **File the LUT.**
10. **Honour the D14 gate as written**, in either direction.

---

## Sources

- [Google Chrome Statistics 2026 — Backlinko](https://backlinko.com/chrome-users)
- [Web Browser Statistics 2026 — SQ Magazine](https://sqmagazine.co.uk/web-browser-statistics/)
- [Freedom vs Cold Turkey (2026) — FaithLock](https://www.getfaithlock.com/resources/freedom-vs-cold-turkey)
- [Cold Turkey Blocker Review (2026) — MakerStack](https://makerstack.co/reviews/cold-turkey-blocker-review/)
- [Chrome Extension Revenue Benchmarks by User Count (2026) — Chrome Goldmine](https://chromegoldmine.com/blog/chrome-extension-monetization/chrome-extension-revenue-benchmarks/)
- [Real Numbers: Freemium Chrome Extension Monetization After 6 Months — DEV](https://dev.to/ktg0215/real-numbers-freemium-chrome-extension-monetization-after-6-months-5hga)
- [8 Chrome Extensions with Impressive Revenue — ExtensionPay](https://extensionpay.com/articles/browser-extensions-make-money)
- [Monetize Chrome extensions with payments — ExtensionPay](https://extensionpay.com/)
- [Stripe vs Paddle vs Lemon Squeezy vs Gumroad: Fees Compared (2026) — GlobalSolo](https://www.globalsolo.global/blog/stripe-vs-paddle-vs-lemon-squeezy-2026)
- [Paddle vs Lemon Squeezy vs Playto Pay 2026: Which MoR Is Right for Indian Businesses?](https://www.playto.so/blogs/paddle-vs-lemon-squeezy-vs-playto-pay-india)
- [How to Monetize a Chrome Extension in 2026 — Dodo Payments](https://dodopayments.com/blogs/monetize-chrome-extension)
- [Best Focus and Distraction Blocker Chrome Extensions in 2026 — Unscart](https://www.unscart.com/blog/best-focus-extensions-chrome)
- [StayFocusd — Chrome Web Store](https://chromewebstore.google.com/detail/stayfocusd-%E2%80%93-website-bloc/laankejkbhbdhmipfmgcngdelahlfoji)
