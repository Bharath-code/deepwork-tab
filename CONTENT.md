# Content Plan — DeepWork Tab

*Written 2026-08-17. The content layer under `GTM.md`. GTM says which channels; this says what to post.*

Marketing is sales at scale, not advertising. Spend time before money. Everything here is free.

---

## 1. Platform & cadence

**One platform: X.** Not because it's best, but because juggling three kills consistency, and X is where the indie-builder audience that boosts extension launches actually lives (Levels, Marc Lou, the r/SideProject crossover). Reddit stays a *launch* channel per `GTM.md` §5, not a posting habit.

Two accounts:
- **Personal** — you, building a thing. Where 90% of posts go.
- **Product** (`@deepworktab`) — releases, changelog, support replies. Low volume, no personality required.

| Slot | What | Effort |
|---|---|---|
| Mon | Build-in-public post (§4) | 10 min |
| Wed | Educate or inspire post (§3) | 15 min |
| Fri | Number, screenshot, or shipped thing | 5 min |
| 1st of month | Email to the list (§5) | 45 min |

Three posts a week, one email a month. That's it. Sustainable beats loud — the people who make money post for two years.

Rule: **give, don't ask.** Four posts of substance to one post with a link.

---

## 2. Funnel reminder

Engage → Follow → Research → Consider → Buy. Nobody skips a step. Content only moves people from *engage* to *follow*; the store listing does *research*, `PRICING.md` does *consider*. Don't ask content to sell.

---

## 3. Fifteen content ideas

### Level 1 — Educate (what building this taught you)

1. **"Chrome's tab cap has a hole and it's called a new window."** `tabs.query({windowType:'normal'})` and why per-window counting is the bug every tab limiter ships with. Code snippet.
2. **"MV3 killed my state, so I stopped having any."** Stateless service worker: all state in `chrome.storage.local`, every handler re-reads, worker death is a non-event. The pattern generalises to every MV3 extension.
3. **"Don't close the tab — redirect it."** Closing loses `pendingUrl`; redirecting preserves it for the queue. One line, big UX difference.
4. **"Asymmetric friction."** Tightening the cap is instant, loosening takes 60 seconds. The general principle: make the direction you'll regret slower. Applies well beyond software.
5. **"My entire analytics stack is one boolean per day."** Install ID + day count, nothing else, and what you can and can't learn from it. Publish the Worker code.

### Level 2 — Inspire (your journey, including the ugly parts)

6. **"I wrote down how I'd kill my own product before I launched it."** D14 ≥10% of installs by day 30, or maintenance mode forever. Post it, then post the number when it arrives — whichever way it goes. This is your single strongest piece of content.
7. **"The NEVER BUILD list."** AI classification, notes, teams, sync, mobile. Why each one is a different product and what happens to founders who add them anyway.
8. **"Five Pro features, zero users."** The trap of building instead of distributing, written as a confession rather than advice. You are living this right now — that's what makes it readable.
9. **"I open 30 tabs, escape to YouTube, lose the afternoon."** The origin story, in full, once. Reuse the opening everywhere after.
10. **"Why I'm not weakening the free tier."** Revenue pressure vs. the free core being the top of the funnel. Take the position publicly so you can't quietly reverse it.

### Level 3 — Entertain (hardest, widest reach)

11. **"Productivity software: install a fourth app so you can stop using the first three."**
12. **A screenshot of 47 open tabs, captioned "research."**
13. **"Blockers ask *what* site. The interesting question is *how many things you already had open*. Nobody sells that because it doesn't demo well."**
14. **A fake changelog:** `v0.4 — added AI. v0.5 — removed AI. v0.6 — apologised.`
15. **"Focus mode for your browser. Ships with a 60-second delay before you can turn it off, which is 59 seconds longer than my willpower."**

Structure for the funny ones: say something → establish the pattern → break it. Don't force it; one good one a month beats four flat ones a week.

---

## 4. Build in public — what to actually share

Ship-log, not status updates. Nobody wants your lunch.

- Every real milestone with the number attached, good or bad: listing submitted, listing approved, first install, first review, first paying customer, first refund.
- **The D14 number, publicly, every month.** This is the whole thing. If it's 4%, post 4%. If it hits 10%, post that too. Publishing a metric you promised to be judged by is the only credibility that can't be faked, and it's free.
- Rejections: Chrome Web Store review kickbacks, a bad review and what you changed, a feature you shipped and deleted.
- What didn't work. Specifically the channels from `GTM.md` §3 that you try and that flop — that post outperforms every success post you'll write.

Escalation ladder to `GTM.md` §7 (publish your own evidence): rung 1 is n=1 — your own tab counts before and after, intercepts per week, honestly, including the weeks you turned it off. Write it once you have 30 days of your own data. That post is the seed of every later credibility play.

---

## 5. Email — the only asset you own

Social is rented. Algorithms change, accounts get locked. Start the list **before** launch, not after.

- **Capture:** one field on the site, above the fold and again at the bottom. Shipped 2026-08 (`site/index.html` → Worker `POST /subscribe`). `GTM.md` §2 item #5 is done.
- **Offer:** not a PDF nobody reads. Offer the thing only you have: *"One email a month with the real numbers — installs, day-14 retention, revenue, and whether this thing is getting killed."* That's a genuinely scarce product and it costs you nothing to make.
- **Copy for the form:** "Nothing leaves your machine — that promise is about your browsing. This is an email you typed, for updates I describe plainly. Never sold, one a month, unsubscribe in one click."
- **Send:** monthly, same week each month. Same educate/inspire/entertain mix. Every email ends with one link, not five.
- Each subscriber is worth many times a follower. Treat the list as the real audience and X as the top of the funnel into it.

---

## 6. When to spend money

**Not yet. Probably not ever, at $29/yr.**

Preconditions, all of them, before the first paid dollar:
1. Listing published and ranking for at least one target phrase.
2. ≥100 paying customers, so you know who the customer actually is.
3. D14 ≥10% — otherwise you're paying to fill a leaking bucket.
4. Known LTV. At $29/yr with unmeasured churn you cannot compute a ceiling, and the rule is absolute: never pay more per customer than you make from one.

When those hold, the only sane first spend is a lookalike audience built from your existing customer list — not keyword guessing. And before acquisition, spend on the customers you already have: a free lifetime upgrade to your first 20 reviewers costs $0 in cash and buys the store ranking that ads can't.

---

## 7. Next three actions

1. ~~Add the email capture to `site/`~~ — shipped 2026-08 (`TODO.md`). Offer line is still “one email a month with the real numbers.”
2. Create both X accounts and post idea #6 (the kill condition) this week — before launch, so launch week isn't your first ever post. The 2026-09-05 continue-or-kill writeup in `RESEARCH.md` is the source material; post the D14 gate, not a feature list.
3. Draft ideas #1–#3 as a queue so launch week has content ready and you aren't writing under pressure.
