const DEFAULTS = { cap: 7, enabled: true, reason: '' };
const INTERCEPT = chrome.runtime.getURL('intercept/intercept.html');
const PING_URL = '';

async function cfg() {
  return chrome.storage.local.get(DEFAULTS);
}

async function tabCount() {
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  return tabs.length;
}

async function updateBadge() {
  const [{ cap }, count] = await Promise.all([cfg(), tabCount()]);
  const over = count >= cap;
  await chrome.action.setBadgeText({ text: String(count) });
  await chrome.action.setBadgeBackgroundColor({ color: over ? '#c0392b' : '#4a5568' });
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await chrome.storage.local.set({
      installId: crypto.randomUUID(),
      installedAt: Date.now(),
      queue: [],
      intents: []
    });
    chrome.runtime.openOptionsPage();
  }
  chrome.alarms.create('ping', { periodInMinutes: 360 });
  updateBadge();
  backfillTitles();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
  backfillTitles();
});

chrome.tabs.onCreated.addListener(async (tab) => {
  updateBadge();
  const { cap, enabled } = await cfg();
  if (!enabled) return;
  const count = await tabCount();
  if (count <= cap) return;
  const target = tab.pendingUrl || tab.url || '';
  if (target.startsWith(INTERCEPT)) return;
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

chrome.runtime.onMessage.addListener(({ type, url }) => {
  if (type === 'fetchTitle') fetchTitle(url);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.cap) updateBadge();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'ping' || !PING_URL) return;
  const { installId, installedAt, lastPing } = await chrome.storage.local.get([
    'installId',
    'installedAt',
    'lastPing'
  ]);
  const day = new Date().toISOString().slice(0, 10);
  if (lastPing === day) return;
  const daysSinceInstall = Math.floor((Date.now() - installedAt) / 86400000);
  try {
    await fetch(PING_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ id: installId, day, d: daysSinceInstall })
    });
    await chrome.storage.local.set({ lastPing: day });
  } catch {}
});
