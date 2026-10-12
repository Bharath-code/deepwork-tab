import { nextWake } from '../lib/snooze.js';
import { effectiveCap, sessionState } from '../lib/session.js';
import { RULE_DEFAULTS, countedTabs, isExemptUrl, inWorkHours } from '../lib/rules.js';
import { queueAfterAdd, titleFor, queueCurrentPlan } from '../lib/queue.js';
import { loosened, easeCap } from '../lib/habit.js';
import { dayOf, oneThingDue, nextShutdownAt, shutdownDue } from '../lib/ritual.js';

const DEFAULTS = { cap: 7, enabled: true, reason: '', onboarded: true };
const INTERCEPT = chrome.runtime.getURL('intercept/intercept.html');
const ONE_THING = chrome.runtime.getURL('ritual/onething.html');
const SHUTDOWN = chrome.runtime.getURL('ritual/shutdown.html');
const PING_URL = 'https://deepwork-tab-ping.kumarbharath63.workers.dev';
const WEEK_MS = 7 * 86400000;
const LOG_MAX = 400;
const YT = {
  id: 'youtube',
  matches: ['*://www.youtube.com/*'],
  css: ['content/youtube.css'],
  js: ['content/youtube.js'],
  runAt: 'document_start'
};

async function cfg() {
  return chrome.storage.local.get(DEFAULTS);
}

async function activeCap() {
  const [{ cap }, { session = null }] = await Promise.all([
    cfg(),
    chrome.storage.local.get('session')
  ]);
  return effectiveCap(cap, session);
}

const todayStr = () => new Date().toLocaleDateString('sv');

async function ensureStreak() {
  const { streak } = await chrome.storage.local.get('streak');
  if (!streak) await chrome.storage.local.set({ streak: { startDay: todayStr(), longest: 0 } });
}

// Registered at runtime, not in the manifest: a static content_scripts entry
// makes Chrome warn about youtube.com at install, even for free users.
async function syncYoutube() {
  const granted = await chrome.permissions.contains({ origins: YT.matches });
  const registered = (await chrome.scripting.getRegisteredContentScripts({ ids: [YT.id] })).length > 0;
  if (granted && !registered) await chrome.scripting.registerContentScripts([YT]);
  if (!granted && registered) await chrome.scripting.unregisterContentScripts({ ids: [YT.id] });
}

chrome.permissions.onAdded.addListener(syncYoutube);
chrome.permissions.onRemoved.addListener(syncYoutube);

async function applyEase() {
  const { ease = null, cap } = await chrome.storage.local.get(['ease', 'cap']);
  if (!ease) return;
  const next = easeCap(ease);
  if (next !== cap) await chrome.storage.local.set({ cap: next });
  if (next <= ease.to) await chrome.storage.local.remove('ease');
}

async function rescheduleSnooze() {
  const { queue = [] } = await chrome.storage.local.get('queue');
  const when = nextWake(queue);
  if (when == null) {
    await chrome.alarms.clear('snooze');
    return;
  }
  chrome.alarms.create('snooze', { when });
}

async function tabCount(rules) {
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  return countedTabs(tabs, rules).length;
}

/** Append a weekly-receipt event; prune to last 7 days / LOG_MAX. */
let logChain = Promise.resolve();
function logEvent(type, domain = '', value = '') {
  // ponytail: serialize read-modify-write so back-to-back calls (e.g.
  // intercept immediately followed by queue) don't clobber each other.
  logChain = logChain.then(async () => {
    const { weekLog = [] } = await chrome.storage.local.get('weekLog');
    const cutoff = Date.now() - WEEK_MS;
    weekLog.push({ type, ts: Date.now(), domain: domain || undefined, value: value || undefined });
    const kept = weekLog.filter((e) => e.ts >= cutoff).slice(-LOG_MAX);
    await chrome.storage.local.set({ weekLog: kept });
  });
  return logChain;
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  chrome.runtime.setUninstallURL('https://deepwork-tab.kumarbharath63.workers.dev/uninstall');
  chrome.action.setBadgeText({ text: '' });
  if (reason === 'install') {
    await chrome.storage.local.set({
      installId: crypto.randomUUID(),
      installedAt: Date.now(),
      queue: [],
      intents: [],
      weekLog: [],
      onboarded: false
    });
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome/welcome.html') });
  }
  chrome.alarms.create('ping', { periodInMinutes: 360 });
  ensureStreak();
  syncYoutube();
  scheduleShutdown();
  applyEase();
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
  const next = queueAfterAdd(queue, { url, title: titleFor(url, tab.title), ts: Date.now() });
  await chrome.storage.local.set({ queue: next });
  if (next !== queue) {
    let domain = '';
    try {
      domain = new URL(url).hostname.replace(/^www\./, '');
    } catch {}
    logEvent('queue', domain);
  }
  if (plan.action === 'enqueue-close') {
    try { await chrome.tabs.remove(tab.id); } catch {}
  }
});

