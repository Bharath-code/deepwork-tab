import { nextWake } from '../lib/snooze.js';
import { effectiveCap } from '../lib/session.js';

const DEFAULTS = { cap: 7, enabled: true, reason: '' };
const INTERCEPT = chrome.runtime.getURL('intercept/intercept.html');
const PING_URL = 'https://deepwork-tab-ping.kumarbharath63.workers.dev';
const WEEK_MS = 7 * 86400000;
const LOG_MAX = 400;

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

async function rescheduleSnooze() {
  const { queue = [] } = await chrome.storage.local.get('queue');
  const when = nextWake(queue);
  if (when == null) {
    await chrome.alarms.clear('snooze');
    return;
  }
  chrome.alarms.create('snooze', { when });
}

async function tabCount() {
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  return tabs.length;
}

async function updateBadge() {
  const [cap, count] = await Promise.all([activeCap(), tabCount()]);
  const over = count >= cap;
  await chrome.action.setBadgeText({ text: String(count) });
  await chrome.action.setBadgeBackgroundColor({ color: over ? '#c0392b' : '#4a5568' });
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
  updateBadge();
  backfillTitles();
});

chrome.runtime.onStartup.addListener(() => {
  ensureStreak();
  updateBadge();
  backfillTitles();
});

chrome.tabs.onCreated.addListener(async (tab) => {
  updateBadge();
  const { enabled } = await cfg();
  const cap = await activeCap();
  if (!enabled) return;
  const count = await tabCount();
  const target = tab.pendingUrl || tab.url || '';
  if (target.startsWith(INTERCEPT)) return;
  const { restoringUrl } = await chrome.storage.local.get('restoringUrl');
  if (restoringUrl && target === restoringUrl) {
    await chrome.storage.local.remove('restoringUrl');
    return;
  }
  if (count <= cap) return;
  const url = `${INTERCEPT}?target=${encodeURIComponent(target)}`;
  try {
    await chrome.tabs.update(tab.id, { url });
  } catch {}
});

chrome.tabs.onRemoved.addListener(updateBadge);

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', copy: '©', trade: '™', reg: '®' };

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

async function fetchTitle(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const m = (await res.text()).match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = m?.[1].replace(/\s+/g, ' ').trim();
    if (!title) return;
    const { queue = [] } = await chrome.storage.local.get('queue');
    const item = queue.find((q) => q.url === url && q.title === q.url);
    if (item) {
      item.title = decodeEntities(title);
      await chrome.storage.local.set({ queue });
    }
  } catch {}
}

async function backfillTitles() {
  const { queue = [] } = await chrome.storage.local.get('queue');
  const missing = queue.filter((q) => q.title === q.url && /^https?:/.test(q.url));
  // ponytail: sequential, first 20 only — enough for any real queue
  for (const q of missing.slice(0, 20)) await fetchTitle(q.url);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'fetchTitle') fetchTitle(msg.url);
  if (msg.type === 'logEvent') logEvent(msg.eventType, msg.domain);
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'local') return;
  if (changes.queue) rescheduleSnooze();
  if (changes.cap) updateBadge();
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
  const { installId, installedAt, lastPing } = await chrome.storage.local.get([
    'installId',
    'installedAt',
    'lastPing'
  ]);
  const day = new Date().toISOString().slice(0, 10);
  if (lastPing === day) return;
  const daysSinceInstall = Math.floor((Date.now() - (installedAt || Date.now())) / 86400000);
  try {
    await fetch(PING_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ id: installId, day, d: daysSinceInstall })
    });
    await chrome.storage.local.set({ lastPing: day });
  } catch {}
});
