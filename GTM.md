# GTM Playbook — DeepWork Tab

*Written 2026-08-08 for a first-time marketer who is a strong engineer. Companion to `FINANCE.md`.*

Read §1 and §2 before anything else. If you only do §10, you will still be ahead of where you are today.

---

## 1. The one insight that should change how you spend your time

Here is the whole funnel, with realistic rates for a Chrome extension:

```
REACH        100,000  people see something about it
   ↓  3%              click
CLICK          3,000  land on the store listing
   ↓ 15%              install (one click, so this converts well)
INSTALL          450  installs
   ↓ 60%              finish onboarding, type a reason, hit first intercept
ACTIVATE         270  activated
   ↓ 17%              still using on day 14
RETAIN            75  D14 actives
   ↓ 12%              upgrade to Pro
PAY                9  customers  →  $261/yr
```

**100,000 impressions produces about $260.** Internalise that number. It is why every "growth hack" article feels hollow — reach is weak, expensive, and mostly outside your control.

Now look at what happens when you improve each stage instead:

| If you double this | Cost to you | Result |
|---|---|---|
| Reach (100K → 200K) | money you don't have, or luck | 2× |
| Install rate (15% → 30%) — rewrite the store listing | one afternoon, free | 2× |
| D14 retention (17% → 34%) — product work | your actual skill, free | 2× |
| Pay rate (12% → 24%) — fix the upgrade moment | a few hours, free | 2× |

The bottom three are free, they are engineering work, and **they multiply: 2 × 2 × 2 = 8×.** Same reach, eight times the revenue.

> **You are an engineer with no marketing experience and no budget. Your comparative advantage is the bottom of the funnel. Fix that first, market second.** Most first-timers do the reverse: they pour effort into launches, get a spike, leak 95% of it, and conclude the market doesn't want the product.

A real growth manager's first week on this account would not write a single post. It would be spent on the store listing, the checkout, and instrumentation.

---

## 2. Week 0 — six things to build before you market anything

Marketing before these exist is pouring water into a bucket with no bottom.

| # | Asset | Why | Time |
|---|---|---|---|
| 1 | **Publish the listing** | Revenue is $0 because nothing is installable. $5 + screenshots. | 1 day |
| 2 | **Real checkout** (Lemon Squeezy) replacing the `mailto:` | A "Get Pro" button that opens an email client loses most buyers at the last step | 30 min |
| 3 | **Rewritten store listing** (§4) | The single largest install lever, forever | 2 hrs |
| 4 | **Custom domain** | `*.workers.dev` reads as unfinished; also SEO-inert | 20 min |
| 5 | **Email capture on the site** | The only asset that survives a channel dying. "Get told when it ships / one email a month." | 30 min |
| 6 | **A metrics sheet** (§8) | Six numbers, weekly. Without it you're guessing. | 20 min |

**On #5 and your privacy stance:** an opt-in email list does not contradict "nothing leaves your machine." That promise is about *browsing data*. An email someone typed on your website, for updates you describe plainly, is a different thing. Say what it's for and never sell it. You will regret not starting this on day one — every founder does.

---

## 3. Channel portfolio, ranked for *this* product

Ranked by (yield × fit) ÷ effort. Not a generic list — several popular channels are actively wrong here.

### Tier 1 — do these, in this order

**1. Chrome Web Store SEO** — *compounding, free, largest long-run lever*
The store is a search engine and most utility-extension installs come from internal search, not from your website. Ranking inputs you control: title keywords, short description, install count, and **rating**. See §4.

**2. Launch week** — *one-time spike, but it bootstraps everything else*
Its real job is not installs. It is to produce the **first 20 reviews and first 500 installs**, which are the inputs to store ranking. A launch is a battery charge, not an engine. See §5.

**3. Long-tail SEO pages** — *compounding, buyer-intent, free*
Ten static pages, one weekend, still delivering installs in month 18. This is the engine. See §6.