chrome.runtime.onStartup.addListener(() => {
  ensureStreak();
  syncYoutube();
  scheduleShutdown();
  shutdownTick();
  applyEase();
  chrome.action.setBadgeText({ text: '' });
});

async function interceptUrl(target) {
  const [cap, rules, { session = null }] = await Promise.all([
    activeCap(),
    chrome.storage.local.get(RULE_DEFAULTS),
    chrome.storage.local.get('session')
  ]);
  // An explicit focus session enforces even outside work hours.
  if (!sessionState(session).active && !inWorkHours(rules.schedule)) return null;
  if (target.startsWith(chrome.runtime.getURL('')) || isExemptUrl(target, rules.exemptDomains)) return null;
  const count = await tabCount(rules);
  const { restoringUrl } = await chrome.storage.local.get('restoringUrl');
  if (restoringUrl) {
    await chrome.storage.local.remove('restoringUrl');
    if (target === restoringUrl) return null;
  }
  return count <= cap ? null : `${INTERCEPT}?target=${encodeURIComponent(target)}`;
}

let ritualChain = Promise.resolve();
function claim(key, due) {
  // ponytail: serialize check-and-mark so a restored window opening many tabs asks once.
  const run = ritualChain.then(async () => {
    const s = await chrome.storage.local.get({ rituals: {}, ritual: {}, ...RULE_DEFAULTS });
    if (!due({ rituals: s.rituals, ritual: s.ritual, schedule: s.schedule })) return false;
    await chrome.storage.local.set({ ritual: { ...s.ritual, [key]: dayOf() } });
    return true;
  });
  ritualChain = run.catch(() => {});
  return run;
}

async function scheduleShutdown() {
  const { rituals = {}, schedule = RULE_DEFAULTS.schedule } = await chrome.storage.local.get(['rituals', 'schedule']);
  const when = rituals.shutdown ? nextShutdownAt(schedule) : null;
  if (when == null) await chrome.alarms.clear('shutdown');
  else chrome.alarms.create('shutdown', { when });
}

async function shutdownTick() {
  const { onboarded } = await cfg();
  if (onboarded === false) return;
  const focused = (await chrome.windows.getAll()).some((w) => w.focused && w.type === 'normal');
  if (!focused) return;
  if (await claim('shutdownShown', shutdownDue)) chrome.tabs.create({ url: SHUTDOWN });
}

chrome.tabs.onCreated.addListener(async (tab) => {
  const { enabled, onboarded } = await cfg();
  if (!enabled || onboarded === false) return;
  const target = tab.pendingUrl || tab.url || '';
  if (target.startsWith(chrome.runtime.getURL(''))) return;
  try {
    if (await claim('oneThingAsked', oneThingDue)) {
      await chrome.tabs.update(tab.id, { url: `${ONE_THING}?target=${encodeURIComponent(target)}` });
      return;
    }
    const url = await interceptUrl(target);
    if (url) await chrome.tabs.update(tab.id, { url });
  } catch {}
});

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.type === 'logEvent') logEvent(msg.eventType, msg.domain, msg.value);
  if (msg.type === 'afterRitual') {
    const web = /^https?:\/\//i.test(msg.target || '');
    const fallback = web ? msg.target : 'chrome://newtab/';
    (web ? interceptUrl(msg.target) : Promise.resolve(null))
      .then((url) => reply({ url: url || fallback }))
      .catch(() => reply({ url: fallback }));
    return true;
  }
});

chrome.windows.onFocusChanged.addListener((id) => {
  if (id !== chrome.windows.WINDOW_ID_NONE) shutdownTick();
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'local') return;
  if (changes.queue) rescheduleSnooze();
  if (changes.rituals || changes.schedule) scheduleShutdown();
  const capRaised = changes.cap && changes.cap.oldValue != null && changes.cap.newValue > changes.cap.oldValue;
  const disabled = changes.enabled && changes.enabled.oldValue === true && changes.enabled.newValue === false;
  if (capRaised || disabled) {
    const { streak = null } = await chrome.storage.local.get('streak');
    await chrome.storage.local.set({ streak: loosened(streak) });
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'snooze') {
    await rescheduleSnooze();
    return;
  }
  if (alarm.name === 'shutdown' || alarm.name === 'shutdown-later') {
    await shutdownTick();
    await scheduleShutdown();
    return;
  }
  if (alarm.name === 'ping') applyEase();
  if (alarm.name !== 'ping' || !PING_URL) return;
  const { installId, lastPing } = await chrome.storage.local.get(['installId', 'lastPing']);
  const day = new Date().toISOString().slice(0, 10);
  if (lastPing === day) return;
  try {
    await fetch(PING_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ id: installId, day })
    });
    await chrome.storage.local.set({ lastPing: day });
  } catch {}
});
