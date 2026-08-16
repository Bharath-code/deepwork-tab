import { sessionState, effectiveCap, formatRemaining } from '../lib/session.js';
import { interceptsFor, rampDelayMs } from '../lib/ramp.js';
import { isPro } from '../lib/entitlement.js';
import { queueAfterAdd, titleFor } from '../lib/queue.js';
import { wrapFocus } from '../lib/focus.js';

const params = new URLSearchParams(location.search);
const target = params.get('target') || '';
const hasTarget = /^https?:\/\//i.test(target);

/** Calm lines only — never guilt, never urgency. Rotate to avoid banner blindness. */
const HEADLINES = [
  "You're at your limit.",
  'One more tab won’t help.',
  'Pause. What were you doing?',
  'This is the moment that matters.'
];

const $ = (id) => document.getElementById(id);
let acting = false;
let listShown = false;
let queueArmed = true;
// Resolves once the ramp has decided whether to hold the button. Keyboard paths
// wait on it so a fast q/Enter cannot outrun the decision.
let rampPending = Promise.resolve();

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

function pickHeadline() {
  // ponytail: hourly rotation, no storage — persist an index if repeats within an hour ever matter
  return HEADLINES[Math.floor(Date.now() / 3600000) % HEADLINES.length];
}

async function logEvent(eventType, domain = '') {
  chrome.runtime.sendMessage({ type: 'logEvent', eventType, domain }).catch(() => {});
}

let me = null;
let session = null;

async function init() {
  $('headline').textContent = pickHeadline();

  const [{ cap, reason, enabled }, { session: storedSession = null }] = await Promise.all([
    chrome.storage.local.get({ cap: 7, reason: '', enabled: true }),
    chrome.storage.local.get('session')
  ]);
  session = storedSession;
  const { active, remainingMs } = sessionState(session);
  const liveCap = effectiveCap(cap, session);
  me = await chrome.tabs.getCurrent();
  const allTabs = await chrome.tabs.query({ windowType: 'normal' });
  // No target: this tab only exists to run the intercept flow itself
  // (e.g. first-run), so it shouldn't count against the user's own cap.
  const tabs = hasTarget ? allTabs : allTabs.filter((t) => t.id !== me.id);
  $('count').textContent = tabs.length;
  $('cap').textContent = liveCap;
  if (reason) {
    $('reason').textContent = `"${reason}"`;
    $('reason').hidden = false;
  }
  if (hasTarget) {
    $('targetUrl').textContent = target;
    $('targetRow').hidden = false;
  } else {
    $('queueBtn').hidden = true;
    $('closeBtn').classList.add('primary');
    $('whereto').textContent =
      'Close one tab and you’re through — its address is saved to your queue.';
  }
  if (active) {
    $('sessionNote').textContent = `Focus session — cap ${liveCap} for another ${formatRemaining(remainingMs)}.`;
    $('sessionNote').hidden = false;
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
  const countdown = document.createElement('span');
  countdown.className = 'ramp-countdown';
  btn.insertBefore(countdown, btn.querySelector('.keys'));
  btn.disabled = true;
  const deadline = Date.now() + wait;
  const render = () => {
    const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    countdown.textContent = left > 0 ? ` (${left})` : '';
    return left;
  };
  const initialLeft = render();
  announce(`You have been here ${count + 1} times today. The queue button unlocks in ${initialLeft} seconds.`);
  const finish = () => {
    if (queueArmed) return;
    clearInterval(tick);
    document.removeEventListener('visibilitychange', onVisible);
    countdown.remove();
    btn.disabled = false;
    queueArmed = true;
    announce('Queue button ready');
  };
  const onVisible = () => {
    if (render() <= 0) finish();
  };
  const tick = setInterval(() => {
    if (render() <= 0) finish();
  }, 250);
  document.addEventListener('visibilitychange', onVisible);
}

async function showLastReason() {
  const { reasonsByDomain = {} } = await chrome.storage.local.get('reasonsByDomain');
  const text = reasonsByDomain[domainOf(target)];
  if (!text) return;
  $('lastReason').textContent = text;
  $('lastReason').setAttribute('aria-label', `Last time you wrote: ${text}`);
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

async function showFirstRunNoteOnce() {
  const { seenIntercept } = await chrome.storage.local.get('seenIntercept');
  if (seenIntercept) return;
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
  announce('Queued — saved to your queue');
  confirmThen($('queueBtn'), 'Queued ✓', closeSelf);
}

async function goBack() {
  if (acting) return;
  acting = true;
  await logIntent();
  if (hasTarget) {
    await enqueue(target);
    announce('Saved to your queue, just in case');
    confirmThen($('backBtn'), 'Saved it, just in case ✓', closeSelf);
  } else {
    closeSelf();
  }
}

function hideTabs() {
  $('tablist').hidden = true;
  $('closeBtn').hidden = false;
  listShown = false;
  document.querySelector('.actions').classList.remove('receded');
  $('closeBtn').focus();
}

async function showTabs() {
  if (acting || listShown) return;
  listShown = true;
  await logIntent();
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  const candidates = sortForClosing(tabs.filter((t) => t.id !== me.id));
  const list = $('tabs');
  list.replaceChildren();
  for (const t of candidates) {
    const li = document.createElement('li');
    if (t.favIconUrl && t.favIconUrl.startsWith('http')) {
      const img = document.createElement('img');
      img.src = t.favIconUrl;
      img.alt = '';
      li.appendChild(img);
    }
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = t.title || t.url;
    title.title = t.url;
    li.appendChild(title);
    const btn = document.createElement('button');
    btn.textContent = 'Close';
    btn.setAttribute('aria-label', `Close ${t.title || t.url}`);
    btn.addEventListener('click', async () => {
      if (acting) return;
      acting = true;
      btn.disabled = true;
      try {
        const saved = /^https?:\/\//i.test(t.url);
        if (saved) await enqueue(t.url, t.title || t.url);
        await chrome.tabs.remove(t.id);
        announce(saved ? 'Closed — its address is in your queue' : 'Closed');
        // With a pending target: one close frees a slot → go through.
        // First-run / no-target: keep listing until under cap.
        if (hasTarget) {
          confirmThen(btn, 'Closed ✓', passThrough);
        } else {
          confirmThen(btn, 'Closed ✓', async () => {
            const { cap } = await chrome.storage.local.get({ cap: 7 });
            const liveCap = effectiveCap(cap, session);
            const allLeft = await chrome.tabs.query({ windowType: 'normal' });
            const left = allLeft.filter((lt) => lt.id !== me.id);
            if (left.length <= liveCap) {
              passThrough();
              return;
            }
            acting = false;
            listShown = false;
            $('count').textContent = left.length;
            announce(`${left.length - liveCap} more to close or queue`);
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
  document.querySelector('.actions').classList.add('receded');
  announce(`${candidates.length} open tabs listed — pick one to close`);
  list.querySelector('button')?.focus();
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
