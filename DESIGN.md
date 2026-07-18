---
name: DeepWork Tab
description: A focus mode for Chrome — hard tab cap, calm intercept, safe queue.
colors:
  steady-blue: "#3563c4"
  steady-blue-dark: "#7aa2f7"
  paper: "#f7f6f2"
  card: "#ffffff"
  ink: "#1a2029"
  muted: "#5b6470"
  line: "#e2e0d9"
  ok-green: "#2f7d4f"
  warn-red: "#b3392b"
  night-bg: "#0f1419"
  night-card: "#171d24"
  night-ink: "#e8e6e1"
  night-muted: "#a0a7b1"
  night-line: "#262d36"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "56px"
    fontWeight: 700
    lineHeight: 1.1
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "30px"
    fontWeight: 600
    letterSpacing: "-0.02em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "20px"
    fontWeight: 600
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.08em"
  data:
    fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, monospace"
    fontSize: "13px"
    lineHeight: 1.6
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "24px"
  s6: "32px"
  s7: "48px"
components:
  button-primary:
    backgroundColor: "{colors.steady-blue}"
    textColor: "{colors.card}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-done:
    backgroundColor: "{colors.ok-green}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
---

# Design System: DeepWork Tab

## 1. Overview

**Creative North Star: "The Held Breath"**

Named for the breathing dot at the top of the intercept screen: this system is a pause, not an alarm. It appears at the user's weakest moment — mid-impulse, about to open tab eight — and its entire job is to de-escalate. Warm paper surfaces, one steady blue voice, generous whitespace, and a slow four-second breathe animation set a tempo the user's pulse can borrow. Nothing flashes, counts down in red, or shames.

The system is honest bookkeeping underneath the calm: tabular numerals, monospace URLs, visible `kbd` hotkey chips. It rejects SaaS dashboard chrome (metric tiles, gradients, cards-on-cards), tab-manager density, and guilt-trip theatrics — the anti-references named in PRODUCT.md. Density stays low everywhere; the popup is a 340px utility strip, the intercept and options are single centered columns of ~520–560px.

**Key Characteristics:**
- Flat, border-defined surfaces; zero box-shadows anywhere
- Warm paper light theme, cool near-black dark theme, both first-class
- One accent (Steady Blue) used sparingly; green and red reserved for outcomes, never decoration
- System fonts only — the extension should feel like part of the browser
- Motion is respiratory, not reactive: slow breathe, quick settle, strong ease-out

## 2. Colors

A restrained palette: warm neutrals carry every surface, one steady blue speaks, and two semantic colors appear only when something true must be said.

