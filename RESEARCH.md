# Continue-or-kill research — DeepWork Tab

*Written 2026-09-05. Companion to `FINANCE.md`, `GTM.md`, `PRICING.md`. Do not rebuild the product from this file. The call is already made.*

**Call: continue. Ship the listing. Do not start a second product.**

Labels used below: **fact** (cited) · **inference** · **unknown**.

---

## Legend
| Symbol | Meaning |
|--------|---------|
| → | leads to |
| CWS | Chrome Web Store |
| D14 | installs that ping on day ≥14 / installs aged ≥14 days |

---

## 0. Decision in one page

The product already matches the bar that was used to judge it: someone is already paying for the *nearby* pain, it is simple for a one-person team, it demos in 60 seconds with a live intercept, the UI is furniture not a dashboard, and it is not an AI wrapper.

The unknown is not “is this a real job.” The unknown is whether a **count-cap** retains. Adjacent invoices are $20–40/yr for friction tools. The exact job (cap how many tabs may be open) is a thin, hostile, free CWS category (~3,000 users on the featured limiter). That can mean “bad products” or “nobody wants a cap.” You cannot know which until the intercept is public.

**Kill criterion (unchanged from `README.md`):** 30 days after a public listing, D14 actives ≥10% of installs aged ≥14 days, or maintenance mode forever. Do not move the line if the number is 4%.

**Do not do:** invent a fourth product, clone one sec, clone OneTab/Workona, clone Freedom/StayFocusd, add AI, or spend on ads.

---

## 1. Problem statement

Knowledge workers (especially ADHD) use open tabs as working memory, then cannot close them, so the next impulsive tab becomes a lost afternoon — and every incumbent either organizes the pile, blocks named sites, or kills the tab instead of intercepting the count.

