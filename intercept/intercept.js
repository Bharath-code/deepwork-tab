import { sessionState, effectiveCap, formatRemaining } from '../lib/session.js';
import { interceptsFor, rampDelayMs } from '../lib/ramp.js';
import { isPro } from '../lib/entitlement.js';
import { queueAfterAdd, titleFor } from '../lib/queue.js';
import { wrapFocus } from '../lib/focus.js';
import { RULE_DEFAULTS, countedTabs } from '../lib/rules.js';
import { lensSvg } from '../shared/lens.js';

const params = new URLSearchParams(location.search);
const target = params.get('target') || '';
const hasTarget = /^https?:\/\//i.test(target);

/** Calm lines only — never guilt, never urgency. Rotate to avoid banner blindness. */
const HEADLINES = [
  "You're at your limit.",
  'One more tab won’t help.',
  'Pause. What were you doing?',
  'This is the moment that matters.',
  'Is this the thing?',
  'Hold that thought.'
];

const $ = (id) => document.getElementById(id);
let acting = false;
let listShown = false;
let queueArmed = true;
// Resolves once the ramp has decided whether to hold the button. Keyboard paths
// wait on it so a fast q/Enter cannot outrun the decision.
let rampPending = Promise.resolve();
let skipAnim = null;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function announce(msg) {
  $('status').textContent = msg;
}

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function localDay(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function pickHeadline() {
  const d = new Date();
  const dayIndex = Math.floor((d - d.getTimezoneOffset() * 60000) / 86400000);
  return HEADLINES[dayIndex % HEADLINES.length];
}

function dayPhase(h = new Date().getHours()) {
  return h >= 5 && h < 10 ? 'dawn' : h >= 10 && h < 16 ? 'day' : h >= 16 && h < 20 ? 'dusk' : 'night';
}

function shortUrl(url) {
  return url.replace(/^https?:\/\/(www\.)?/i, '');
}

let liveCapShown = 0;
let sessionLine = '';

function renderMeta(open) {
  $('lens').innerHTML = lensSvg(open, liveCapShown);
  const tail = sessionLine || (open > liveCapShown ? `${open - liveCapShown} over` : 'new tabs wait here');
  $('meta').textContent = `${open} of ${liveCapShown} open · ${tail}`;
}

async function logEvent(eventType, domain = '') {
  chrome.runtime.sendMessage({ type: 'logEvent', eventType, domain }).catch(() => {});
}

let me = null;
let session = null;

async function init() {
  document.documentElement.dataset.phase = dayPhase();
  $('headline').textContent = pickHeadline();

  const [{ cap, reason, enabled, oneThing }, { session: storedSession = null }] = await Promise.all([
    chrome.storage.local.get({ cap: 7, reason: '', enabled: true, oneThing: null }),
    chrome.storage.local.get('session')
  ]);
  session = storedSession;
  const { active, remainingMs } = sessionState(session);
  const liveCap = effectiveCap(cap, session);
  me = await chrome.tabs.getCurrent();
  const allTabs = await countableTabs();
  // No target: this tab only exists to run the intercept flow itself
  // (e.g. first-run), so it shouldn't count against the user's own cap.
  const tabs = hasTarget ? allTabs : allTabs.filter((t) => t.id !== me.id);
  liveCapShown = liveCap;
  if (active) sessionLine = `focus session · ${formatRemaining(remainingMs)} left`;
  renderMeta(hasTarget ? tabs.length - 1 : tabs.length);
  if (oneThing?.text && oneThing.day === localDay()) {
    $('oneThingText').textContent = oneThing.text;
    $('oneThing').hidden = false;
  } else if (reason) {
    $('reason').textContent = reason;
    $('reason').hidden = false;
  }
  if (hasTarget) {
    $('targetUrl').textContent = shortUrl(target);
    $('targetUrl').title = target;
    $('favicon').textContent = domainOf(target).charAt(0);
    $('targetX').hidden = false;
  } else {
    $('queueBtn').hidden = true;
    $('closeBtn').classList.add('primary');
    $('whereto').textContent = 'Close one tab and you’re through. Its address is saved to your shelf.';
    $('whereto').hidden = false;
  }
  if (!enabled || tabs.length <= liveCap) {
    passThrough();
    return;
  }
  // Snapshot the log before logging this visit: logEvent hands off to the service
  // worker, so reading after it is a race on how fast the worker wakes.
  const { weekLog = [] } = await chrome.storage.local.get('weekLog');
  logEvent('intercept', hasTarget ? domainOf(target) : '');
  showFirstRunNoteOnce();
  if (hasTarget) showLastReason();
  rampPending = armRamp(weekLog);
  if (hasTarget) $('intent').focus();
}

async function armRamp(weekLog) {
  if (!hasTarget || !(await isPro())) return;
  const count = interceptsFor(weekLog, domainOf(target));
  const wait = rampDelayMs(count);
  if (wait === 0) return;
  queueArmed = false;
  const btn = $('queueBtn');
  btn.disabled = true;
  $('actions').classList.add('held');
  $('ramp').hidden = false;
  const deadline = Date.now() + wait;
  const bar = $('rampBar').animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: wait, fill: 'forwards' });
  announce(`You have been here ${count + 1} times today. The shelve button unlocks in ${Math.ceil(wait / 1000)} seconds.`);
  const finish = () => {
    if (queueArmed) return;
    clearInterval(tick);
    document.removeEventListener('visibilitychange', onVisible);
    bar.cancel();
    $('ramp').hidden = true;
    $('actions').classList.remove('held');
    btn.disabled = false;
    queueArmed = true;
    announce('Shelve button ready');
  };
  const onVisible = () => {
    if (Date.now() >= deadline) finish();
  };
  const tick = setInterval(onVisible, 250);
  document.addEventListener('visibilitychange', onVisible);
}

