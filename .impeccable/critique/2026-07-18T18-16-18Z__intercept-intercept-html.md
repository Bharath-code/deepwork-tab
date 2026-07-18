---
target: intercept
total_score: 33
p0_count: 0
p1_count: 2
timestamp: 2026-07-18T18-16-18Z
slug: intercept-intercept-html
---
# Critique: intercept (DeepWork Tab)

Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Queue/go-back confirm for only 700ms before the tab vanishes; no persistent trace |
| 2 | Match System / Real World | 4 | "You were opening", "Never mind, go back" — plain speech, solid |
| 3 | User Control and Freedom | 3 | Every exit route silently enqueues the target; no clean "no thanks" |
| 4 | Consistency and Standards | 4 | Tokens and button taxonomy match DESIGN.md exactly |
| 5 | Error Prevention | 2 | Enter mid-sentence in the intent field fires queue-and-close with zero affordance; closing a tab is irreversible with no confirm/undo |
| 6 | Recognition Rather Than Recall | 3 | Q/C hotkeys become invisible once the tab list opens |
| 7 | Flexibility and Efficiency | 4 | Q/C/Esc/Enter, modifier-safe, typing-aware — excellent |
| 8 | Aesthetic and Minimalist Design | 4 | 560px column, one accent, breathing dot, nothing decorative |
| 9 | Error Recovery | 3 | "That tab was already closed" recovery is lovely; failed chrome API calls elsewhere fail silently |
| 10 | Help and Documentation | 3 | "whereto" inline help is right; but it hides in the no-target state, leaving it unexplained |
| **Total** | | **33/40** | **Good** |

## Anti-Patterns Verdict

**Passes the product slop test.** LLM assessment: reads as a designed product — intentional hierarchy (headline → factual count → your own words → one input → three ranked actions), kbd chips as a real signature, one voice throughout. The `.reason` 2px left rule is the sanctioned Your-Words treatment, applied once. No gradient text, no glassmorphism, no hero-metric template, no card grids, one eyebrow (within budget).

**Deterministic scan**: 1 advisory finding, CLI and browser converging on the same root cause — `kbd` chips at `shared/tokens.css:89-91` (4px radius outside the DESIGN.md rounded scale; 2px bottom border + radius flagged as border-accent). **False positive in spirit**: DESIGN.md §5 explicitly documents the kbd chip as "2px bottom edge, 4px radius" signature. Fix is documentation (add 4px to the rounded scale frontmatter), not code.

## Overall Impression

This is a calm, trustworthy surface that mostly delivers "calm at the moment of weakness." The biggest opportunity is an inversion: the safest action (queueing) gets all the ceremony, while the scariest action (closing a tab) gets none — instant removal, no acknowledgment, and the closed tab is the only thing on this screen actually lost.

## What's Working

1. **Tab-already-closed recovery** (intercept.js:133–137): catches the race, removes the stale row, announces via role="status", resets the acting guard. Linear-level trust behavior.
2. **Focus choreography**: list open focuses first Close button; Esc-collapse returns focus to the restored trigger (js:94–99, 145).
3. **Hotkey discipline**: modifiers bail early, typing state respected, every hotkey printed as a kbd chip. The asymmetric-friction principle is legible.

## Priority Issues

- **[P1] Enter-to-queue is invisible** (intercept.js:170). Enter mid-sentence in the intent field queues and closes with nothing on screen saying so. Fix: surface the binding — kbd "↵" chip on the primary or a hint at the input. → /impeccable clarify
- **[P1] Close path has no peak-end and loses data** (intercept.js:131–132). `tabs.remove` → instant `passThrough()`; the closed tab's URL is NOT enqueued, contradicting "Closing feels safe." Fix: enqueue the victim tab before removal, route through `confirmThen` ("Closed — you're through ✓"). → /impeccable polish
- **[P2] No-target state is a degraded orphan** (intercept.js:29–32). Primary button and reassurance line vanish; Enter does nothing; no explanation. Fix: promote "Close a tab instead" to primary, swap the whereto copy instead of hiding it. → /impeccable harden
- **[P2] Option overload when the tab list opens**: 7+ Close buttons plus still-fully-visible Queue/Go-back = 9–10 simultaneous options (fails the ≤4 rule). Fix: recede the top action block while `listShown`. → /impeccable layout
- **[P3] Pre-render flash on pass-through** (intercept.js:33): full intercept renders and animates before navigating away when under cap. Fix: hide main until init decides to stay. → /impeccable polish

## Persona Red Flags

**Alex (power user)**: unskippable 700ms confirm ceremony on every queue; no way to find a specific tab in the close list (sorted LRU only); Esc force-enqueues and pollutes his queue.

**Jordan (first-timer)**: no-target state removes primary + explainer with nothing in their place; "Queue it for later" — queue *what*? (connection to the target card is spatial, not stated); no path to options/help from this screen.

**Sam (screen reader/keyboard)**: nothing receives focus on load — no orientation beyond the title; `.reason` is a bare `<p>` so "these are your own words" is invisible to SR; full target URL recoverable only by mouse hover elsewhere (and `.target-url` has no title attr at all).

## Minor Observations

- `hasTarget` filters `chrome://` but not `about:`/`chrome-extension://` (js:3).
- Count includes the intercept tab itself — "8 tabs open · cap is 7" is honest but momentarily confusing (js:19–20).
- Close list spans all windows with no window indication (js:106).
- `button:active` scale isn't strictly gated under reduced motion (tokens.css:72 vs 110).
- Contrast spot-checks all pass AA in both themes; focus-visible outline global. Clean.
- Detector screenshot artifact left at `.playground/intercept-screenshot.png` (safe to delete).

## Questions to Consider

1. Should "go back" really cost a queue entry? Is a queue full of "just in case" entries still trusted, or a second tab pile?
2. The intent input is the soul of the product — why is it optional, disposable, and never shown back to the user on this surface?
3. Closing is framed as the safe path but is the only path where something is actually lost. Should the close flow auto-queue the victim tab and say so?
