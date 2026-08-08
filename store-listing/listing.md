# Chrome Web Store listing copy

Paste-ready. Field limits noted; character counts checked.

Ranking inputs you control here: **title keywords, short description, install count, rating.** The first two are this file. See `GTM.md` §4.

---

## Name — 75 char limit

```
DeepWork Tab — Tab Limit & Focus Mode
```
*37 chars. Brand first, then the two phrases people actually search: "tab limit", "focus mode".*

Alternate, if you want the search terms weighted harder:
```
DeepWork Tab — Tab Limit, Focus Mode & Tab Cap for Chrome
```
*56 chars. Reads more keyword-stuffed. Prefer the short one unless installs stall.*

---

## Short description ("summary") — 132 char limit

```
Set a hard limit on open tabs. At the cap, a calm full-page pause — queue the tab, close one, or go back. Not a blocker.
```
*119 chars. Contains "limit on open tabs" and "not a blocker" — the search term and the differentiator.*

---

## Category

**Workflow & Planning** (primary). Not "Fun", not "Social & Communication".

---

## Detailed description — 16,000 char limit

```
Your editor has a focus mode. Your browser doesn't.

You never decided to open 41 tabs. It happened one reasonable tab at a time,
and the pile is what's left of forty good ideas you never came back to.

DeepWork Tab puts a hard limit on how many tabs you can have open — and holds
it at the exact moment you'd talk yourself out of it.


HOW IT WORKS

1. Set your cap. Default is 7. The number isn't the point; having a number is.

2. At the cap, the next new tab becomes a calm full-page pause instead of a
   42nd tab. Three choices: queue the page for later, close something you're
   done with, or go back to what you were doing.

3. Raising the cap or turning it off takes 60 seconds. During those 60
   seconds it shows you the reason you typed when you installed it — in your
   own words. Tightening is instant. The friction is asymmetric on purpose.

4. Nothing is lost. Every queued page keeps its title and address in the
   toolbar popup. Reopen anytime, or export the whole queue as markdown links
   and paste it into your notes.


IT IS NOT A WEBSITE BLOCKER

There's no blocklist and no notion of a "bad" site. Research at 3pm and
doomscrolling at 3am look identical to a blocklist. The difference is how many
things you already had open — and that's the thing this measures.

If you want scheduled cross-device blocking, use Freedom or Cold Turkey. They
do that well and this doesn't try to.


FREE FOREVER

The whole habit is free, permanently:

  · Tab cap, enforced globally across all windows (opening a new window
    doesn't bypass it)
  · The full-page intercept, with the "what am I actually looking for?" box
  · The 60-second delay gate that shows you your own reason
  · The queue — one-click restore, plus markdown export
  · Reason recall: reopening a domain you excused before shows what you wrote
    last time
  · A quiet streak count for days the cap stays tight
  · Your weekly receipt: intercepts, tabs queued, top distraction

Paying for the habit itself would mean making the free version worse at the
only thing this product is for. That's not a trade worth making.


PRO — $29/year, for the spiral you haven't broken yet

  · Ultra focus sessions — a hard cap you can't excuse your way past
  · YouTube de-pandora — the recommendation sidebar and autoplay, gone
  · Snooze the queue until a time you choose
  · A stuck ramp that slows the escape on sites you keep returning to
  · The full weekly receipt, not the summary

Licence key verified on your own machine, so Pro works offline.


PRIVACY — the whole story, not a summary

Tab titles, URLs, and everything you type stay in Chrome's local storage on
your machine. None of it is transmitted, ever.

The extension makes exactly one network request: a daily ping containing a
random install ID and today's date, so the developer knows whether anyone
still uses this. That is the entire data footprint.

No account. No sign-up. No analytics. No ads. No AI reading your tabs.
The source is public — verify instead of trusting:
github.com/Bharath-code/deepwork-tab


WHAT THIS WILL NEVER BECOME

No AI classification. No second brain, notes, or tags. No teams. No sync.
No mobile app. Each of those is a different product, and you know what
happens next.

It's a tab cap. It intends to stay one.


WHY YOU MIGHT NOT WANT THIS

  · You need blocking across your phone and laptop → Freedom
  · You want to organise and search hundreds of tabs → OneTab, tab groups
  · You want a timer, not a limit → any Pomodoro extension
  · You want something that can't be uninstalled → nothing can do that,
    including this. The delay gate is the ceiling, and that's fine.
```

*≈3,100 chars. Well inside the limit, and short enough to be read.*

**Target phrases, all present above:** tab limit · limit tabs chrome · too many tabs · focus mode · tab cap · close tabs without losing them · not a website blocker

---

## Screenshots — 1280×800, max 5, in this order

Screenshot 1 is roughly 80% of the install decision. Make it the intercept.

| # | Shot | Caption overlay (optional, keep short) |
|---|---|---|
| 1 | **The intercept**, mid-use, with a real reason typed in the box and a plausible tab count (41 open · cap 7) | "At the cap, a pause — not a 42nd tab." |
| 2 | The queue in the popup, one item mid-restore | "Nothing is lost. Reopen anytime." |
| 3 | The delay gate counting down, showing the user's own typed reason large | "Turning it off takes 60 seconds — and your own words." |
| 4 | The weekly receipt in the popup | "What last week actually looked like." |
| 5 | Options / the cap setting | "Seven is a guess. Pick your own." |

**Capture notes:** use real-looking content, never `lorem ipsum` or `example.com`. Light theme for 1, 2, 4; the intercept reads calmer in light. Don't fake a tab count you can't produce — open 41 tabs for real.

**30-second recording:** hit the cap → intercept appears → type a reason → queue it → open popup → restore the tab. No narration needed, no music, no titles. One continuous take.

---

## Permission justifications

Already written in `store-listing/permissions.md`. Paste each one into the matching field on the review form; don't paraphrase them into something vaguer, since the reviewer is comparing them against the manifest.

---

## After approval

1. Put the listing URL in `site/index.html` (replace the "Install from source" primary CTA — there's a comment marking the spot) and in `site/README.md`.
2. Update the three SEO pages' CTAs (`vs-freedom.html`, `too-many-tabs-open.html`, `adhd-too-many-tabs.html`) — same placeholder comment in each.
3. Ask for the first reviews from the weekly receipt at the 14-day streak. Rating feeds ranking; it's the one input that compounds.