**4. The credibility play — publish your own data** — *highest ceiling, unique to you*
See §7. This is the one I'd bet on and the one you're uniquely positioned for.

### Tier 2 — worth real time once Tier 1 exists

**5. Build in public (X / Indie Hackers)** — slow, compounds, costs only time. Post the D14 number publicly, whatever it says. Pieter Levels and Marc Lou built audiences almost entirely this way, and an audience is the one channel nobody can take from you.

**6. Being a useful person in small communities** — HN comments, r/chrome_extensions, r/ADHD_Programmers, r/productivity. Answer tab-overwhelm threads as someone with the problem. Mention the tool when it's genuinely the answer. Slow, low volume, near-zero ban risk.

**7. The review flywheel** — ask for a store review in the weekly receipt after a 14-day streak. That's an earned moment, not a nag, and rating feeds ranking. Reported effect of prompting after repeated core-feature use is a meaningful lift in review count.

### Tier 3 — only after Tier 1 is working

**8. Productivity YouTubers / newsletters** — free Pro licences, no cash. Small channels (5–50K subs) reply to real emails; large ones want money you don't have.
**9. Extension-dev partnership swaps** — cross-mentions with complementary (not competing) extension authors.

### Do not do these

| Channel | Why not |
|---|---|
| **Paid ads** | CAC ≈ $6,667 vs $25 sustainable. Off by 265×. Structural at $29 ACV. (`FINANCE.md` §2.1) |
| Newsletter sponsorships | $500–2,000 for a $29 product |
| Affiliate programme | 20% of $29 = $5.80. Motivates nobody |
| Cold email / DM outreach | Consumer product, no list, high effort, reputational downside |
| Posting in r/ADHD directly | Instant removal, sometimes a ban (`FINANCE.md` §4.3) |
| Paying an influencer | See paid ads. Same math |

---

## 4. Fix the store listing (largest single lever)

Your current listing name carries no keyword, and your short description is excellent copy that is invisible to search.

**Name** — keyword + brand, inside the length limit:
```
DeepWork Tab — Tab Limit & Focus Mode
```

**Short description** — must contain the words people actually type:
```
Set a hard limit on open tabs. At the cap, a calm full-page pause —
queue the tab, close one, or go back. Not a blocker.
```

**Target phrases** to work naturally into the long description: `tab limit`, `limit tabs chrome`, `too many tabs`, `focus mode for chrome`, `tab cap`, `close tabs without losing them`.

**Screenshots, in this order** — screenshot 1 is 80% of the decision:
1. The intercept screen with a real typed reason (your entire pitch, in one image)
2. The queue in the popup, mid-restore
3. The delay gate counting down, showing the user's own words
4. The weekly receipt
5. Options / the cap setting

**Long description structure** — problem, then mechanism, then what it refuses to do. Your existing README and FAQ copy is strong; paste from it. The "Is this a website blocker? No." answer is your differentiator and belongs high up.

**Rating** — ask once, at the 14-day streak, from the weekly receipt. Never on the intercept.

---

## 5. Launch week — day by day, with drafts

Do this **after** §2 and §4 are done. Not before.

### The hook you already own

Buried in `README.md` is the strongest asset you have and you're not using it:

> "Week 2 paid layer only if *I* use the free core daily for 7 straight days. Day 30: D14 actives ≥10% of installs, or maintenance mode forever."

**You wrote down the condition under which you would kill your own product.** Almost nobody does that. On Hacker News, that plus the `NEVER BUILD` list plus "one anonymous boolean ping is the entire data footprint" is a far better story than any feature. Lead with the discipline, not the features.

### Schedule

| Day | Where | What |
|---|---|---|
| **Tue** | **Show HN**, 8–10am ET | Highest-value slot of the week. Draft below |
| **Wed** | **Product Hunt**, 12:01am PT | Needs the whole day for comment replies |
| **Thu** | r/productivity, r/getdisciplined | Build-log framing, not launch framing |
| **Fri** | r/chrome_extensions, Lobsters, Indie Hackers | Technical angle: MV3 stateless worker, no analytics |
| **Sat–Sun** | Reply to every single comment | This is the actual work. Response rate drives ranking on both HN and PH |
| **Ongoing** | X thread, one post per real milestone | Include the numbers, including bad ones |

