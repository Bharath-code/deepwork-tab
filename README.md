# DeepWork Tab

Your editor has a focus mode. Your browser doesn't.

A focus mode for Chrome: a hard tab cap, a calm intercept screen, and a queue that makes closing feel safe. Not a tab manager. Not a blocker.

## Legend
| Symbol | Meaning |
|--------|---------|
| → | leads to |
| & | and/with |

## Free core (v0.1)

- **Tab cap** — default 7, enforced globally across all windows (new-window bypass doesn't work)
- **Intercept screen** — at cap, new tabs → full-page takeover: queue it, close one, or go back. Includes the "what am I actually looking for?" box, logged locally
- **Delay gate** — raising cap or disabling → 60s countdown showing *your own* reason, typed at onboarding. Tightening is instant
- **Queue** — local list of deferred URLs, one-click restore from the popup
- **D14 heartbeat** — anonymous daily boolean ping (install id + day count, nothing else). `PING_URL` in `background/service-worker.js` is empty → pings disabled until a Cloudflare Worker endpoint exists

## Load it

1. `chrome://extensions` → Developer mode on
2. "Load unpacked" → select this folder
3. Onboarding opens → type your reason. It matters later.

## MV3 design notes

- Service worker is stateless: all state in `chrome.storage.local`, every handler re-reads. Worker death is a non-event
- Cap counts `chrome.tabs.query({windowType:'normal'})` — global, not per-window
- Intercept redirects the new tab (preserves `pendingUrl` for the queue) instead of closing it
- Uninstall can't be blocked. The delay gate is the ceiling & that's fine

## NEVER BUILD (read this, future me)

- AI classification
- Second brain / notes / tags
- Teams
- Sync
- Mobile
- Other browsers

Each is a different product. You know what happens next.

## Roadmap gates

- Week 2 paid layer (ultra focus sessions, YouTube de-pandora, stuck ramp, snooze queue, weekly receipt) only if *I* use the free core daily for 7 straight days
- Day 30: D14 actives ≥10% of installs, or maintenance mode forever

## Naming

"DeepWork Tab" is a working name — check Chrome Web Store for collisions before publishing (candidates: Tab Budget, browserfocus, onetab-mode).
