import { visibleItems, snoozeTargets } from '../lib/snooze.js';
import { isPro } from '../lib/entitlement.js';
import { weekSummary, fullSummary } from '../lib/receipt.js';
import { restoreAction, titleFor, queueAfterAdd } from '../lib/queue.js';
import { sessionState, formatRemaining } from '../lib/session.js';

const $ = (id) => document.getElementById(id);

function ago(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function renderDots(count, cap) {
  const dots = $('dots');
  dots.replaceChildren();
  const shown = Math.min(cap, 12);
  for (let i = 0; i < shown; i++) {
    const d = document.createElement('span');
    d.className = 'dot';
    if (i < count) d.classList.add(count > cap ? 'over' : 'on');
    dots.appendChild(d);
  }
}

function streakText(streak) {
  if (!streak) return '';
  const days = Math.floor((Date.parse(new Date().toLocaleDateString('sv')) - Date.parse(streak.startDay)) / 86400000) + 1;
  const best = streak.longest > days ? ` · best ${streak.longest}` : '';
  return `Day ${days} under cap${best}`;
}

function renderReceipt(weekLog, pro) {
  const { intercepts, queued, top } = weekSummary(weekLog);
  const hasAny = intercepts > 0 || queued > 0;
  $('receipt').hidden = !hasAny;
  $('receiptFull').hidden = !(hasAny && pro);
  $('upsell').hidden = pro;
  if (!hasAny) return;
  $('rIntercepts').textContent = intercepts;
  $('rQueued').textContent = queued;
  if (top) {
    $('rTop').textContent = top;
    $('rTopRow').hidden = false;
  } else {
    $('rTopRow').hidden = true;
  }
  if (!pro) return;

  const { byDay, topDomains, queueRate } = fullSummary(weekLog);
  $('rRate').textContent = `${queueRate}%`;
  const spark = $('rSpark');
  spark.replaceChildren();
  const peak = Math.max(...byDay, 1);
  for (const n of byDay) {
    const bar = document.createElement('span');
    bar.style.height = `${Math.round((n / peak) * 100)}%`;
    spark.appendChild(bar);
  }
  spark.setAttribute('aria-label', `Intercepts per day, oldest to newest: ${byDay.join(', ')}`);
  const list = $('rDomains');
  list.replaceChildren();
  for (const { domain, count } of topDomains) {
    const li = document.createElement('li');
    li.textContent = `${domain} — ${count}`;
    list.appendChild(li);
  }
}

async function render() {
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
  $('count').textContent = tabs.length;
  $('cap').textContent = cap;
  renderDots(tabs.length, cap);
  $('streak').textContent = streakText(streak);
  $('streak').hidden = !streak;
  renderReceipt(weekLog, pro);

  const list = $('queue');
  list.replaceChildren();

  const shown = pro
    ? queue.map((item, i) => ({ item, i })).filter(({ item }) => visibleItems([item]).length)
    : queue.map((item, i) => ({ item, i }));
  $('empty').hidden = shown.length > 0;
  $('exportBtn').hidden = shown.length === 0;

  if (pro) {
    const hiddenCount = queue.length - shown.length;
    let note = $('snoozedNote');
    if (!note) {
      note = document.createElement('p');
      note.id = 'snoozedNote';
      note.className = 'muted';
      list.after(note);
    }
    note.hidden = hiddenCount === 0;
    note.textContent = `${hiddenCount} snoozed`;
  } else {
    $('snoozedNote')?.remove();
    closeSnoozeMenu();
  }

  shown.forEach(({ item, i }) => {
    const li = document.createElement('li');

    const url = document.createElement('span');
    url.className = 'url';
    url.textContent = (item.title || item.url).replace(/^https?:\/\//, '');
    url.title = item.url;
    li.appendChild(url);

    const when = document.createElement('span');
    when.className = 'when';
    when.textContent = ago(item.ts);
    li.appendChild(when);

    const open = document.createElement('button');
    open.textContent = 'Open';
    open.addEventListener('click', () => restoreItem(item, i));
    li.appendChild(open);

    const del = document.createElement('button');
    del.className = 'x';
    del.textContent = '✕';
    del.setAttribute('aria-label', 'Remove from queue');
    del.addEventListener('click', () => dismissAt(i));
    li.appendChild(del);

    if (pro) {
      const zzz = document.createElement('button');
      zzz.className = 'zzz';
      zzz.textContent = '☾';
      zzz.setAttribute('aria-label', `Snooze ${item.title || item.url}`);
      zzz.addEventListener('click', () => openSnoozeMenu(i, zzz));
      li.appendChild(zzz);
    }

    list.appendChild(li);
  });
}

async function removeAt(i) {
  const { queue = [] } = await chrome.storage.local.get('queue');
  queue.splice(i, 1);
  await chrome.storage.local.set({ queue });
}

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
    await chrome.storage.local.set({ restoringUrl: item.url });
    chrome.tabs.create({ url: item.url });
    window.close();
    return;
  }

  pendingRestore = { item };
  $('swapTarget').textContent = titleFor(item.url, item.title);
  $('swap').hidden = false;
  const list = $('swapTabs');
  list.replaceChildren();
  const candidates = tabs.slice().sort((a, b) => (a.lastAccessed || 0) - (b.lastAccessed || 0));
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
  const { item } = pendingRestore;
  pendingRestore = null;
  const { queue = [] } = await chrome.storage.local.get('queue');
  let next = queue;
  const saved = /^https?:\/\//i.test(tab.url || '');
  if (saved) {
    next = queueAfterAdd(queue, {
      url: tab.url,
      title: titleFor(tab.url, tab.title),
      ts: Date.now()
    });
  }
  next = next.filter((q) => q.url !== item.url);
  await chrome.storage.local.set({ queue: next });
  try {
    await chrome.tabs.remove(tab.id);
  } catch {}
  await chrome.storage.local.set({ restoringUrl: item.url });
  chrome.tabs.create({ url: item.url });
  window.close();
}

