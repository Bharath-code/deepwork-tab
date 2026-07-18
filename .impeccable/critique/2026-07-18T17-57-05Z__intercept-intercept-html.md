---
target: intercept
total_score: 30
p0_count: 0
p1_count: 3
timestamp: 2026-07-18T17-57-05Z
slug: intercept-intercept-html
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | "Queued ✓" confirm lasts 450ms — blink and it's missed |
| 2 | Match System / Real World | 4 | n/a — plain, human copy throughout |
| 3 | User Control and Freedom | 2 | "Go back" silently discards the URL; tab close is irreversible |
| 4 | Consistency and Standards | 4 | n/a — tokens and button grammar fully consistent |
| 5 | Error Prevention | 2 | No `acting` guard on showTabs; double-click Close unguarded; Enter auto-queues |
| 6 | Recognition Rather Than Recall | 4 | n/a — hotkeys printed on buttons, everything visible |
| 7 | Flexibility and Efficiency | 2 | Hotkeys ignore modifiers — Cmd+C triggers the close-a-tab flow |
| 8 | Aesthetic and Minimalist Design | 4 | n/a — exemplary restraint |
| 9 | Error Recovery | 2 | All chrome.* failures silent; no queue-failure state |
| 10 | Help and Documentation | 3 | Nothing says where the queue lives after "Queued ✓" |
| **Total** | | **30/40** | **Good — solid foundation, address weak areas** |

## Anti-Patterns Verdict

**Not AI slop.** A Linear/Raycast-fluent user would trust this screen: one accent, flat border-defined surfaces, system fonts, kbd chips inside buttons, no red or countdown at the moment guilt-apps escalate. The one uppercase eyebrow (.target-label) and the 2px reason-quote rule are both within DESIGN.md's documented budget.

**Deterministic scan:** 4 findings total, all advisory. CLI: 3 × `design-system-font-size` (14px at intercept.css:24 and :129, 15px at :34 — off the DESIGN.md frontmatter ramp, which only lists 16px body; the prose says 14–16px, so this is a spec gap more than a design defect). Runtime: 1 × `border-accent-on-rounded` on the `<kbd>` chips (2px bottom border + 4px radius) — false positive; the keycap idiom is documented in DESIGN.md as a signature.

**Visual evidence:** the page was rendered in a real browser in both themes; theme switching works, layout holds, the detector overlay ran in-page. (Static render outside the extension, so tab-count numbers were blank — an artifact, not a defect.)

**Where the two assessments diverge:** the detector found essentially nothing wrong visually — and the design review agrees the visual layer is strong. Every real issue is behavioral (keyboard handling, announcements, silent data loss), which only the human-style review caught.

## Overall Impression

This is a confident, on-brand surface — restraint under pressure is genuinely rare at the "moment of weakness" screen, and the emotional design (breathing dot, user's own words above the app's offer, green only at resolution) executes the product thesis. The gap is entirely in interaction robustness: the keyboard layer that makes it feel expert-grade is also its biggest liability (no modifier filtering, Esc over-collapses), and the screen is nearly silent to assistive tech. The single biggest opportunity: make "go back" — the path a resisting user takes — feel as safe as queueing.

## What's Working

1. **Hotkeys as first-class UI** — kbd chips rendered inside buttons (incl. the recolored primary variant) make keyboard use discoverable with no help layer. Raycast-grade.
2. **The Your-Words quote treatment** — the only typographically loud text on the page is the user's own sentence. The persuasion mechanic, executed in CSS.
3. **Restraint under pressure** — no red, no countdown, no shame copy; all three animations honor prefers-reduced-motion.

## Priority Issues

1. **[P1] Hotkeys ignore modifier keys** (intercept.js:131–133). Cmd+C — copying the displayed URL, a likely act on this exact screen — triggers the close-a-tab flow. Fix: bail on `e.metaKey || e.ctrlKey || e.altKey`. → `/impeccable polish`
2. **[P1] Screen-reader silence** (intercept.html, intercept.js:65, 95–104). N identical "Close" buttons; no aria-live anywhere, so the revealed tab list, changing count, and "Queued ✓" all happen silently — and the 450ms window before the tab closes means the confirmation is likely never announced. Fix: per-tab aria-labels, a polite live region for status. → `/impeccable audit` or `/impeccable polish`
3. **[P1] "Go back" silently loses the URL** (intercept.js:68–73). Violates "closing feels safe"; the resisting user is the only one who loses data. Fix: reassurance microcopy, or quietly queue the URL too. → `/impeccable clarify` + `/impeccable polish`
4. **[P2] Dark-mode placeholder + UA scheme mismatch** (tokens.css). No `color-scheme: light dark`, no `::placeholder` rule → ~3.8:1 placeholder in dark, light scrollbars on the dark tab list. → `/impeccable polish`
5. **[P2] Race/re-entry bugs in the close flow** (intercept.js:75, 97–100). showTabs never sets `acting`; double-click Close fires tabs.remove on a dead id and double passThrough; queue.unshift has no dedupe on refresh-mid-confirm. → `/impeccable harden`
6. **[P3] Esc collapses too much** (intercept.js:119–125). With the tab list open, Esc should step back to the three actions, not destroy the intercept. → `/impeccable polish`

## Persona Red Flags

**Alex (power user):** Cmd+C opens the tab list — worst possible moment. Enter in the intent box commits to queue even if Alex meant to close a tab. Esc from the list state nukes the page. Otherwise excellent (Q/C/esc one-keystroke, first Close pre-focused).

**Sam (screen reader / keyboard-only):** N unlabeled "Close" buttons; zero live regions; success confirmation dies with the page before announcement; Esc-to-leave-form reflex triggers goBack and destroys the page. Contrast itself is fine (5.5–7.6:1 muted text both themes).

**Riley (stress tester):** double-click Close → unhandled rejection + double passThrough; refresh mid-confirm can double-enqueue; two simultaneous intercepts show stale counts; 50 tabs = 49 close choices (LRU sort mitigates). Long URLs, chrome:// targets, and refresh-under-cap are all handled correctly.

## Minor Observations

- `confirmThen` destroys the `<kbd>` child via textContent — harmless now, chipless on re-entry.
- Tab-list Close buttons ~23px tall — under the 24px WCAG 2.5.8 minimum.
- Ambiguous titles ("New Tab" ×4) have no URL tooltip; a `title` attribute costs nothing.
- Intent text is silently dropped if the user closes the tab via Chrome's own ✕.
- Page `<title>` "One thing at a time" is quietly great in a cluttered tab strip.
- DESIGN.md frontmatter should add 14px/15px body steps (or the code should consolidate) to silence the 3 advisory detector hits.

## Questions to Consider

1. Should "go back" be the loss-less path instead of the guilty one? The resisting user is doing exactly what the product wants — what if go-back quietly queued the URL and said "saved it anyway, just in case"?
2. Is the intent box answered by anyone? The mid-impulse sentence goes into storage and vanishes — isn't it the most persuasive text the product will ever own?
3. Why show all N tabs when the LRU sort already knows the answer? "Close your stalest tab: {title} [C]" with a "show all" escape hatch would collapse the only >4-choice moment to one keystroke.
