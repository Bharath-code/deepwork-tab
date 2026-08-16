# Product Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the product holes that break DeepWork Tab's own promises (safe restore, honest permissions, calm a11y) so the three existing surfaces are world-class — without adding features, distribution, or marketing.

**Architecture:** Decision logic stays in pure ES modules under `lib/`, tested with `node --test`. Chrome API calls stay in page scripts and the service worker. No new surfaces. No new runtime dependencies. No build step.

**Tech Stack:** Vanilla MV3, ES modules, `node:test` + `node:assert`. Zero runtime dependencies. GitHub Actions for `npm test` only.

**Spec:** The 2026-08-16 product review (P0–P2 product/engineering items). `PRODUCT.md`, `DESIGN.md`, `README.md` NEVER BUILD. Distribution and marketing are out of scope (no CWS account, screenshots, Lemon Squeezy, domain, listing submit, Show HN, SEO, review-ask, OG images).

## Global Constraints

Every task's requirements implicitly include all of these.

- **No dependencies.** No `npm install` of runtime packages, no bundler, no framework. `package.json` stays `"type": "module"` + `"test": "node --test"`. A GitHub Actions workflow that only runs that script is allowed.
- **NEVER BUILD** (`README.md`): AI classification · second brain/notes/tags · teams · sync · mobile · other browsers.
- **Never upsell on the intercept.** The weekly receipt remains the only upgrade surface.
- **Tightening is instant, loosening waits 60 seconds.** Restore-as-swap is not loosening: cap stays the same.
- **Closing feels safe.** Restore must never bounce the user into the intercept. No URL becomes unrecoverable.
- **No engagement mechanics.** Drop the toolbar badge (FAQ already forbids it). No notifications, points, leaderboards, or review nags.
- **Accessibility:** WCAG 2.1 AA, 24px+ hit targets, visible focus, `prefers-reduced-motion`, `prefers-reduced-transparency` fallback on the gate blur, focus trap on intercept and gate, `lang` on every HTML document.
- **Code style:** no explanatory comments; a `ponytail:` comment marks a deliberate simplification and names its ceiling.
- **Unlicensed Pro stays absent**, never disabled/teasing.
- **Do not change** Lemon Squeezy, store listing submission, domain, screenshots, GTM copy campaigns, or the 14-day review ask.

## Out of scope (do not implement)