### Primary
- **Steady Blue** (#3563c4 light / #7aa2f7 dark): the only voice of the interface — primary buttons, the breathing dot, active gauge dots, focus rings, the delay-gate timer, and the 2px reason-quote rule. Dependable and non-alarming; it never signals urgency.

### Neutral
- **Paper** (#f7f6f2): body background in light mode — warm, slightly bookish off-white.
- **Card** (#ffffff): raised surfaces — queue items, the target-URL box, the gate card.
- **Ink** (#1a2029): all primary text. Never pure black.
- **Muted** (#5b6470): secondary text, labels, ghost buttons. Passes 4.5:1 on Paper.
- **Line** (#e2e0d9): every border and divider; the sole depth mechanism.
- **Night set** (#0f1419 bg / #171d24 card / #e8e6e1 ink / #a0a7b1 muted / #262d36 line): dark theme via `prefers-color-scheme`; same roles, cooler cast.

### Semantic
- **OK Green** (#2f7d4f / #7dcf9a dark): the "done, back under cap" button and success states only.
- **Warn Red** (#b3392b / #e06c5f dark): over-cap gauge dots and genuine warnings only. Never used to pressure.

### Named Rules
**The One Voice Rule.** Steady Blue is the only expressive color. If a screen needs a second accent, the screen is wrong, not the palette.

**The Earned Red Rule.** Warn Red appears only when the user is factually over cap or losing something real (a streak ≥2 days). It is information, never persuasion.

## 3. Typography

**Display/Body Font:** System sans (-apple-system, BlinkMacSystemFont, Segoe UI)
**Data Font:** System mono (ui-monospace, SF Mono, Menlo)

**Character:** Native and unbranded on purpose — the extension borrows the OS's own voice so it reads as browser furniture, not a product performing. The mono face does the honest-bookkeeping work: URLs, timestamps, tab counts, hotkeys.

### Hierarchy
- **Display** (700, 56px): the delay-gate countdown only. The largest thing in the system is the friction itself.
- **Headline** (600, 26–30px, -0.02em): one per page — intercept h1, options h1.
- **Title** (600, 20px): dialog headings (gate card).
- **Body** (400, 14–16px, 1.6): everything else; ~65ch max via the 520–560px columns.
- **Label** (600, 11px, +0.08em, uppercase): section headers in the popup and the target-URL label. Used sparingly — two places, not every section.
- **Data** (mono, 11–13px, tabular-nums): URLs, times, counts, `kbd` chips.

### Named Rules
**The Your-Words Rule.** The user's typed reason is always italic, body-size, set off by a 2px Steady Blue rule — the most typographically distinct text on any screen it appears on. The app's own copy never gets this treatment.

## 4. Elevation

Flat by doctrine. There are no box-shadows anywhere in the system; depth is conveyed entirely by surface color (Paper → Card) and 1px Line borders. The single sanctioned exception is the delay-gate scrim: an 80% background tint with an 8px backdrop blur, which exists to hold focus on the gate card, not to decorate it.

### Named Rules
**The No-Shadow Rule.** If a surface needs to feel raised, give it the Card background and a Line border. A box-shadow is a bug.

## 5. Components

Quiet and matter-of-fact: every control states its action plainly, shows its hotkey when it has one, and gives a small physical press (scale 0.97) as its only flourish.

### Buttons
- **Shape:** gently rounded (10px), 1px Line border.
- **Primary:** Steady Blue fill, white text, weight 600, 12px × 24px padding.
- **Secondary (default):** Card background, Ink text; hover shifts the border to Steady Blue.
- **Done:** OK Green fill — reserved for "I closed enough tabs" resolution.
- **Ghost:** transparent, Muted text; hover raises to Ink.
- **Hover / Active:** primary brightens 10%; all buttons scale to 0.97 on press; 150ms transitions, gated behind `prefers-reduced-motion: no-preference`.
- **Hotkeys:** intercept actions embed a `kbd` chip inside the button, right-aligned.

### Cards / Containers
- **Corner Style:** 10px (target box, gate card at 14px); list items 6px.
- **Background:** Card on Paper.
- **Border:** always 1px Line; no shadow (see Elevation).
- **Internal Padding:** 12–16px; gate card 32px.

### Inputs / Fields
- **Style:** Card background, 1px Line border, 10px radius, 12px × 14px padding.
- **Focus:** border shifts to Steady Blue; no glow. Global `:focus-visible` adds a 2px Steady Blue outline offset 2px.
- **Number inputs:** mono face, 110px wide.

### Navigation
None. Three single-purpose surfaces (popup, intercept, options); no nav chrome, by design.

### kbd Chips (signature)
Mono 11px, Line border with a 2px bottom edge (a subtle key-cap read), 4px radius, Paper background. Inside primary buttons they go transparent with a 35% accent-ink border.

### Cap Gauge (signature)
A row of 10px dots, one per tab: hollow Line circles when free, Steady Blue when occupied, Warn Red when over cap. The whole tab-budget story with zero numbers.

### Breathing Dot (signature)
14px Steady Blue circle, 4s ease-in-out breathe (scale 1→1.6, opacity 0.5→1). The intercept's emotional anchor; static at 0.7 opacity under reduced motion.

## 6. Do's and Don'ts

### Do:
- **Do** keep every surface flat: Card + 1px Line border is the entire elevation vocabulary.
- **Do** gate all animation behind `prefers-reduced-motion: no-preference` with a calm static default — the breathe dot and settle entrance already model this.
- **Do** use the mono face for anything the user might audit: URLs, counts, timestamps, hotkeys.
- **Do** give the user's own typed reason the Your-Words treatment (italic + 2px Steady Blue rule) wherever it appears.
- **Do** use `cubic-bezier(0.23, 1, 0.32, 1)` for entrances and the press-scale for feedback; nothing bounces.

### Don't:
- **Don't** build "SaaS dashboard chrome" — no metric tiles, no gradients, no cards nested in cards (PRODUCT.md anti-reference, verbatim).
- **Don't** use guilt mechanics or urgency styling: no red countdowns, no streak-shaming, no pulsing warnings. Warn Red is for facts only (The Earned Red Rule).
- **Don't** add a second accent color, brand font, or logo flourish. One voice, system faces.
- **Don't** densify toward tab-manager UI: no thumbnails, no folders, no multi-column lists.
- **Don't** add box-shadows (The No-Shadow Rule) or a second backdrop blur beyond the gate scrim.
- **Don't** uppercase-label every section; the 11px tracked label appears in at most two places per surface.