### Show HN draft

**Title** (keep under ~80 chars, no hype, no emoji):
```
Show HN: DeepWork Tab – a hard tab cap for Chrome, with a 60s delay gate
```

**First comment** (post immediately after submitting):
```
I open 30 tabs, escape to YouTube, and lose the afternoon. My editor
has a focus mode; my browser doesn't. So I built one.

It's a hard cap on open tabs (default 7, global across windows). At the
cap, a new tab becomes a full-page pause: queue it, close something, or
go back. Raising the cap or turning it off takes 60 seconds, and during
those 60 seconds it shows you the reason you typed at onboarding, in
your own words. Tightening is instant — the friction is asymmetric on
purpose.

It is not a blocker. There's no blocklist and no notion of a "bad" site.
Research at 3pm and doomscrolling at 3am look identical to a blocklist;
the difference is how many things you already had open. That's the thing
this measures.

Technical bits that might interest people here: MV3 service worker is
fully stateless — all state in chrome.storage.local, every handler
re-reads, so worker death is a non-event. The cap counts
tabs.query({windowType:'normal'}) so a new window doesn't bypass it. The
intercept redirects the new tab rather than closing it, which preserves
pendingUrl for the queue.

Privacy: tab titles, URLs, and everything you type stay on your machine.
The extension makes exactly one network request — a daily ping with a
random install ID and today's date, so I know if anyone still uses it.
That's the entire data footprint. Code is public.

I also wrote down the condition for killing it: if day-14 actives aren't
at least 10% of installs by day 30, it goes into maintenance mode
forever. And a NEVER BUILD list — no AI, no notes, no teams, no sync,
no mobile — because I know exactly what happens otherwise.

Free core is genuinely free forever (cap, intercept, gate, queue,
streaks). Paid tier is for the YouTube spiral specifically.

Happy to be told what's wrong with it.
```

Why this works: concrete personal problem, mechanism explained, technical substance, explicit anti-features, a falsifiable kill condition, and an invitation to criticism. That last line matters — HN rewards people who want the critique.

### Product Hunt

- **Tagline** (60 char): `A hard tab cap for Chrome. Your browser's focus mode.`
- **First comment**: the maker story, shorter than HN, more human. The "30 tabs → YouTube → afternoon gone" opening is the whole thing.
- Do not buy upvotes. It is detectable and it kills the launch.
- Answer every comment within an hour, all day.

### Reddit rules of engagement

Read each sidebar first. Frame as *"I had this problem and built this, here's what I learned about my own tab habit"* — a build log with a link at the bottom, not a product announcement. Post from an account with real history. Never post the same text to two subs.

### Realistic expectation

**2,000–15,000 installs, ~70% inside 96 hours, then a hard decay.** At §1's rates that's roughly 20–200 activated users and 3–25 customers. If you expected more, re-read §1. The launch's job is the first reviews and the store-ranking seed, not the revenue.

---

## 6. The SEO engine (months 1–12)

This is the part that still works when the launch is a memory. Static HTML in `site/`, no framework — matches your existing architecture.

**Comparison pages** — visitors have already decided to buy *something*, so they convert at multiples of homepage traffic:
- `/vs/freedom` · `/vs/cold-turkey` · `/vs/onetab` · `/vs/stayfocusd` · `/vs/one-sec`

**Problem-intent pages** — where the real volume is:
- `/too-many-tabs-open` · `/how-to-limit-tabs-in-chrome` · `/chrome-tab-limit-extension`
- `/adhd-too-many-tabs` ← the ADHD wedge, reached by search instead of by posting
- `/youtube-sidebar-blocker` · `/disable-youtube-autoplay` ← standalone search demand for your Pro features