Chrome developer account · store screenshots/recording · Lemon Squeezy · custom domain · submit listing · GST · metrics sheet · Show HN · n=1 evidence post · SEO pages · review flywheel · OG/marketing images · swapping CTAs to a store URL (there isn't one).

Honest status copy ("not on the store yet" instead of "in review") is in scope: it is a trust bug, not a campaign.

## File Structure

| File | Responsibility |
|---|---|
| `lib/queue.js` (new) | Pure queue math: add, title fallback, restore plan, queue-current plan |
| `lib/focus.js` (new) | Pure Tab-wrap for focus traps |
| `lib/entitlement.js` | Gains `extractLicenseKey` |
| `test/queue.test.js` (new) | |
| `test/focus.test.js` (new) | |
| `test/entitlement.test.js` | Gains extract-key cases |
| `popup/popup.html` `.js` `.css` | Restore swap picker, undo, session controls, lang/title, 24px targets |
| `intercept/intercept.js` `.html` `.css` | Your-Words last-reason, autofocus, focus trap, 1–9 close, 100dvh |
| `options/options.html` `.js` `.css` | Gate trap, pin hint, still-over, reduced-transparency |
| `options/license.js` | Extract key, request YouTube permission, session prefs |
| `background/service-worker.js` | Drop fetchTitle, drop badge, commands, uninstall URL, ping host only |
| `content/youtube.js` | Keep; stop being a free-user inject (via optional host) |
| `manifest.json` | Narrow hosts, optional YouTube, commands, no content_scripts until granted |
| `site/privacy.html` `index.html` SEO pages | Permissions + listing-status copy |
| `store-listing/permissions.md` | Match the new manifest |
| `site/uninstall.html` (new) | Quiet goodbye page; no email capture |
| `.github/workflows/test.yml` (new) | `node --test` on push |

## Task Order

```
1 queue helpers + restore-as-swap
2 drop fetchTitle, narrow host permissions, privacy copy
3 YouTube as optional host (Pro-only inject)
4 drop badge, incognito sentence, honest listing-status copy
5 intercept polish (Your-Words, trap, 1–9, dvh, autofocus)
6 options polish (gate trap, pin, still-over, license extract)
7 popup polish (24px, undo, session in header)
8 commands + uninstall URL + CI + version 0.3.0
```

Task 1 is the P0 UX hole. Task 2 is the P0 trust hole. Tasks 3–4 depend on 2 (manifest). Tasks 5–7 are independent of each other. Task 8 can land last.

**Ship gate:** each task leaves the extension loadable unpacked. Do not skip Task 1 or 2.

---

### Task 1: Restore-as-swap

Opening a queued tab while at cap currently creates a new tab, which the service worker intercepts. The safety net loops. This task makes restore a swap (or a focus if the URL is already open) and extracts the queue math so later tasks (commands) can reuse it.

**Files:**
- Create: `lib/queue.js`
- Create: `test/queue.test.js`
- Modify: `popup/popup.html`
- Modify: `popup/popup.js`
- Modify: `popup/popup.css`
- Modify: `intercept/intercept.js` (use `queueAfterAdd` + `titleFor`; stop duplicating add logic)

**Interfaces:**
- Produces: `queueAfterAdd(queue, item, max?: number): array` — prepends if URL is new, caps length at `max` (default 200). Does not mutate the input.
- Produces: `titleFor(url, title?: string): string` — keeps a real title; otherwise hostname without `www.`
- Produces: `restoreAction({ cap, tabCount, queuedUrl, openUrls }): { action: 'focus'|'open'|'swap' }`
- Produces: `queueCurrentPlan({ tabCount, url, interceptBase }): { action: 'noop'|'enqueue-keep'|'enqueue-close' }` (used in Task 8; write and test it now so commands do not invent a second policy)

- [ ] **Step 1: Write the failing tests**

Create `test/queue.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queueAfterAdd, titleFor, restoreAction, queueCurrentPlan } from '../lib/queue.js';

test('queueAfterAdd prepends a new url and does not mutate the input', () => {
  const queue = [{ url: 'https://a.example', title: 'a', ts: 1 }];
  const next = queueAfterAdd(queue, { url: 'https://b.example', title: 'b', ts: 2 });
  assert.equal(queue.length, 1);
  assert.deepEqual(next.map((q) => q.url), ['https://b.example', 'https://a.example']);
});

test('queueAfterAdd ignores a duplicate url', () => {
  const queue = [{ url: 'https://a.example', title: 'a', ts: 1 }];
  assert.equal(queueAfterAdd(queue, { url: 'https://a.example', title: 'a2', ts: 2 }), queue);
});

test('queueAfterAdd caps at max', () => {
  const queue = [
    { url: 'https://a.example', title: 'a', ts: 1 },
    { url: 'https://b.example', title: 'b', ts: 2 }
  ];
  const next = queueAfterAdd(queue, { url: 'https://c.example', title: 'c', ts: 3 }, 2);
  assert.equal(next.length, 2);
  assert.equal(next[0].url, 'https://c.example');
  assert.equal(next[1].url, 'https://a.example');
});

test('titleFor keeps a real title and falls back to hostname', () => {
  assert.equal(titleFor('https://www.docs.example/api', 'Pagination'), 'Pagination');
  assert.equal(titleFor('https://www.docs.example/api', 'https://www.docs.example/api'), 'docs.example');
  assert.equal(titleFor('https://www.docs.example/api'), 'docs.example');
  assert.equal(titleFor('not-a-url'), 'not-a-url');
});

test('restoreAction focuses an already-open url, opens under cap, swaps at cap', () => {
  const url = 'https://queued.example';
  assert.deepEqual(
    restoreAction({ cap: 7, tabCount: 7, queuedUrl: url, openUrls: [url] }),
    { action: 'focus' }
  );
  assert.deepEqual(
    restoreAction({ cap: 7, tabCount: 4, queuedUrl: url, openUrls: [] }),
    { action: 'open' }
  );
  assert.deepEqual(
    restoreAction({ cap: 7, tabCount: 7, queuedUrl: url, openUrls: [] }),
    { action: 'swap' }
  );
  assert.deepEqual(
    restoreAction({ cap: 7, tabCount: 9, queuedUrl: url, openUrls: [] }),
    { action: 'swap' }
  );
});

test('queueCurrentPlan refuses chrome/extension/intercept urls and will not close the last tab', () => {
  const interceptBase = 'chrome-extension://id/intercept/intercept.html';
  assert.equal(queueCurrentPlan({ tabCount: 5, url: 'chrome://extensions', interceptBase }).action, 'noop');
  assert.equal(queueCurrentPlan({ tabCount: 5, url: interceptBase + '?target=x', interceptBase }).action, 'noop');
  assert.equal(queueCurrentPlan({ tabCount: 1, url: 'https://a.example', interceptBase }).action, 'enqueue-keep');
  assert.equal(queueCurrentPlan({ tabCount: 5, url: 'https://a.example', interceptBase }).action, 'enqueue-close');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/queue.test.js`

Expected: `MODULE_NOT_FOUND` for `../lib/queue.js`

- [ ] **Step 3: Implement `lib/queue.js`**

```js
export function queueAfterAdd(queue, item, max = 200) {
  if (!Array.isArray(queue) || !item?.url) return queue;
  if (queue.some((q) => q.url === item.url)) return queue;
  return [item, ...queue].slice(0, max);
}

export function titleFor(url, title) {
  if (title && title !== url) return title;
  try {
    return new URL(url).hostname.replace(/^www\./, '') || url;
  } catch {
    return url;
  }
}

export function restoreAction({ cap, tabCount, queuedUrl, openUrls }) {
  if (queuedUrl && Array.isArray(openUrls) && openUrls.includes(queuedUrl)) {
    return { action: 'focus' };
  }
  if (tabCount < cap) return { action: 'open' };
  return { action: 'swap' };
}

export function queueCurrentPlan({ tabCount, url, interceptBase }) {
  if (!url) return { action: 'noop' };
  if (url.startsWith('chrome:') || url.startsWith('edge:') || url.startsWith('about:')) {
    return { action: 'noop' };
  }
  if (interceptBase && url.startsWith(interceptBase)) return { action: 'noop' };
  if (tabCount <= 1) return { action: 'enqueue-keep' };
  return { action: 'enqueue-close' };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/queue.test.js`

Expected: PASS, all tests.

- [ ] **Step 5: Intercept uses `queueAfterAdd` + `titleFor`**

In `intercept/intercept.js`, add:

```js
import { queueAfterAdd, titleFor } from '../lib/queue.js';
```

Replace `enqueue` with:

```js
async function enqueue(url, title = url) {
  const { queue = [] } = await chrome.storage.local.get('queue');
  const next = queueAfterAdd(queue, { url, title: titleFor(url, title), ts: Date.now() });
  if (next === queue) return;
  await chrome.storage.local.set({ queue: next });
  logEvent('queue', domainOf(url));
}
```

Delete the `fetchTitle` message. Title backfill is gone in Task 2; intercept must already stop requesting it.

- [ ] **Step 6: Popup swap picker markup**

In `popup/popup.html`, inside the queued section, after `<ul id="queue"></ul>`:

```html
    <div id="swap" hidden>
      <p class="swap-lead">You're at the cap. Close one tab to open this.</p>
      <p id="swapTarget" class="url"></p>
      <ul id="swapTabs"></ul>
      <button id="swapCancel" class="ghost">Cancel</button>
    </div>
```

- [ ] **Step 7: Popup restore logic**

In `popup/popup.js`, import:

```js
import { restoreAction, titleFor } from '../lib/queue.js';
```

Replace the Open button handler. Keep `removeAt`. Add:

```js
let pendingRestore = null;

function hideSwap() {
  pendingRestore = null;
  $('swap').hidden = true;
  $('swapTabs').replaceChildren();
}

async function restoreItem(item, index) {
  const [tabs, { cap }] = await Promise.all([
    chrome.tabs.query({ windowType: 'normal' }),
    chrome.storage.local.get({ cap: 7 })
  ]);
  const openUrls = tabs.map((t) => t.url).filter(Boolean);
  const plan = restoreAction({ cap, tabCount: tabs.length, queuedUrl: item.url, openUrls });

  if (plan.action === 'focus') {
    const existing = tabs.find((t) => t.url === item.url);
    await removeAt(index);
    if (existing) await chrome.tabs.update(existing.id, { active: true });
    window.close();
    return;
  }

  if (plan.action === 'open') {
    await removeAt(index);
    chrome.tabs.create({ url: item.url });
    window.close();
    return;
  }

  pendingRestore = { item, index };
  $('swapTarget').textContent = titleFor(item.url, item.title);
  $('swap').hidden = false;
  const list = $('swapTabs');
  list.replaceChildren();
  const candidates = tabs
    .slice()
    .sort((a, b) => (a.lastAccessed || 0) - (a.lastAccessed || 0) && (a.lastAccessed || 0) - (b.lastAccessed || 0));
  // oldest first — same policy as intercept/sortForClosing
  candidates.sort((a, b) => (a.lastAccessed || 0) - (b.lastAccessed || 0));
  for (const t of candidates) {
    const li = document.createElement('li');
    const title = document.createElement('span');
    title.className = 'url';
    title.textContent = t.title || t.url;
    li.appendChild(title);
    const btn = document.createElement('button');
    btn.textContent = 'Close';
    btn.setAttribute('aria-label', `Close ${t.title || t.url} and open the queued page`);
    btn.addEventListener('click', () => finishSwap(t));
    li.appendChild(btn);
    list.appendChild(li);
  }
  list.querySelector('button')?.focus();
  $('status').textContent = 'Pick a tab to close, then the queued page opens';
}

async function finishSwap(tab) {
  if (!pendingRestore) return;
  const { item, index } = pendingRestore;
  const saved = /^https?:\/\//i.test(tab.url || '');
  if (saved) {
    const { queue = [] } = await chrome.storage.local.get('queue');
    const next = queueAfterAdd(queue, {
      url: tab.url,
      title: titleFor(tab.url, tab.title),
      ts: Date.now()
    });
    await chrome.storage.local.set({ queue: next });
  }
  await chrome.tabs.remove(tab.id);
  await removeAt(index);
  chrome.tabs.create({ url: item.url });
  window.close();
}
```

Fix the Open handler to `open.addEventListener('click', () => restoreItem(item, i));`

Wire `$('swapCancel').addEventListener('click', () => { hideSwap(); render(); });`

On Escape, if `#swap` is visible, cancel swap before closing the snooze menu.

Import `queueAfterAdd` in popup.js as well.

Correct the mistaken double-sort in the snippet above — the implementer must use **only**:

```js
const candidates = tabs.slice().sort((a, b) => (a.lastAccessed || 0) - (b.lastAccessed || 0));
```

- [ ] **Step 8: Swap picker CSS**

In `popup/popup.css`:

```css
#swap { margin-top: var(--s3); }
.swap-lead { font-size: 13px; margin-bottom: var(--s2); }
#swap .url { font: 12px/1.6 var(--mono); color: var(--muted); margin-bottom: var(--s2); }
#swapCancel { margin-top: var(--s2); width: 100%; }
#swapTabs li button { min-height: 24px; min-width: 24px; }
```

- [ ] **Step 9: Manual check**

Load unpacked. At cap, queue a URL from the intercept, then Open it from the popup. Expected: picker, not intercept. Close one listed tab. Expected: queued page opens, closed tab's URL is in the queue, cap not exceeded. Under cap, Open still opens immediately. If the URL is already open, that tab activates and the queue row disappears.

- [ ] **Step 10: Commit**

```bash
git add lib/queue.js test/queue.test.js popup/popup.html popup/popup.js popup/popup.css intercept/intercept.js
git commit -m "$(cat <<'EOF'
fix: restore a queued tab by swapping, never by intercepting

Opening from the queue at cap used to create a tab the service worker
immediately paused. Restore now focuses, opens, or asks which tab to close.
EOF
)"
```

---

### Task 2: Drop fetchTitle and narrow host permissions

`background/service-worker.js` fetches arbitrary page HTML to scrape `<title>`. That is why the manifest asks for `http://*/*` and `https://*/*`, and why the privacy policy's "page content is never read" is false. `tabs` already provides `pendingUrl`. The daily ping still needs its own origin.

**Files:**
- Modify: `background/service-worker.js`
- Modify: `manifest.json`
- Modify: `store-listing/permissions.md`
- Modify: `site/privacy.html`
- Modify: `site/index.html` (permissions list)

**Interfaces:**
- Consumes: Task 1 already stopped sending `{ type: 'fetchTitle' }`
- Produces: host permission is only the ping Worker. YouTube stays declared as a content script until Task 3 moves it to optional.

- [ ] **Step 1: Delete title fetching from the service worker**

Remove `ENTITIES`, `decodeEntities`, `fetchTitle`, `backfillTitles`, the `onMessage` branch for `fetchTitle`, and the `backfillTitles()` calls in `onInstalled` / `onStartup`.

Keep the `logEvent` message handler. After the cut, `onMessage` should be only:

```js
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'logEvent') logEvent(msg.eventType, msg.domain);
});
```

If nothing else remains that uses `onMessage` besides logEvent, this is fine.

- [ ] **Step 2: Narrow `manifest.json` host permissions**

Replace:

```json
  "host_permissions": ["http://*/*", "https://*/*"],
```

with:

```json
  "host_permissions": [
    "https://deepwork-tab-ping.kumarbharath63.workers.dev/*"
  ],
```

Leave `content_scripts` for YouTube in place until Task 3. Without all-URL host permission, the YouTube script still injects because its `matches` is a more specific pattern Chrome grants to declared content scripts. Task 3 will make that optional. Do not also delete the YouTube block in this task — reviewers should see one permission change at a time, but more importantly Task 3 has the activate-time request UX.

**Ponytail if the YouTube script stops injecting after this task:** that means this Chrome version requires host permission for content_scripts. If that happens, do not add `*://www.youtube.com/*` back as a required host. Jump to Task 3 immediately (optional host + request on activate). Note it in the commit body.

- [ ] **Step 3: Rewrite permission justifications**

Replace the host_permissions bullet in `store-listing/permissions.md` with:

```md
- **host_permissions (`https://deepwork-tab-ping.kumarbharath63.workers.dev/*`)** — send the once-daily anonymous ping (install id + day only). No other origin is contacted. Tab URLs come from the `tabs` permission (`pendingUrl` / `url`), not from fetching pages.
- **content script on www.youtube.com** — a paid feature hides the recommendation sidebar, comments and home feed on YouTube, and turns off YouTube's own autoplay toggle. It only restyles the page's own layout and clicks that one existing control; no page content is collected, stored or transmitted. (Task 3 will move this to optional host permission.)
```

Delete the old "read the URL a tab was about to open" all-sites bullet.

- [ ] **Step 4: Privacy policy and landing permissions**

In `site/privacy.html`:

- Change last-updated to `2026-08-16`.
- Replace the host-permissions list item with: the ping Worker origin only; tab URLs come from `tabs`; page HTML is never fetched.
- Keep the "no browsing history leaves your machine" sentence; it is now true.

In `site/index.html` permissions `<ul class="perms">`, replace the host-permissions row:

```html
      <li><code>tabs</code><span>Count open tabs against your cap; close and reopen queued ones. The URL you were about to open comes from here, not from reading the page.</span></li>
      <li><code>storage</code><span>Save your cap, queue and reasons locally on your device.</span></li>
      <li><code>alarms</code><span>Schedule the once-daily anonymous ping.</span></li>
      <li><code>host</code><span>One origin: the ping worker. Install id and day, nothing else.</span></li>
```

- [ ] **Step 5: Manual check**

Load unpacked. Hit the cap, queue a new tab. Popup row shows the hostname (not a fetched `<title>`). Close an existing tab from the intercept: row shows that tab's real title. Service worker does not `fetch()` any page except the ping URL (watch the worker's network in `chrome://extensions` → inspect service worker, or just grep: `fetchTitle` and `backfillTitles` must be gone).

- [ ] **Step 6: Commit**

```bash
git add background/service-worker.js manifest.json store-listing/permissions.md site/privacy.html site/index.html
git commit -m "$(cat <<'EOF'
fix: stop fetching page HTML for titles, drop all-site host access

Titles now come from the tab or the hostname. The only remaining host
permission is the anonymous daily ping origin.
EOF
)"
```

---

### Task 3: YouTube de-pandora is optional and Pro-only

Free users currently get a YouTube content script that then checks `pro` after paint (sidebar can flash). CWS also shows YouTube access to everyone. Grant `*://www.youtube.com/*` only after Pro activate; keep the script in the manifest so we do not need the `scripting` permission.

**Files:**
- Modify: `manifest.json`
- Modify: `options/license.js`
- Modify: `options/options.html`
- Modify: `content/youtube.js` (remove the storage race comment's old ceiling; keep killAutoplay)
- Modify: `store-listing/permissions.md`
- Modify: `site/privacy.html` (optional YouTube sentence)

**Interfaces:**
- Consumes: `isPro()` / `pro` in storage from entitlement
- Produces: `YOUTUBE_ORIGIN = '*://www.youtube.com/*'` used by license.js
- Produces: after a successful license, `chrome.permissions.request({ origins: [YOUTUBE_ORIGIN] })`. Denial does not revoke Pro.

- [ ] **Step 1: Manifest — optional YouTube host**

In `manifest.json`:

- Keep `content_scripts` as they are (youtube matches, document_start).
- Add:

```json
  "optional_host_permissions": ["*://www.youtube.com/*"],
```

Chrome will not inject a manifest content script for a host the extension has not been granted. Free installs never see the prompt. Pro activate requests it.

- [ ] **Step 2: Request on activate; allow a later grant**

In `options/options.html`, inside `#license`, after `#licenseMsg`:

```html
      <p id="youtubePerm" class="muted" hidden></p>
      <button id="youtubeBtn" hidden>Allow on YouTube</button>
```

In `options/license.js`:

```js
const YOUTUBE_ORIGIN = '*://www.youtube.com/*';

async function youtubeGranted() {
  return chrome.permissions.contains({ origins: [YOUTUBE_ORIGIN] });
}

async function requestYoutube() {
  try {
    return await chrome.permissions.request({ origins: [YOUTUBE_ORIGIN] });
  } catch {
    return false;
  }
}

async function paintYoutube(pro) {
  const granted = pro ? await youtubeGranted() : false;
  $('youtubeBtn').hidden = !pro || granted;
  $('youtubePerm').hidden = !pro;
  $('youtubePerm').textContent = !pro
    ? ''
    : granted
      ? 'YouTube de-pandora is on.'
      : 'YouTube de-pandora needs access to youtube.com. Other Pro features already work.';
}

$('youtubeBtn')?.addEventListener('click', async () => {
  const ok = await requestYoutube();
  $('licenseMsg').textContent = ok
    ? 'YouTube de-pandora is on.'
    : 'No change. You can grant this later.';
  paint();
});
```

Call `paintYoutube(pro)` from `paint()`. After a successful `verifyLicense` and `storage.local.set({ pro: true, ... })`, call `requestYoutube()` once (the browser prompt). Do not fail activation if it returns false.

- [ ] **Step 3: Content script assumes grant**

In `content/youtube.js`, keep the `pro` check (a revoked permission unloads the script; a still-injected script on a leftover grant must not run for a lapsed license). Delete the ponytail that tells a future author to use `registerContentScripts` — optional host is the chosen ceiling.

- [ ] **Step 4: Docs**

`store-listing/permissions.md` — replace the content-script bullet with:

```md
- **optional host `*://www.youtube.com/*`** — requested only after Pro is activated. Hides YouTube's sidebar, comments, home feed and autoplay toggle. Not granted at install. Denied: Pro still works; de-pandora stays off.
```

`site/privacy.html` — add one sentence under permissions: YouTube access is optional, Pro-only, and never granted at install.

- [ ] **Step 5: Manual check**

Load unpacked as free: visit YouTube, `document.documentElement.classList` must not contain `dwt-depandora`. Activate a test license (see `tools/make-license.mjs`). Expected: Chrome permission prompt for youtube.com. Accept: sidebar gone on reload. Reload the extension, revoke the optional permission from `chrome://extensions` detail: Pro still active, `#youtubeBtn` visible, sidebar back.

- [ ] **Step 6: Commit**

```bash
git add manifest.json options/license.js options/options.html content/youtube.js store-listing/permissions.md site/privacy.html
git commit -m "$(cat <<'EOF'
fix: grant YouTube access only after Pro activate

Free installs no longer inject on youtube.com. Denying the optional
host leaves every other Pro feature on.
EOF
)"
```

---

### Task 4: Badge doctrine, incognito sentence, honest listing status

FAQ says there are no badges. The service worker paints a tab-count badge, red when over cap. That is an alarm on the toolbar. The site says the listing is "in review" while `TODO.md` still has submit unchecked.

**Files:**
- Modify: `background/service-worker.js`
- Modify: `options/options.html` `options.js` (incognito line)
- Modify: `site/index.html`
- Modify: `site/vs-freedom.html` `site/too-many-tabs-open.html` `site/adhd-too-many-tabs.html`

- [ ] **Step 1: Delete the badge**

Remove `updateBadge` and every call (`onInstalled`, `onStartup`, `tabs.onCreated`, `tabs.onRemoved`, `storage.onChanged` for cap). Do not replace it with a different badge. `chrome.action.setBadgeText({ text: '' })` once in `onInstalled` so existing dogfood installs clear a leftover badge:

```js
chrome.action.setBadgeText({ text: '' });
```

Call that in `onInstalled` and `onStartup` only.

- [ ] **Step 2: Incognito sentence on options**

In `options/options.html`, after the Enforcement checkbox, before Save:

```html
      <p class="muted incognito-note">Does not run in Incognito unless you turn it on for this extension at chrome://extensions. That is Chrome's default, not a setting here.</p>
```

In `options/options.css`:

```css
.incognito-note { font-size: 13px; margin: calc(-1 * var(--s3)) 0 var(--s5); }
```

- [ ] **Step 3: Honest listing status**

Replace every visible `Chrome Web Store listing in review` with `Not on the Chrome Web Store yet`. Four files: `site/index.html` (hero + close), `site/vs-freedom.html`, `site/too-many-tabs-open.html`, `site/adhd-too-many-tabs.html`.

In `site/index.html` `#notify` lede, replace "The Chrome Web Store listing is still in review" with "It is not on the Chrome Web Store yet".

Do not add a store URL. Do not change GitHub CTAs.

- [ ] **Step 4: Manual check**

Reload. Toolbar icon has no number. Over-cap does not turn the icon red. Site copy no longer claims a review that has not started.

- [ ] **Step 5: Commit**

```bash
git add background/service-worker.js options/options.html options/options.css site/index.html site/vs-freedom.html site/too-many-tabs-open.html site/adhd-too-many-tabs.html
git commit -m "$(cat <<'EOF'
fix: drop the toolbar badge and stop claiming the listing is in review

The FAQ already promised no badges. The site now matches the actual
store status: not submitted.
EOF
)"
```

---

### Task 5: Intercept polish

DESIGN.md's Your-Words rule (italic + 2px Steady Blue rule) is used for the onboarding reason, not for per-domain recall, which is the more persuasive line. PRODUCT.md requires a focus trap on the takeover. Intent is too easy to skip. Close-list has no keyboard picker.

**Files:**
- Create: `lib/focus.js`
- Create: `test/focus.test.js`
- Modify: `intercept/intercept.html` `.css` `.js`

**Interfaces:**
- Produces: `wrapFocus(ids, activeId, shift): string | null` — ids are comparable primitives (we pass element ids in tests; the page passes elements via a thin wrapper).
- Produces: `focusables(root): Element[]` lives in the page, not lib (DOM). Lib only wraps.

Use elements in the page wrapper:

```js
import { wrapFocus } from '../lib/focus.js';

function trapTab(root, e) {
  if (e.key !== 'Tab') return;
  const nodes = [...root.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])'
  )].filter((el) => el.offsetParent !== null && !el.closest('[hidden]'));
  const next = wrapFocus(nodes, document.activeElement, e.shiftKey);
  if (next && next !== document.activeElement) {
    e.preventDefault();
    next.focus();
  }
}
```

- [ ] **Step 1: Write failing focus tests**

Create `test/focus.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrapFocus } from '../lib/focus.js';

test('wrapFocus cycles forward and backward', () => {
  const nodes = ['a', 'b', 'c'];
  assert.equal(wrapFocus(nodes, 'a', false), 'b');
  assert.equal(wrapFocus(nodes, 'c', false), 'a');
  assert.equal(wrapFocus(nodes, 'a', true), 'c');
  assert.equal(wrapFocus(nodes, 'b', true), 'a');
});

test('wrapFocus with an empty list or a stranger returns the first', () => {
  assert.equal(wrapFocus([], 'x', false), null);
  assert.equal(wrapFocus(['a', 'b'], 'z', false), 'a');
  assert.equal(wrapFocus(['a', 'b'], 'z', true), 'b');
});
```

- [ ] **Step 2: Run to verify fail**

Run: `node --test test/focus.test.js`

Expected: `MODULE_NOT_FOUND`

- [ ] **Step 3: Implement `lib/focus.js`**

```js
export function wrapFocus(nodes, active, shift) {
  if (!nodes.length) return null;
  const i = nodes.indexOf(active);
  if (shift) return i <= 0 ? nodes[nodes.length - 1] : nodes[i - 1];
  if (i === -1 || i === nodes.length - 1) return nodes[0];
  return nodes[i + 1];
}
```

- [ ] **Step 4: Run tests**

Run: `node --test test/focus.test.js`

Expected: PASS

- [ ] **Step 5: Your-Words last-reason + autofocus + dvh**

`intercept/intercept.html` — replace the last-reason paragraph with:

```html
    <p class="reason" id="lastReason" hidden></p>
```

In `showLastReason`, set `$('lastReason').textContent = text` (the reason alone, italic + blue rule). Do not prefix "Last time you wrote:" in the same node — that prefix is app voice. Put it in `aria-label`:

```js
$('lastReason').textContent = text;
$('lastReason').setAttribute('aria-label', `Last time you wrote: ${text}`);
$('lastReason').hidden = false;
```

Delete `.last-reason` CSS. The existing `.reason` rule is the Your-Words treatment.

`intercept/intercept.css`:

```css
body {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  place-items: center;
}
```

At the end of `init()`, if `hasTarget` and the intercept is staying on screen (not `passThrough`):

```js
$('intent').focus();
```

- [ ] **Step 6: Focus trap + 1–9 on the close list**

In `intercept/intercept.js`, import `wrapFocus`. On `document` keydown, before the existing handler:

```js
document.addEventListener('keydown', (e) => {
  trapTab(document.querySelector('main'), e);
});
```

When `listShown` and the key is `1`–`9` and the user is not typing in `#intent`:

```js
const n = e.key.charCodeAt(0) - 49; // '1' -> 0
const btn = $('tabs').querySelectorAll('button')[n];
btn?.click();
```

Add this inside the existing keydown listener, after the `typing` early-return, before `q`/`c`.

- [ ] **Step 7: Manual check**

Open intercept. Tab cycles inside `main` (does not escape to Chrome chrome). Last-reason is italic with the blue rule, same as the onboarding quote. Intent is focused. Open the close list, press `1`: first row closes. `prefers-reduced-motion: reduce` still freezes the breath dot (existing).

- [ ] **Step 8: Commit**

```bash
git add lib/focus.js test/focus.test.js intercept/intercept.html intercept/intercept.css intercept/intercept.js
git commit -m "$(cat <<'EOF'
fix: give the intercept a focus trap and Your-Words recall

Per-domain recall now uses the same italic rule as the onboarding
reason. Tab stays inside the takeover; 1–9 closes a listed tab.
EOF
)"
```

---

### Task 6: Options polish

The delay gate is `alertdialog` but does not trap focus, so a user can Tab into the form and save again while the timer runs. First-run skip leaves them over cap with no reminder. The puzzle-icon pin is never taught, so the queue is invisible. License paste fails if they paste the whole email.

**Files:**
- Modify: `lib/entitlement.js`
- Modify: `test/entitlement.test.js`
- Modify: `options/options.html` `.js` `.css`
- Modify: `options/license.js`

**Interfaces:**
- Produces: `extractLicenseKey(raw: string): string` — returns a trimmed single token, or the first `base64url.base64url` span of ≥20 chars per side from a pasted blob.

- [ ] **Step 1: Write failing extract tests**

Append to `test/entitlement.test.js`:

```js
import { extractLicenseKey } from '../lib/entitlement.js';

test('extractLicenseKey returns a bare token unchanged', () => {
  assert.equal(extractLicenseKey('  aaaabbbbccccddddeeee.ffffgggghhhhiiiijjjj  '), 'aaaabbbbccccddddeeee.ffffgggghhhhiiiijjjj');
});

test('extractLicenseKey pulls a token out of a pasted email', () => {
  const blob = 'Thanks for buying.\nKey: aaaabbbbccccddddeeee.ffffgggghhhhiiiijjjj\nSee you.';
  assert.equal(extractLicenseKey(blob), 'aaaabbbbccccddddeeee.ffffgggghhhhiiiijjjj');
});

test('extractLicenseKey returns empty for blank input', () => {
  assert.equal(extractLicenseKey(''), '');
  assert.equal(extractLicenseKey('   '), '');
});
```

- [ ] **Step 2: Run to verify fail**

Run: `node --test test/entitlement.test.js`

Expected: FAIL, `extractLicenseKey` is not exported.

- [ ] **Step 3: Implement `extractLicenseKey`**

In `lib/entitlement.js`:

```js
const KEY_RE = /[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/;

export function extractLicenseKey(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  if (!/\s/.test(s) && s.includes('.')) return s;
  const m = s.match(KEY_RE);
  return m ? m[0] : s;
}
```

Use it in `options/license.js`:

```js
import { verifyLicense, extractLicenseKey } from '../lib/entitlement.js';
// ...
const { valid, email } = await verifyLicense(extractLicenseKey($('licenseKey').value));
```

- [ ] **Step 4: Run tests**

Run: `node --test test/entitlement.test.js`

Expected: PASS

- [ ] **Step 5: Gate focus trap + disable the form**

In `options/options.js`, import `wrapFocus`. In `openGate`:

```js
$('settings').inert = true;
$('license').inert = true;
```

In cancel and in the timer's `left <= 0` path (before `apply`):

```js
$('settings').inert = false;
$('license').inert = false;
```

Add a keydown listener (alongside the existing Escape-to-cancel):

```js
document.addEventListener('keydown', (e) => {
  if ($('gate').hidden) return;
  if (e.key === 'Tab') {
    const next = wrapFocus(
      [...$('gate-card') ? [] : []],
      document.activeElement,
      e.shiftKey
    );
  }
});
```

Do **not** copy that broken snippet. Implement:

```js
document.addEventListener('keydown', (e) => {
  if ($('gate').hidden) return;
  if (e.key !== 'Tab') return;
  const nodes = [...$('gate').querySelectorAll('button, [href], input, textarea, select')].filter(
    (el) => !el.disabled
  );
  const next = wrapFocus(nodes, document.activeElement, e.shiftKey);
  if (next) {
    e.preventDefault();
    next.focus();
  }
});
```

Give `.gate-card` `id="gateCard"` if you prefer `$('gateCard')`; querying `$('gate')` is enough.

- [ ] **Step 6: Pin hint + still-over**

In `options/options.html`, after `#status` inside `#settings`:

```html
      <p id="stillOver" class="muted" hidden></p>
      <p id="pinHint" class="muted" hidden>Pin DeepWork Tab to the toolbar (puzzle icon, then pin) so the queue is one click away. That is where queued pages live.</p>
```

In `options/options.js` `load()` (and after `finishOnboarding` when they skip):

```js
async function paintHints() {
  const [{ cap }, tabs] = await Promise.all([
    chrome.storage.local.get({ cap: 7 }),
    chrome.tabs.query({ windowType: 'normal' })
  ]);
  const extra = tabs.length - cap;
  $('stillOver').hidden = extra <= 0;
  if (extra > 0) {
    $('stillOver').textContent = `You still have ${extra} more than the cap. The next new tab will pause.`;
  }
  if (chrome.action.getUserSettings) {
    const { isOnToolbar } = await chrome.action.getUserSettings();
    $('pinHint').hidden = isOnToolbar;
  }
}
```

Call `paintHints()` from `load()` and from the skip handler.

- [ ] **Step 7: Reduced transparency on the gate**

In `options/options.css`:

```css
@media (prefers-reduced-transparency: reduce) {
  .gate {
    background: var(--bg);
    backdrop-filter: none;
  }
}
```

- [ ] **Step 8: Manual check**

Raise the cap to trigger the gate. Tab stays on Cancel. Settings fields are not reachable. Skip first-run over cap: still-over line is visible until you close enough tabs and reload options. Unpin the extension: pin hint visible. Pin it: hint hidden. Paste a fake email containing a real test key: Activate verifies.

- [ ] **Step 9: Commit**

```bash
git add lib/entitlement.js test/entitlement.test.js options/options.html options/options.js options/options.css options/license.js
git commit -m "$(cat <<'EOF'
fix: trap the delay gate, teach the pin, extract pasted license keys

The timer can no longer be bypassed by tabbing into Save. Over-cap
and an unpinned icon stay visible until they are not.
EOF
)"
```

---

### Task 7: Popup polish — hit targets, undo, session

Popup Open/dismiss controls are under 24px. Dismiss is an `✕` with no undo. Ultra focus is buried under Settings → license.

**Files:**
- Modify: `popup/popup.html` `.js` `.css`
- Modify: `options/license.js` (persist last session prefs so popup and options share them)

**Interfaces:**
- Consumes: `sessionState`, `formatRemaining`, `isPro` (already imported in popup? popup has `isPro`. Add session imports.)
- Produces: storage key `sessionPrefs: { cap: number, mins: number }` written whenever a session starts. Default `{ cap: 3, mins: 50 }`.

- [ ] **Step 1: `lang` and title**

`popup/popup.html` `<html>` becomes `<html lang="en">`. Add `<title>DeepWork Tab</title>` in `<head>`.

- [ ] **Step 2: 24px targets**

In `popup/popup.css` replace the small button rules:

```css
li button {
  padding: 4px 10px;
  font-size: 12px;
  flex-shrink: 0;
  border-radius: var(--r-sm);
  min-height: 24px;
  min-width: 24px;
}

button.x { padding: 4px 8px; color: var(--muted); min-height: 24px; min-width: 24px; }
```

`.zzz` already has 24px. Keep it.

- [ ] **Step 3: Undo dismiss**

In `popup/popup.js`, replace the dismiss handler so it does not delete immediately:

```js
let undo = null;

function clearUndo() {
  if (undo?.timer) clearTimeout(undo.timer);
  undo = null;
}

async function dismissAt(i) {
  const { queue = [] } = await chrome.storage.local.get('queue');
  const item = queue[i];
  if (!item) return;
  queue.splice(i, 1);
  await chrome.storage.local.set({ queue });
  clearUndo();
  undo = {
    item,
    index: i,
    timer: setTimeout(() => {
      undo = null;
      $('status').textContent = '';
    }, 4000)
  };
  $('status').textContent = 'Removed. Press Z to undo.';
  render();
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'z' && e.key !== 'Z') return;
  if (!undo) return;
  if (e.target.closest('input, textarea')) return;
  e.preventDefault();
  restoreUndo();
});

async function restoreUndo() {
  if (!undo) return;
  const snapshot = undo.item;
  const at = undo.index;
  clearUndo();
  const { queue = [] } = await chrome.storage.local.get('queue');
  queue.splice(at, 0, snapshot);
  await chrome.storage.local.set({ queue });
  $('status').textContent = 'Restored';
  render();
}
```

Point the ✕ click at `dismissAt(i)`. Keep `aria-label="Remove from queue"`.

- [ ] **Step 4: Session controls in the popup header**

In `popup/popup.html`, after the settings button:

```html
    <div id="sessionBar" hidden>
      <p id="sessionLabel" class="muted"></p>
      <button id="sessionStart" class="ghost" hidden>Start focus</button>
    </div>
```

Sessions cannot be ended early (existing options copy). The popup only **starts** a session or shows remaining time. Never add a Stop button.

In `popup/popup.js` `render()`:

```js
import { sessionState, formatRemaining } from '../lib/session.js';

  const [{ cap, queue = [], streak, weekLog = [], session = null, sessionPrefs = { cap: 3, mins: 50 } }, tabs, pro] = await Promise.all([
    chrome.storage.local.get({ cap: 7, queue: [], streak: null, weekLog: [], session: null, sessionPrefs: { cap: 3, mins: 50 } }),
    chrome.tabs.query({ windowType: 'normal' }),
    isPro()
  ]);

  const { active, remainingMs } = sessionState(session);
  $('sessionBar').hidden = !pro;
  $('sessionStart').hidden = !pro || active;
  $('sessionLabel').textContent = active
    ? `Focus · ${formatRemaining(remainingMs)} left`
    : '';
```

```js
$('sessionStart').addEventListener('click', async () => {
  const { sessionPrefs = { cap: 3, mins: 50 } } = await chrome.storage.local.get('sessionPrefs');
  await chrome.storage.local.set({
    session: { cap: sessionPrefs.cap, endsAt: Date.now() + sessionPrefs.mins * 60000 }
  });
  render();
});
```

In `options/license.js` `sessionBtn` click, also write prefs:

```js
await chrome.storage.local.set({
  session: { cap, endsAt: Date.now() + mins * 60000 },
  sessionPrefs: { cap, mins }
});
```

- [ ] **Step 5: Session bar CSS**

```css
#sessionBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s2);
  padding: 0 var(--s4) var(--s3);
}
#sessionLabel { font-size: 12px; }
#sessionStart { min-height: 24px; }
header { flex-wrap: wrap; }
```

The header currently is a single row (gauge | settings). Put `#sessionBar` **below** `</header>` as its own strip, not inside the flex header — otherwise wrap will wreck the gauge. Place it between `</header>` and `#receipt`.

- [ ] **Step 6: Manual check**

Pro license on. Popup shows Start focus. Starting uses last options values (or 3 / 50). Remaining time appears; no Stop. Dismiss a queue row, press Z within 4s: it returns. Hit targets are at least 24px (DevTools computed). Screen reader still hears the live region.

- [ ] **Step 7: Commit**

```bash
git add popup/popup.html popup/popup.js popup/popup.css options/license.js
git commit -m "$(cat <<'EOF'
fix: 24px popup targets, undo dismiss, start focus from the popup

Dismiss is reversible for four seconds. Paying users start a session
without opening Settings. Sessions still cannot be ended early.
EOF
)"
```

---

### Task 8: Commands, uninstall URL, CI, version 0.3.0

World-class extensions are keyboard-native. Uninstall currently vanishes with no goodbye. Tests are local-only.

**Files:**
- Modify: `manifest.json`
- Modify: `background/service-worker.js`
- Create: `site/uninstall.html`
- Create: `.github/workflows/test.yml`
- Modify: `options/options.html` (discoverability: list the two shortcuts)
- Modify: `package.json` only if needed (it is not)
- Modify: `TODO.md` — tick the product items this plan covered; leave distribution items

**Interfaces:**
- Consumes: `queueAfterAdd`, `titleFor`, `queueCurrentPlan` from Task 1
- Produces: commands `queue-current` and `_execute_action`. No `start-session` command — that would surprise a free user with a silent no-op. Session stays a popup/options control.
- Produces: `chrome.runtime.setUninstallURL` pointing at the existing Workers site `/uninstall`

- [ ] **Step 1: Manifest commands**

In `manifest.json` add:

```json
  "commands": {
    "_execute_action": {
      "suggested_key": { "default": "Alt+Shift+D" },
      "description": "Open DeepWork Tab"
    },
    "queue-current": {
      "suggested_key": { "default": "Alt+Shift+Q" },
      "description": "Queue the current tab"
    }
  }
```

Bump `"version"` from `0.2.0` to `0.3.0`.

- [ ] **Step 2: Service worker command + uninstall URL**

At top of `background/service-worker.js`:

```js
import { queueAfterAdd, titleFor, queueCurrentPlan } from '../lib/queue.js';
```

```js
const INTERCEPT = chrome.runtime.getURL('intercept/intercept.html');

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  chrome.runtime.setUninstallURL('https://deepwork-tab.kumarbharath63.workers.dev/uninstall');
  chrome.action.setBadgeText({ text: '' });
  // ... existing install init
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'queue-current') return;
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.id) return;
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  const plan = queueCurrentPlan({
    tabCount: tabs.length,
    url: tab.url || tab.pendingUrl || '',
    interceptBase: INTERCEPT
  });
  if (plan.action === 'noop') return;
  const url = tab.url || tab.pendingUrl;
  const { queue = [] } = await chrome.storage.local.get('queue');
  await chrome.storage.local.set({
    queue: queueAfterAdd(queue, { url, title: titleFor(url, tab.title), ts: Date.now() })
  });
  if (plan.action === 'enqueue-close') {
    try { await chrome.tabs.remove(tab.id); } catch {}
  }
});
```

Call `setUninstallURL` on every `onInstalled` (install and update), not only `reason === 'install'`.

- [ ] **Step 3: Uninstall page**

Create `site/uninstall.html`. Reuse `tokens.css` + `style.css`. Copy the shell from `privacy.html` (headerless legal article + footer). Body copy, no form, no email, no "come back" coupon:

```html
      <h1>DeepWork Tab is off this computer.</h1>
      <p>The queue, the reasons, and the streak lived only in Chrome's local storage. Uninstalling deleted them. Nothing was waiting on a server.</p>
      <p>If the cap felt wrong, that was the whole mechanism. There is no account to close.</p>
```

Title: `Uninstalled — DeepWork Tab`. No CTA to reinstall (that is marketing). One text link to `index.html` in the footer, same as privacy.

- [ ] **Step 4: Discoverability in options**

In `options/options.html`, after the pin hint:

```html
      <p class="muted shortcuts-note">Alt+Shift+D opens the popup. Alt+Shift+Q queues the current tab (and closes it if you have more than one).</p>
```

- [ ] **Step 5: CI**

Create `.github/workflows/test.yml`:

```yaml
name: test
on:
  push:
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: node --test
```

No `npm install`. Node 22 ships `node --test`.

- [ ] **Step 6: Run the full suite**

Run: `node --test`

Expected: PASS (queue, focus, entitlement, ramp, receipt, session, snooze, subscribe).

- [ ] **Step 7: Update TODO.md product lines**

Do not tick distribution items. Add a short "Product polish (0.3.0)" section listing Tasks 1–8 as done checkboxes only after implementation. While planning, leave TODO.md untouched until this task runs.

When implementing, append:

```md
## Product polish (0.3.0)

- [x] Restore-as-swap
- [x] No page-HTML fetch; ping-only host permission
- [x] YouTube optional, Pro-only
- [x] No toolbar badge
- [x] Intercept focus trap, Your-Words recall, 1–9
- [x] Gate trap, pin hint, license extract
- [x] Popup undo, 24px targets, session start
- [x] Alt+Shift+D / Alt+Shift+Q, uninstall page, CI
```

- [ ] **Step 8: Manual check**

`chrome://extensions/shortcuts` shows both commands. Alt+Shift+Q on a normal tab queues and closes it when count > 1. On the last tab, queues and leaves it open. On `chrome://extensions`, no-op. `setUninstallURL` is visible in the worker (inspect → run `chrome.runtime.getManifest()` and confirm commands; uninstall URL is not readable from JS after set — verify by temporarily uninstalling on a throwaway profile, or skip live uninstall and read the `setUninstallURL` call in source).

- [ ] **Step 9: Commit**

```bash
git add manifest.json background/service-worker.js site/uninstall.html options/options.html .github/workflows/test.yml TODO.md
git commit -m "$(cat <<'EOF'
feat: queue-current shortcut, uninstall page, CI, v0.3.0

Keyboard queue uses the same swap-safe enqueue as the intercept.
Uninstall is a quiet goodbye with no capture. Tests run on every push.
EOF
)"
```

---

## Self-review

**Spec coverage**

| Review item | Task |
|---|---|
| Restore at cap must not intercept | 1 |
| fetchTitle / all-site hosts / privacy lie | 2 |
| YouTube inject for free users | 3 |
| Badge vs FAQ | 4 |
| Listing "in review" lie | 4 |
| Incognito surprise | 4 |
| Your-Words last-reason | 5 |
| Intercept focus trap, intent autofocus, 1–9, 100dvh | 5 |
| Gate trap, pin, still-over, license paste, reduced-transparency | 6 |
| 24px targets, undo, session in popup | 7 |
| chrome.commands, uninstall URL, CI | 8 |
| Require intent before Queue | **Dropped.** Autofocus is the chosen ceiling; requiring text would punish the pause. Named in Task 5. |
| 14-day review ask | **Out of scope** (marketing) |
| Lemon Squeezy / domain / listing / screenshots | **Out of scope** (distribution) |

**Placeholder scan:** no TBD, no "add validation", no "similar to Task N" without code. Task 6 originally had a broken trap snippet; the plan replaces it with a complete listener.

**Type consistency:** `restoreAction` returns `{ action }`. `queueCurrentPlan` returns `{ action }`. `queueAfterAdd` returns a new array or the same reference on duplicate. `wrapFocus(nodes, active, shift)`. `extractLicenseKey(raw)`. `sessionPrefs: { cap, mins }`. `YOUTUBE_ORIGIN = '*://www.youtube.com/*'`.

**Ping origin:** Task 2 keeps `https://deepwork-tab-ping.kumarbharath63.workers.dev/*` so the daily heartbeat still works after all-site hosts die. Do not "clean up" that last host permission.