let snoozeAnchor = null;

function closeSnoozeMenu() {
  document.querySelector('.snooze-menu')?.remove();
  snoozeAnchor = null;
}

async function openSnoozeMenu(i, anchor) {
  closeSnoozeMenu();
  const menu = document.createElement('div');
  menu.id = 'snoozeMenu';
  menu.className = 'snooze-menu';
  for (const { label, at } of snoozeTargets()) {
    const b = document.createElement('button');
    b.textContent = label;
    b.addEventListener('click', async () => {
      const { queue = [] } = await chrome.storage.local.get('queue');
      if (!queue[i]) return;
      queue[i].snoozedUntil = at;
      await chrome.storage.local.set({ queue });
      closeSnoozeMenu();
      $('status').textContent = `Snoozed until ${label.toLowerCase()}`;
      render();
    });
    menu.appendChild(b);
  }
  anchor.after(menu);
  snoozeAnchor = anchor;
  menu.querySelector('button').focus();
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('swap').hidden) {
    hideSwap();
    render();
    return;
  }
  const menu = document.querySelector('.snooze-menu');
  if (!menu) return;
  const anchor = snoozeAnchor;
  closeSnoozeMenu();
  if (anchor && anchor.isConnected) {
    anchor.focus();
  } else {
    $('queue').querySelector('button')?.focus();
  }
});

$('swapCancel').addEventListener('click', () => {
  hideSwap();
  render();
});

$('sessionStart').addEventListener('click', async () => {
  const { sessionPrefs = { cap: 3, mins: 50 } } = await chrome.storage.local.get('sessionPrefs');
  await chrome.storage.local.set({
    session: { cap: sessionPrefs.cap, endsAt: Date.now() + sessionPrefs.mins * 60000 }
  });
  render();
});

$('settingsBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());

$('exportBtn').addEventListener('click', async () => {
  const { queue = [] } = await chrome.storage.local.get('queue');
  if (!queue.length) return;
  const md = queue.map((item) => `- [${item.title || item.url}](${item.url})`).join('\n');
  await navigator.clipboard.writeText(md);
  $('status').textContent = 'Queue copied as markdown';
});

render();