**How to write one so it isn't spam:** answer the question completely and honestly *without* the extension, including when a different tool is the right answer (say plainly that Freedom is better if you need cross-device blocking — that honesty is why the recommendation gets believed). Then mention yours as the fit for the specific case. One page, 600–1,200 words, one clear CTA.

Ten pages is a weekend. Reported yields for genuinely useful tutorial content are modest per page — 20–30 installs/month — but they stack and they don't decay.

---

## 7. The play I'd actually bet on: publish your own evidence

**The case study.** Frederik Riedel built *one sec* — a friction app that interrupts you before you open a distracting app. Nearly the same mechanism as your intercept. He partnered with the **Max Planck Institute and Heidelberg University** and ran a real study. He hoped for a statistically significant 12% reduction; the data showed **57%**. It was published in **PNAS**. That paper became his moat: in a category full of unfalsifiable productivity claims, he had peer review. It led to partnerships with **Stanford, Cambridge, and three national governments**.

**Why this is your play specifically:**

1. Same category, same mechanism — a pause at the moment of impulse.
2. **You already built the instrumentation.** The intercept log, per-domain reason recall, tab counts, streaks, the D14 heartbeat. You are already collecting the exact data a study needs, locally.
3. Credibility costs no money — which matters enormously, because §3 rules out every channel that does.
4. It is unfalsifiable-claim-free marketing, which fits `PRODUCT.md`'s "calm, honest, firm" voice. You would be doing the opposite of what the category does.

**The ladder, cheapest rung first:**

| Rung | What | Effort |
|---|---|---|
| 1 | **n=1, you.** Publish your own numbers honestly: tabs before/after, intercepts per week, what didn't work. A blog post. | 1 day |
| 2 | **Opt-in cohort.** Ask 50 users to share their weekly receipt numbers voluntarily. Publish aggregates, method, and limitations. | 2 weeks |
| 3 | **Email one researcher.** HCI / digital-wellbeing / attention labs. Say: I have a deployed intervention, local-only instrumentation, an opt-in user base, and no funding. Would this be interesting? Most will not reply. One might. | 2 hrs |
| 4 | Co-authored study, if rung 3 lands. | months |

Rung 1 costs a day and is worth doing this month regardless of whether the rest happens. Publishing "here is my own data, including the parts that look bad" is also exactly the build-in-public content that works on X and HN.

**Guardrail:** no medical or clinical claims, ever. Especially not on the ADHD page. Describe mechanism and observed numbers with their limitations. "This is what happened to my tab count" is honest and durable. "This treats ADHD" is a lie and a legal problem.

---

## 8. Measurement — six numbers, one sheet, every Monday

You cannot attribute installs to a channel precisely: the Chrome Web Store does not pass a referrer. Don't fight it. Use a distinct landing page or short link per channel, count clicks-to-store yourself, and correlate against the CWS dashboard's installs-by-day. Crude, sufficient, and consistent with taking no analytics.

| # | Metric | Where from | Target |
|---|---|---|---|
| 1 | Installs this week | CWS dashboard | growing |
| 2 | Uninstalls this week | CWS dashboard | <40% of installs |
| 3 | **D14 actives ÷ installs** | your heartbeat Worker | **≥10%** ← the kill gate |
| 4 | Store listing views → installs | CWS dashboard | ≥15% |
| 5 | Site visits → store clicks | CF analytics | ≥25% |
| 6 | Paying customers | Lemon Squeezy | growing |

**Metric 3 is the only one that decides whether the project lives.** Everything else is a dial. `README.md` already commits you to it. Honour it in both directions — that's what makes writing it down worth anything.

Review monthly, not daily. Daily numbers on a pre-launch product cause thrash.

---

## 9. What first-timers get wrong (and you are set up to get wrong)