| Claim | Kind | Evidence |
|---|---|---|
| Tab hoarding is a named weekly behavior, not a metaphor | Fact | Bamonte, *ADHD and Tab Hoarding*, Different Brains, 2023-09-02: loss aversion + working-memory supplement; closing feels wrong. Medium (“I have 50 tabs open as of this writing”). LinkedIn, Jacob Dowdy, 2026-01: “I have 50 tabs open. In my browser, and in my brain.” |
| Operators already pay for a nearby job (impulse at the moment of weakness) | Fact | Freedom Premium $39.99/yr or $8.99/mo ([freedom.to/premium](https://freedom.to/premium), fetched 2026-09-05). one sec Pro $19.99/yr (US App Store). Cold Turkey Pro $39 one-time (2026 vendor reviews). PNAS 2023: one sec cut target-app openings 57% (N=280, 6 weeks) — [pnas.org/doi/10.1073/pnas.2213114120](https://www.pnas.org/doi/abs/10.1073/pnas.2213114120) |
| They are paying for *this* job (tab count as the commitment device) | Unknown | Featured CWS “Tab Limiter” has 3,000 users (fetched 2026-09-05). No public paid SKU found for a count-cap. Adjacent paid tools are site/app blockers and tab workspaces. |
| Existing limiters fail “closing feels safe” | Inference | Tab Limiter CWS copy: block the new tab, or automatically close the oldest. “Tab limit” (3,000 users, last update May 2022): the newly opened tab automatically closes. ADHD writeup recommends a cap of ~10 and names xTab / Tab Limiter — hostile close, no queue, no delay-to-loosen. |

HN recency discount (2020-09): one operator “closed 12000+ (not a typo) tabs” into OneTab; others report OneTab deleting state as “fatal.” [news.ycombinator.com/item?id=24503959](https://news.ycombinator.com/item?id=24503959).

---

## 2. Who feels it weekly, and what they currently pay

Buyer is a solo knowledge worker on Chrome desktop who already installed a blocker or a tab dump. Not a team. Not a parent buying Screen Time. Not an enterprise wellbeing budget.

| Who (weekly) | What they buy today | Invoice (public) | Kind |
|---|---|---|---|
| ADHD / impulse browsers who know the site (YouTube, Twitter) | Freedom, StayFocusd, BlockSite, Opal, one sec | Freedom $39.99/yr (official). one sec $19.99/yr. Opal Pro $99.99/yr (Timily, prices checked 2026-07-31). StayFocusd free, 700,000 CWS users (fetched 2026-09-05) | Fact |
| Researchers / founders who cannot close tabs for fear of loss | OneTab, Session Buddy, Toby, Workona | OneTab free, 2,000,000 CWS users. Toby Productivity $4.50/mo billed yearly = $54/yr ([gettoby.com/pricing](https://www.gettoby.com/pricing)). Workona Pro ~$8/mo in 2026 roundups — official [workona.com/pricing](https://workona.com/pricing) fetched 2026-09-05 did not print a dollar figure | Fact / unknown on Workona list price |
| Desktop-only “I will cheat any extension” users | Cold Turkey Pro locked blocks | $39 one-time (2026 reviews of vendor) | Fact on model; price via secondary |
| People who want a dashboard of where time went | RescueTime Solo Focus | $9/mo or $7/mo annual ≈ $84/yr (2026 aggregators, not rescuetime.com HTML) | Fact via secondary |

**Willingness to pay from invoices, not vibes.** Friction / commitment tools clear $20–40 per year (one sec, Freedom). Organization tools clear $54–96 per year when cloud sync is the product (Toby, Workona). DeepWork’s $29/yr sits in the friction band. That is the right comparable **only if** buyers experience it as a commitment device. If they experience it as “another tab manager,” they already have OneTab for $0 — **inference**.

This is consistent with `PRICING.md` (“price between one sec and Freedom”) and `FINANCE.md` (lifestyle SKU, not a venture). Year-1 realistic SOM in `FINANCE.md` remains ~$1.7K–$11K ARR.

---

## 3. Competitor map — by job, not category

Four jobs. DeepWork only claims job 1. Incumbents that look similar on a “productivity extension” shelf own a different job.

| Job they own | Who | Price / scale | They do well | Gap they leave |
|---|---|---|---|---|
| **Cap how many things I may have open** | Tab Limiter, Tab limit, xTab, Tab Limit Enforcer | Free. Featured Tab Limiter: 3,000 users, 4.2 from 55 ratings (CWS 2026-09-05). Tab limit: 3,000 users, last update May 2022 | Simple hard cap. Tiny binary | New tab is closed or oldest is killed. No queue, no intercept, no 60s delay to loosen. Hostile at the moment of weakness |
| **Collapse / organize the pile after it exists** | OneTab, Tab Wrangler, Session Buddy, Toby, Workona | OneTab free, 2.0M users, 4.4 from 14.6K ratings (CWS). Tab Wrangler ~70k, free. Toby $54/yr. Workona Pro ~$8/mo (secondary) | One-click dump, restore, sessions, workspaces. OneTab privacy copy is strong | Cleanup is after the binge. Does not stop the 8th tab. OneTab data loss is a known operator fear (HN) |
| **Block named sites / apps** | Freedom, StayFocusd, Cold Turkey, BlockSite | Freedom $39.99/yr (official). StayFocusd 700k users, 4.4 from 58.8K ratings (CWS). BlockSite vendor LP: 1M+ people. Cold Turkey $39 once | Cross-device (Freedom), nuclear lock (Cold Turkey Pro), time budgets (StayFocusd) | Asks *what site*. Misses “how many things were already open.” Bypassable (Trustpilot: private browsing, quit app, delete). StayFocusd last-100 rating 3.89 (tooltivity) — reliability/ads. Freedom Chrome extension 3.3 stars vs polished desktop app |
| **Insert a pause before a known vice** | one sec, Pause, Mindful Browsing, Intention | one sec CWS: 30,000 users, 4.9 from 1.2K ratings, IAP (fetched 2026-09-05). App Store Pro $19.99/yr. PNAS 2023 57% drop in openings | First-session wow. Science-backed. Not a dashboard | Requires you to name the vice in advance. Does nothing when the leak is “one more doc / HN / random tab” at cap |
| **Score my day so I feel guilty later** | RescueTime | ~$84/yr Solo Focus (secondary 2026). G2 4.2/94, Capterra 4.6/141 cited by 2026 roundups — G2/Capterra HTML not fetched this run | Automatic tracking. Focus sessions | Awareness after the fact. Wrong shape for “inevitable furniture” |

G2/Capterra for Freedom (~4.4, ~58 Capterra reviews) appear in 2026 roundups. Direct g2.com / capterra.com pages were not loaded on 2026-09-05 — treat those ratings as **secondary** until re-opened.

---

## 4. Three single-problem ideas (max)

Score 1–5. Crowding inverted (5 = empty). Build cost inverted (5 = cheap / already built). Total /30.

| Idea | Pain | Proof | Crowd | Build | Wow | Moat | Total | Build? |
|---|---|---|---|---|---|---|---|---|
| **A. Count-cap + intercept + queue (DeepWork Tab)** | 4 | 3 | 4 | 5 | 5 | 2 | **23** | **Yes — this product** |
| B. Site-pause friction Chrome-only (one sec clone) | 5 | 5 | 1 | 3 | 4 | 1 | 19 | No |
| C. Tab workspace / session SaaS (Workona-lite) | 4 | 4 | 1 | 2 | 2 | 1 | 14 | No |

**A** — Single problem: stop the next tab when count is already the leak. Already built. Demo is the intercept. Proof is adjacent (paid friction tools), not direct (3k limiter users, all free). Moat is store ranking + intercept craft, not IP.

**B** — one sec already owns this job: 30k Chrome users, 4.9 stars, PNAS, $19.99/yr. Building it is cloning a better-funded original.

**C** — OneTab is free at 2M users. Toby and Workona already collect the invoices. This becomes “another SaaS dashboard.” Violates the bar.

---

## 5. Recommendation and why

**Continue.** Ship the Chrome Web Store listing and a real checkout. Do not invent a fourth idea.

Why continue: the product already matches the bar. Vanilla MV3, no user accounts, Cloudflare ping only. Demoable in 60 seconds with a real intercept, not a Figma. UI is furniture. Not an AI wrapper. Someone is already paying $20–40/yr for the emotional job (“stop me at the moment of weakness”). The mechanical job (“count, not domain”) is a thin, hostile free category — that is a **gap**, not a graveyard, until measured.

Why not a bigger bet: still zero paying customers for this SKU. Tab-limiter install bases are two orders of magnitude below StayFocusd and OneTab. `FINANCE.md` already modeled year-1 base at ~$1.7K–$11K ARR — a lifestyle SKU, not a venture.

If D14 is 4%, post 4% and enter maintenance. That post is also the strongest content (`CONTENT.md` idea #6).

---

## 6. First wow demo (60 seconds)

Artifact is a live Chrome window with ~12 tabs, not a slide. The wow is the intercept, not the options page.

| t | Screen | Input | Output the other person sees |
|---|---|---|---|
| 0–10s | `chrome://extensions` → Load unpacked (or CWS install) | This folder | Onboarding opens. Not a settings dump |
| 10–25s | Options first-run | Type *their* reason. Cap stays 7 | If they already have >7 tabs: “you have N, cap is 7 — close or queue.” First wow if they came in dirty |
| 25–40s | Any site → Cmd/Ctrl+T | Open one more tab | Full-page intercept. URL preserved. Queue / close one / go back. Calm, not red |
| 40–50s | Intercept | Press Q (queue) or type a one-line intent | Tab is safe, not lost. OneTab’s job without dumping the whole window |
| 50–60s | Popup | Restore the queued item (swap if still at cap) | Receipt line: intercepts this week. Cap still on |

Fail the demo if you open options first, mention Pro, or show a dashboard. The holy-shit is “it caught me.” If they do not flinch, they wanted OneTab — **fact** about the demo, **inference** about the market.

---

## 7. Seven-day validation — pass / fail

Seven days cannot prove D14. It can only prove: the intercept fires, strangers keep the cap on, and someone will type a card number.

Sample: 10 people who already complain about tabs (ADHD Discords, r/productivity, coworkers). Sideload or unlisted CWS. Lemon Squeezy live even if the store is pending.

| Gate | Pass | Fail | Kind |
|---|---|---|---|
| Onboarding | ≥8 / 10 type a real reason (not “test”) | ≤5 type a reason or bounce at permissions | Behavior |
| First-session wow | ≥7 / 10 hit intercept in the first hour | ≤3 hit intercept (cap too high, or they never open tabs — wrong ICP) | Behavior |
| Day-7 retention of the cap | ≥5 / 10 still enforcing, cap ≤10 | ≥6 / 10 disabled or raised cap above 20 within 48h | Behavior — 7-day proxy for D14 |
| Willingness to pay | ≥3 / 10 click the real checkout, or ≥1 paid $29 | 0 checkout clicks after seeing the receipt upsell | Invoice, not survey |
| Store assets (you) | CWS account paid, 5 shots + 30s rec in the listing, submit clicked | Still “I’ll do assets next week” | Ops. If this fails, the research was theater |

If wow and day-7 pass but checkout is 0: keep the free core, delay Pro, do not add features. If wow fails: kill — the job is not this. If day-7 fails: kill — they wanted OneTab, not a cap.

The 30-day D14 gate in `README.md` still supersedes this once the listing is public.

---

## 8. What we will not build

Extends `README.md` NEVER BUILD. Each item is a different product or a crowded job we do not own.

| Out | Why |
|---|---|
| AI classification, summaries, “smart” tab groups | Generic wrapper. The intercept is the product |
| Notes, tags, second brain, teams, sync, mobile, other browsers | `README.md` NEVER BUILD |
| Full outbound / “focus OS” / RescueTime dashboard | Violates inevitable-furniture. Awareness is a different job |
| Site blocklists as the core loop (Freedom / StayFocusd clone) | Crowded, 700k-user incumbent, wrong question (what site vs how many) |
| Tab manager / workspace SaaS (OneTab / Toby / Workona clone) | 2M-user free incumbent. Cleanup after the binge |
| one sec breathing clone | 30k users, 4.9 stars, PNAS. Do not clone a better original |
| Paid ads | `FINANCE.md` §2.1: CAC ~$6,667 vs $25 sustainable at $29 ACV. Structural |

---

## Unknowns left on the table

- CWS search volume for “tab limit” / “too many tabs”
- Freedom and RescueTime G2/Capterra as primary HTML
- Workona’s exact Pro dollar price on workona.com
- Whether limiter categories are small because of hostile UX or because demand is small — that is what the 7-day and D14 gates exist to answer

---

## Sources (fetched 2026-09-05 unless noted)

- [Freedom Premium](https://freedom.to/premium) — $8.99/mo, ~$3.33/mo billed yearly, Forever $99.50 promo vs $199
- [StayFocusd CWS](https://chromewebstore.google.com/detail/stayfocusd-%E2%80%93-website-bloc/laankejkbhbdhmipfmgcngdelahlfoji) — 700,000 users, 4.4 / 58.8K ratings
- [Tab Limiter CWS](https://chromewebstore.google.com/detail/tab-limiter/ahifadmfdpgnjkchbmoafedinacdfomc) — 3,000 users, 4.2 / 55 ratings
- [one sec CWS](https://chromewebstore.google.com/detail/one-sec-website-blocker-s/femnahohginddofgekknfmaklcbpinkn) — 30,000 users, 4.9 / 1.2K ratings
- [OneTab CWS](https://chromewebstore.google.com/detail/onetab/chphlpgkkbolifaimnlloiipkdnihall) — 2,000,000 users, 4.4 / 14.6K ratings
- [Toby pricing](https://www.gettoby.com/pricing) — Productivity $4.50/mo yearly
- [Workona pricing](https://workona.com/pricing) — plan matrix; dollar amount not in fetched HTML
- [PNAS 2023 one sec](https://www.pnas.org/doi/abs/10.1073/pnas.2213114120) — 57% fewer target-app openings; 36% dismissed after interrupt; 37% fewer attempts by week 6
- [ADHD and Tab Hoarding — Different Brains](https://differentbrains.org/adhd-and-tab-hoarding/)
- [On Browser Tabs — HN](https://news.ycombinator.com/item?id=24503959)
- Trustpilot [freedom.to](https://www.trustpilot.com/review/freedom.to) — bypass, billing, “phone can do this free”
- Secondary 2026 reviews: Cold Turkey $39 one-time; RescueTime Solo ~$7/mo annual; Opal Pro $99.99/yr (Timily, 2026-07-31); BlockSite vendor LP 1M+ people

In-repo: `README.md`, `PRODUCT.md`, `PRICING.md`, `FINANCE.md`, `GTM.md`, `TODO.md`, `CONTENT.md`.