async function showLastReason() {
  const { reasonsByDomain = {} } = await chrome.storage.local.get('reasonsByDomain');
  const text = reasonsByDomain[domainOf(target)];
  if (!text) return;
  $('lastReasonText').textContent = `“${text}”`;
  $('lastReason').hidden = false;
}

async function rememberReason(text) {
  const domain = domainOf(target);
  if (!domain) return;
  const { reasonsByDomain = {} } = await chrome.storage.local.get('reasonsByDomain');
  delete reasonsByDomain[domain];
  reasonsByDomain[domain] = text;
  const keys = Object.keys(reasonsByDomain);
  if (keys.length > 50) delete reasonsByDomain[keys[0]];
  await chrome.storage.local.set({ reasonsByDomain });
}

let firstIntercept = false;

async function showFirstRunNoteOnce() {
  const { seenIntercept } = await chrome.storage.local.get('seenIntercept');
  if (seenIntercept || !hasTarget) return;
  firstIntercept = true;
  $('firstRunNote').hidden = false;
  await chrome.storage.local.set({ seenIntercept: true });
}

async function logIntent() {
  const text = $('intent').value.trim();
  if (!text) return;
  const { intents = [] } = await chrome.storage.local.get('intents');
  intents.push({ text, url: target, ts: Date.now() });
  await chrome.storage.local.set({ intents: intents.slice(-500) });
  if (hasTarget) await rememberReason(text);
  $('intent').value = '';
}

async function enqueue(url, title = url) {
  const { queue = [] } = await chrome.storage.local.get('queue');
  const next = queueAfterAdd(queue, { url, title: titleFor(url, title), ts: Date.now() });
  if (next === queue) return;
  await chrome.storage.local.set({ queue: next });
  logEvent('queue', domainOf(url));
}

async function closeSelf() {
  chrome.tabs.remove(me.id);
}

function passThrough() {
  if (hasTarget) {
    location.href = target;
  } else {
    closeSelf();
  }
}

function waitOrSkip(ms) {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    skipAnim = () => {
      clearTimeout(t);
      resolve();
    };
  });
}

async function fileAway(line, sub) {
  const x = $('targetX');
  const chip = $('targetRow');
  const k = firstIntercept ? 1.4 : 1;
  $('choose').hidden = true;
  $('lastReason').hidden = true;
  const showSaved = () => {
    $('saved').textContent = `${line} `;
    const muted = document.createElement('span');
    muted.className = 'muted';
    muted.textContent = sub;
    $('saved').append(muted);
    $('saved').hidden = false;
  };
  if (reducedMotion) {
    chip.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
    showSaved();
    return waitOrSkip(900);
  }
  const before = chip.getBoundingClientRect().width;
  $('targetUrl').textContent = domainOf(target);
  chip.classList.add('pill');
  chip.animate([{ width: `${before}px` }, { width: '160px' }], { duration: 120 * k, easing: 'cubic-bezier(.16,1,.3,1)' });
  const r = chip.getBoundingClientRect();
  const dx = innerWidth - 40 - (r.left + r.width / 2);
  const dy = -8 - (r.top + r.height / 2);
  const travel = { duration: 480 * k, delay: 120 * k, fill: 'forwards' };
  x.animate([{ transform: 'none' }, { transform: `translateX(${dx}px)` }], { ...travel, easing: 'cubic-bezier(.5,0,.9,.5)' });
  chip.animate([
    { transform: 'none', opacity: 1 },
    { transform: `translateY(${dy * 0.7}px) scale(.6)`, opacity: 1, offset: 0.7 },
    { transform: `translateY(${dy}px) scale(.35)`, opacity: 0 }
  ], { ...travel, easing: 'cubic-bezier(.1,.5,.5,1)' });
  await waitOrSkip(560 * k);
  showSaved();
  return waitOrSkip(140 * k);
}

function confirmThen(btn, label, fn) {
  btn.textContent = label;
  btn.classList.add('done');
  setTimeout(fn, 700);
}

