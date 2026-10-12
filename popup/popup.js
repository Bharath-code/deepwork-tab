import { visibleItems, snoozeTargets } from '../lib/snooze.js';
import { isPro } from '../lib/entitlement.js';
import { weekSummary, fullSummary, shareText } from '../lib/receipt.js';
import { restoreAction, titleFor, queueAfterAdd } from '../lib/queue.js';
import { sessionState, formatRemaining, effectiveCap } from '../lib/session.js';
import { RULE_DEFAULTS, countedTabs, inWorkHours } from '../lib/rules.js';
import { lensSvg, capState } from '../shared/lens.js';

const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

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

function leave(el, how) {
  if (reducedMotion) return el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' }).finished;
  const h = el.offsetHeight;
  const out = how === 'up'
    ? [{ transform: 'none', opacity: 1, height: `${h}px` }, { transform: 'translateY(-8px)', opacity: 0, height: '0px' }]
    : [{ transform: 'none', opacity: 1, height: `${h}px` }, { transform: 'translateX(12px)', opacity: 0, height: '0px' }];
  el.style.overflow = 'hidden';
  return el.animate(out, { duration: 260, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' }).finished;
}

function ago(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function renderHeader(count, cap, { active, remainingMs, timeLeft, offHours, resume, streak }) {
  const state = capState(count, cap);
  document.body.classList.toggle('near', state === 'near' && !offHours);
  document.body.classList.toggle('resting', offHours);
  $('lens').innerHTML = lensSvg(count, cap, 52, 5, active ? timeLeft : null);
  $('count').textContent = count;
  $('cap').textContent = cap;
  const lead = offHours ? `Resting until ${resume}`
    : active ? `Focus · ${formatRemaining(remainingMs)} left`
    : { over: `Close ${count - cap} to get under`, at: 'New tabs pause', near: 'One left', calm: '' }[state];
  const days = streakDays(streak);
  $('stateLine').textContent = [lead, days ? `day ${days} under cap` : ''].filter(Boolean).join(' · ');
}

const streakDays = (streak) =>
  streak ? Math.floor((Date.parse(new Date().toLocaleDateString('sv')) - Date.parse(streak.startDay)) / 86400000) + 1 : 0;

function renderReceipt(weekLog, pro, streak) {
  const { intercepts, queued, top } = weekSummary(weekLog);
  const hasAny = intercepts > 0 || queued > 0;
  $('receipt').hidden = !hasAny;
  $('receiptFull').hidden = !(hasAny && pro);
  $('upsell').hidden = pro;
  if (!hasAny) return;
  $('rIntercepts').textContent = intercepts;
  $('rQueued').textContent = queued;
  const days = streakDays(streak);
  $('rStreak').textContent = days;
  $('rStreakCell').hidden = !days;
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
    li.textContent = `${domain} · ${count}`;
    list.appendChild(li);
  }
}

async function render() {
  const [{ cap, queue = [], streak, weekLog = [], session = null, sessionPrefs = { cap: 3, mins: 50 }, oneThing }, allTabs, pro, rules] = await Promise.all([
    chrome.storage.local.get({ cap: 7, queue: [], streak: null, weekLog: [], session: null, sessionPrefs: { cap: 3, mins: 50 }, oneThing: null }),
    chrome.tabs.query({ windowType: 'normal' }),
    isPro(),
    chrome.storage.local.get(RULE_DEFAULTS)
  ]);
  const tabs = countedTabs(allTabs, rules);
  const { active, remainingMs } = sessionState(session);
  const liveCap = effectiveCap(cap, session);
  $('sessionBar').hidden = !pro || active;
  $('sessionStart').hidden = !pro || active;
  const offHours = !active && !inWorkHours(rules.schedule);
  renderHeader(tabs.length, liveCap, {
    active,
    remainingMs,
    timeLeft: remainingMs / (sessionPrefs.mins * 60000),
    offHours,
    resume: rules.schedule?.start,
    streak
  });
  const today = oneThing?.text && oneThing.day === localDay();
  $('oneThing').hidden = !today;
  if (today) $('oneThingText').textContent = oneThing.text;
  renderReceipt(weekLog, pro, streak);
  const share = shareText(weekSummary(weekLog), streakDays(streak));
  $('shareRow').hidden = !share;
  $('shareX').href = `https://x.com/intent/post?text=${encodeURIComponent(share)}`;

  const list = $('queue');
  list.replaceChildren();

  const shown = pro
    ? queue.map((item, i) => ({ item, i })).filter(({ item }) => visibleItems([item]).length)
    : queue.map((item, i) => ({ item, i }));
  $('empty').hidden = shown.length > 0;
  $('exportBtn').hidden = shown.length === 0;
  $('shelfCount').textContent = shown.length || '';

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

  shown.forEach(({ item, i }, n) => {
    const li = document.createElement('li');
    li.style.setProperty('--i', Math.min(n, 4));
    const name = item.title || item.url;
    const domain = domainOf(item.url);

    const mark = document.createElement('span');
    mark.className = 'mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = domain.charAt(0);
    li.appendChild(mark);

    const text = document.createElement('span');
    text.className = 'row-text';
    const title = document.createElement('span');
    title.className = 'row-title';
    title.textContent = name.replace(/^https?:\/\//, '');
    title.title = item.url;
    const meta = document.createElement('span');
    meta.className = 'row-meta';
    meta.textContent = `${domain} · ${ago(item.ts)}`;
    text.append(title, meta);
    li.appendChild(text);

    const acts = document.createElement('span');
    acts.className = 'acts';

    const open = document.createElement('button');
    open.className = 'open';
    open.textContent = 'Open ↵';
    open.setAttribute('aria-label', `Open ${name}`);
    open.addEventListener('click', () => restoreItem(item, i, li));
    acts.appendChild(open);

    if (pro) {
      const zzz = document.createElement('button');
      zzz.className = 'zzz';
      zzz.textContent = '☾';
      zzz.setAttribute('aria-label', `Snooze ${name}`);
      zzz.addEventListener('click', () => openSnoozeMenu(i, li, zzz));
      acts.appendChild(zzz);
    }

    const del = document.createElement('button');
    del.textContent = '×';
    del.setAttribute('aria-label', `Remove ${name} from shelf`);
    del.addEventListener('click', () => dismissAt(i, li));
    acts.appendChild(del);

    li.appendChild(acts);
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

async function dismissAt(i, li) {
  const { queue = [] } = await chrome.storage.local.get('queue');
  const item = queue[i];
  if (!item) return;
  const next = li?.nextElementSibling || li?.previousElementSibling;
  queue.splice(i, 1);
  await chrome.storage.local.set({ queue });
  clearUndo();
  undo = {
    item,
    index: i,
    timer: setTimeout(() => {
      undo = null;
      $('undoBar').hidden = true;
      $('status').textContent = '';
    }, 5000)
  };
  $('status').textContent = 'Removed from shelf. Press Z to undo.';
  if (li) await leave(li, 'side');
  $('undoBar').hidden = false;
  await render();
  const focusTo = next && [...$('queue').children].find((r) => r.querySelector('.row-title')?.title === next.querySelector('.row-title')?.title);
  (focusTo?.querySelector('.open') || $('undoBtn')).focus();
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
  $('undoBar').hidden = true;
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

async function restoreItem(item, index, li) {
  const [tabs, { cap, session = null }, rules] = await Promise.all([
    chrome.tabs.query({ windowType: 'normal' }),
    chrome.storage.local.get({ cap: 7, session: null }),
    chrome.storage.local.get(RULE_DEFAULTS)
  ]);
  const openUrls = tabs.map((t) => t.url).filter(Boolean);
  const enforced = sessionState(session).active || inWorkHours(rules.schedule);
  const liveCap = enforced ? effectiveCap(cap, session) : Infinity;
  const plan = restoreAction({ cap: liveCap, tabCount: countedTabs(tabs, rules).length, queuedUrl: item.url, openUrls });

  if (plan.action === 'focus') {
    const existing = tabs.find((t) => t.url === item.url);
    await removeAt(index);
    if (existing) await chrome.tabs.update(existing.id, { active: true });
    window.close();
    return;
  }

  if (plan.action === 'open') {
    if (li) await leave(li, 'up');
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
    const btn = document.createElement('button');
    btn.textContent = t.title || t.url;
    btn.title = t.url;
    btn.setAttribute('aria-label', `Close ${t.title || t.url} and open the shelved page`);
    btn.addEventListener('click', () => finishSwap(t));
    li.appendChild(btn);
    list.appendChild(li);
  }
  list.querySelector('button')?.focus();
  $('status').textContent = 'Pick a tab to close, then the shelved page opens';
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

async function openSnoozeMenu(i, row, anchor) {
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
  row.after(menu);
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
    $('queue').querySelector('.open')?.focus();
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
  const label = `Copied ${queue.length} link${queue.length === 1 ? '' : 's'} ✓`;
  $('status').textContent = label;
  $('exportBtn').textContent = label;
  $('exportBtn').classList.add('copied');
  setTimeout(() => {
    $('exportBtn').textContent = 'Copy shelf as Markdown';
    $('exportBtn').classList.remove('copied');
  }, 2000);
});

$('undoBtn').addEventListener('click', restoreUndo);

$('queue').addEventListener('keydown', (e) => {
  const row = e.target.closest('li');
  if (!row) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    const to = e.key === 'ArrowDown' ? row.nextElementSibling : row.previousElementSibling;
    to?.querySelector('.open')?.focus();
    e.preventDefault();
  } else if (e.key === 'Backspace' || e.key === 'Delete') {
    row.querySelector('[aria-label^="Remove"]')?.click();
    e.preventDefault();
  }
});

$('shareBtn').addEventListener('click', async () => {
  const { weekLog = [], streak = null } = await chrome.storage.local.get(['weekLog', 'streak']);
  const text = shareText(weekSummary(weekLog), streakDays(streak));
  if (!text) return;
  await navigator.clipboard.writeText(text);
  $('status').textContent = 'This week copied. Paste it anywhere.';
});

chrome.storage.local.get({ onboarded: true }).then(async ({ onboarded }) => {
  if (onboarded !== false) return render();
  const url = chrome.runtime.getURL('welcome/welcome.html');
  const [open] = await chrome.tabs.query({ url });
  if (open) await chrome.tabs.update(open.id, { active: true });
  else await chrome.tabs.create({ url });
  window.close();
});