1. **Marketing before the bottom of the funnel exists.** Your `mailto:` checkout is this mistake, live, right now. Fix before launch.
2. **Treating launch day as the strategy.** It's a battery charge. §6 is the engine.
3. **Confusing a roster for a market.** "2% of r/ADHD's 2M" was this. Divide by the funnel before believing any number that starts from a membership count.
4. **Building features instead of distribution.** You have five Pro features and zero users. The next feature has near-zero expected value; the store listing rewrite has high expected value. This is the trap you are personally most likely to fall into, because building is the part you enjoy and are good at.
5. **Skipping the email list.** Channels die. Lists don't.
6. **Discounting before there's data.** You have zero traffic, so you have zero evidence $29 is wrong. Don't pre-emptively cut.
7. **Going quiet after launch.** The people who make money post for two years. Easy Folders reached roughly $3,700/mo six months post-launch; Notion Boost passed $9,000 — both solo, both through sustained presence, not one launch.
8. **Abandoning the free tier's generosity under revenue pressure.** The free core *is* the top of your funnel. Weakening it to force upgrades would break the D14 metric that the whole business rests on. `PRICING.md` already says this. Hold it.

---

## 10. Your next 7 days

Do these in order. Do not read another growth article until day 7 is done.

- [ ] **Day 1** — Pay the $5, create the Chrome developer account. Capture the 5 screenshots + 30s recording.
- [ ] **Day 2** — Lemon Squeezy account, $29/yr product, $59 lifetime product, licence-key email. Replace the `mailto:` links.
- [ ] **Day 3** — Rewrite the store listing per §4. Buy the domain, point it at the Worker.
- [ ] **Day 4** — Restore the $59 lifetime on the pricing page. Add the email capture. Record the $19 reservation list in-repo.
- [ ] **Day 5** — Submit the listing. Write the metrics sheet (§8). Write the Show HN draft in your own words.
- [ ] **Day 6** — Write rung 1 of §7: your own numbers, honestly, including what didn't work.
- [ ] **Day 7** — Write three §6 pages: `/vs/freedom`, `/too-many-tabs-open`, `/adhd-too-many-tabs`.

Then wait for approval, and launch per §5 the Tuesday after it lands.

**The one-line version:** your product is finished, your funnel has no bottom, and your reach is zero. Fix the bottom this week, open the top next week, then spend a year on §6 and §7 — the two channels that compound and cost nothing but time.

---

## Sources

- [Frederik Riedel expected 12%. His app cut screen time by 57% — RevenueCat](https://www.revenuecat.com/blog/growth/frederik-riedel-expected-12-his-app-cut-screen-time-by-57/)
- [one sec — official site](https://one-sec.app/)
- [89: one sec — Frederik Riedel, Launched podcast](https://launchedfm.com/episode/89-one-sec-frederik-riedel)
- [8 Chrome Extensions with Impressive Revenue — ExtensionPay](https://extensionpay.com/articles/browser-extensions-make-money)
- [Chrome Extension Success Stories: How Indie Developers Built Million-Dollar Businesses — NicheCheck](https://nichecheck.com/blog/chrome-extension-success-stories)
- [The Complete Guide to Growing Your Chrome Extension from 0 to 1,000 Users in 2026 — DEV](https://dev.to/quangpl/the-complete-guide-to-growing-your-chrome-extension-from-0-to-1000-users-in-2026-3hn6)
- [How to grow your Chrome extension from 0 to 1000 users — InitJS](https://medium.com/init-js/how-to-grow-your-chrome-extension-from-0-to-1000-users-d468d2765e1f)
- [Browser Extension Growth Hacking: 10 Unconventional Tactics — ExtensionFast](https://www.extensionfast.com/blog/browser-extension-growth-hacking-10-unconventional-tactics-that-actually-work)
- [The complete guide to Reddit self-promotion rules in 2026 — Redship](https://redship.io/blog/reddit-self-promotion-rules)
- [Chrome Extension Revenue Benchmarks by User Count (2026) — Chrome Goldmine](https://chromegoldmine.com/blog/chrome-extension-monetization/chrome-extension-revenue-benchmarks/)
