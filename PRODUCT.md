# Product

## Register

product

## Users

People who do focused knowledge work in a browser and know their tab count is the leak — developers, writers, researchers. Primary user is the builder themself (dogfooding gate: paid layer ships only after 7 straight days of personal daily use). Context of use: mid-task, often mid-distraction — the intercept appears at the exact moment willpower is weakest.

## Product Purpose

A focus mode for Chrome: a hard tab cap (default 7), a calm full-page intercept when the cap is hit, and a queue that makes closing tabs feel safe. Not a tab manager, not a blocker. Success = the user keeps the cap on (D14 actives ≥10% of installs) because the tool feels like an ally, not a nag.

## Brand Personality

Calm, honest, firm. The cap is real and the delay gate holds the line, but there is no guilt, no shame mechanics, no gamified nagging. Copy speaks plainly and uses the user's own typed reason against their weaker moments — accountability to yourself, not to the app.

## Anti-references

- SaaS dashboard chrome: metric tiles, cards-on-cards, gradients, generic admin visual language. This is a utility that should disappear, not a dashboard that performs.
- Feature-heavy tab-manager UI (dense lists, thumbnails, folders) — explicitly out of scope per README.
- Guilt-trip productivity apps: red everywhere, streak shaming, dead-tree metaphors.

## Design Principles

- **Calm at the moment of weakness** — the intercept fires when the user is most impulsive; the design de-escalates instead of alarming. Neutral surfaces, one clear primary action, no urgency theatrics.
- **Friction is the feature, applied asymmetrically** — tightening is instant, loosening waits 60 seconds. UI must make the asymmetry legible, never punitive.
- **Your own words, not ours** — the user's typed reason is the persuasion engine. Give it typographic prominence; the app's voice stays secondary.
- **Closing feels safe** — the queue exists so nothing is lost. Every destructive-feeling action should surface its undo/recovery path.
- **Invisible until needed** — popup and options stay small, quiet, and fast. No engagement hooks, no reasons to open the extension for its own sake.

## Continue or kill

`RESEARCH.md` (2026-09-05): continue. Ship the listing. Do not start a second product. The job we own is “cap how many things may be open,” not organize the pile, not block named sites, not pause a known vice. Kill criterion is still D14 ≥10% after a public listing.

## Accessibility & Inclusion

WCAG 2.1 AA: text contrast ≥4.5:1 in both light and dark themes, full keyboard operation (hotkeys already exist — keep them discoverable), visible focus states, `prefers-reduced-motion` alternatives for all animation, `prefers-color-scheme` respected. The intercept is a takeover surface — it must trap focus sensibly and always offer an obvious keyboard exit.
