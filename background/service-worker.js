import { nextWake } from '../lib/snooze.js';
import { effectiveCap, sessionState } from '../lib/session.js';
import { RULE_DEFAULTS, countedTabs, isExemptUrl, inWorkHours } from '../lib/rules.js';
import { queueAfterAdd, titleFor, queueCurrentPlan } from '../lib/queue.js';

const DEFAULTS = { cap: 7, enabled: true, reason: '' };
const INTERCEPT = chrome.runtime.getURL('intercept/intercept.html');
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
const streakLen = (s) => Math.floor((Date.parse(todayStr()) - Date.parse(s.startDay)) / 86400000) + 1;

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
function logEvent(type, domain = '') {
  // ponytail: serialize read-modify-write so back-to-back calls (e.g.
  // intercept immediately followed by queue) don't clobber each other.
  logChain = logChain.then(async () => {
    const { weekLog = [] } = await chrome.storage.local.get('weekLog');
    const cutoff = Date.now() - WEEK_MS;
    weekLog.push({ type, ts: Date.now(), domain: domain || undefined });
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
    chrome.runtime.openOptionsPage();
  }
  chrome.alarms.create('ping', { periodInMinutes: 360 });
  ensureStreak();
  syncYoutube();
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
  chrome.action.setBadgeText({ text: '' });
});

chrome.tabs.onCreated.addListener(async (tab) => {
  const { enabled } = await cfg();
  if (!enabled) return;
  const [cap, rules, { session = null }] = await Promise.all([
    activeCap(),
    chrome.storage.local.get(RULE_DEFAULTS),
    chrome.storage.local.get('session')
  ]);
  // An explicit focus session enforces even outside work hours.
  if (!sessionState(session).active && !inWorkHours(rules.schedule)) return;
  const target = tab.pendingUrl || tab.url || '';
  if (target.startsWith(INTERCEPT) || isExemptUrl(target, rules.exemptDomains)) return;
  const count = await tabCount(rules);
  const { restoringUrl } = await chrome.storage.local.get('restoringUrl');
  if (restoringUrl) {
    await chrome.storage.local.remove('restoringUrl');
    if (target === restoringUrl) return;
  }
  if (count <= cap) return;
  const url = `${INTERCEPT}?target=${encodeURIComponent(target)}`;
  try {
    await chrome.tabs.update(tab.id, { url });
  } catch {}
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'logEvent') logEvent(msg.eventType, msg.domain);
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'local') return;
  if (changes.queue) rescheduleSnooze();
  const capRaised = changes.cap && changes.cap.oldValue != null && changes.cap.newValue > changes.cap.oldValue;
  const disabled = changes.enabled && changes.enabled.oldValue === true && changes.enabled.newValue === false;
  if (capRaised || disabled) {
    const { streak = { startDay: todayStr(), longest: 0 } } = await chrome.storage.local.get('streak');
    await chrome.storage.local.set({
      streak: { startDay: todayStr(), longest: Math.max(streak.longest, streakLen(streak)) }
    });
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'snooze') {
    await rescheduleSnooze();
    return;
  }
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