async function queueIt() {
  if (acting || !hasTarget) return;
  await rampPending;
  if (acting || !queueArmed) return;
  acting = true;
  await logIntent();
  await enqueue(target);
  announce('Saved to your shelf');
  await fileAway('Saved to your shelf ↗', '· taking you back to your work');
  closeSelf();
}

async function goBack() {
  if (acting) return;
  acting = true;
  await logIntent();
  if (hasTarget) {
    await enqueue(target);
    announce('Saved to your shelf, just in case');
    await fileAway('Saved, just in case ↗', '· it’s on your shelf');
    closeSelf();
  } else {
    closeSelf();
  }
}

function hideTabs() {
  $('tablist').hidden = true;
  $('closeBtn').hidden = false;
  listShown = false;
  $('actions').classList.remove('receded');
  $('closeBtn').focus();
}

async function showTabs() {
  if (acting || listShown) return;
  listShown = true;
  await logIntent();
  const tabs = await countableTabs();
  const candidates = sortForClosing(tabs.filter((t) => t.id !== me.id));
  const list = $('tabs');
  list.replaceChildren();
  for (const [i, t] of candidates.entries()) {
    const li = document.createElement('li');
    li.style.setProperty('--i', Math.min(i, 5));
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', `Close ${t.title || t.url}`);
    if (i < 9) {
      const key = document.createElement('kbd');
      key.textContent = i + 1;
      btn.appendChild(key);
    }
    if (t.favIconUrl && t.favIconUrl.startsWith('http')) {
      const img = document.createElement('img');
      img.src = t.favIconUrl;
      img.alt = '';
      btn.appendChild(img);
    }
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = t.title || t.url;
    title.title = t.url;
    btn.appendChild(title);
    const host = document.createElement('span');
    host.className = 'host num';
    host.textContent = domainOf(t.url);
    btn.appendChild(host);
    btn.addEventListener('click', async () => {
      if (acting) return;
      acting = true;
      btn.disabled = true;
      try {
        const saved = /^https?:\/\//i.test(t.url);
        if (saved) await enqueue(t.url, t.title || t.url);
        await chrome.tabs.remove(t.id);
        announce(saved ? 'Closed. Its address is on your shelf' : 'Closed');
        // With a pending target: one close frees a slot → go through.
        // First-run / no-target: keep listing until under cap.
        if (hasTarget) {
          confirmThen(btn, 'Closed ✓', passThrough);
        } else {
          confirmThen(btn, 'Closed ✓', async () => {
            const { cap } = await chrome.storage.local.get({ cap: 7 });
            const liveCap = effectiveCap(cap, session);
            const allLeft = await countableTabs();
            const left = allLeft.filter((lt) => lt.id !== me.id);
            if (left.length <= liveCap) {
              passThrough();
              return;
            }
            acting = false;
            listShown = false;
            renderMeta(left.length);
            announce(`${left.length - liveCap} more to close or shelve`);
            showTabs();
          });
        }
      } catch {
        acting = false;
        li.remove();
        announce('That tab was already closed — pick another');
      }
    });
    li.appendChild(btn);
    list.appendChild(li);
  }
  $('tablist').hidden = false;
  $('closeBtn').hidden = true;
  $('actions').classList.add('receded');
  announce(`${candidates.length} open tabs listed — pick one to close`);
  list.querySelector('button')?.focus();
}

async function countableTabs() {
  const [tabs, rules] = await Promise.all([
    chrome.tabs.query({ windowType: 'normal' }),
    chrome.storage.local.get(RULE_DEFAULTS)
  ]);
  return countedTabs(tabs, rules);
}

function sortForClosing(tabs) {
  return tabs.sort((a, b) => (a.lastAccessed || 0) - (b.lastAccessed || 0));
}

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

$('queueBtn').addEventListener('click', queueIt);
$('backBtn').addEventListener('click', goBack);
$('closeBtn').addEventListener('click', showTabs);

document.addEventListener('keydown', (e) => {
  trapTab(document.querySelector('main'), e);
});

document.addEventListener('keydown', (e) => {
  if (skipAnim) {
    skipAnim();
    return;
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const typing = e.target === $('intent');
  if (e.key === 'Escape') {
    if (typing) {
      $('intent').blur();
    } else if (listShown) {
      hideTabs();
    } else {
      goBack();
    }
    return;
  }
  if (typing) {
    if (e.key === 'Enter' && hasTarget) queueIt();
    return;
  }
  if (e.key === 'Enter') {
    if (hasTarget && e.target.tagName !== 'BUTTON') queueIt();
    return;
  }
  if (listShown && e.key >= '1' && e.key <= '9') {
    const n = e.key.charCodeAt(0) - 49; // '1' -> 0
    const btn = $('tabs').querySelectorAll('button')[n];
    btn?.click();
  }
  const k = e.key.toLowerCase();
  if (k === 'q' && hasTarget) queueIt();
  if (k === 'c') showTabs();
});

init();
