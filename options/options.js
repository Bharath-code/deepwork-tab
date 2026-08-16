import { sessionState, formatRemaining } from '../lib/session.js';

const $ = (id) => document.getElementById(id);
const GATE_SECONDS = 60;
let current = {};
let countdown = null;

async function load() {
  current = await chrome.storage.local.get({
    cap: 7,
    enabled: true,
    reason: '',
    onboarded: true
  });
  $('reason').value = current.reason;
  $('cap').value = current.cap;
  $('enabled').checked = current.enabled;
}

function needsGate(next) {
  return next.cap > current.cap || (!next.enabled && current.enabled);
}

async function finishOnboarding(next) {
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  const extra = tabs.length - next.cap;
  await chrome.storage.local.set({ onboarded: true });
  current.onboarded = true;
  if (extra <= 0) {
    $('status').textContent = 'Saved. Cap is live.';
    setTimeout(() => ($('status').textContent = ''), 2500);
    return;
  }
  $('frCount').textContent = tabs.length;
  $('frCap').textContent = next.cap;
  $('frExtra').textContent = extra;
  $('settings').hidden = true;
  $('firstRun').hidden = false;
  $('frGo').focus();
}

async function apply(next, { firstSave = false } = {}) {
  await chrome.storage.local.set(next);
  current = { ...current, ...next };
  if (firstSave) {
    await finishOnboarding(next);
    return;
  }
  $('status').textContent = 'Saved.';
  setTimeout(() => ($('status').textContent = ''), 2000);
}

$('saveBtn').addEventListener('click', async () => {
  const next = {
    reason: $('reason').value.trim(),
    cap: Math.max(1, Math.min(50, parseInt($('cap').value, 10) || 7)),
    enabled: $('enabled').checked
  };
  const firstSave = current.onboarded === false;
  if (needsGate(next) && !firstSave) {
    const { session = null } = await chrome.storage.local.get('session');
    const { active, remainingMs } = sessionState(session);
    if (active) {
      $('status').textContent = `Focus session ends in ${formatRemaining(remainingMs)}. Your cap is locked until then.`;
      load();
      return;
    }
    openGate(next);
    return;
  }
  apply(next, { firstSave });
});

$('frGo').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('intercept/intercept.html') });
});

$('frSkip').addEventListener('click', () => {
  $('firstRun').hidden = true;
  $('settings').hidden = false;
  $('status').textContent = 'Saved. Cap is live whenever you open a new tab.';
  setTimeout(() => ($('status').textContent = ''), 3000);
});

function openGate(next) {
  $('gateReason').textContent = current.reason
    ? `"${current.reason}"`
    : '(you never wrote a reason — that itself is worth a minute)';
  chrome.storage.local.get('streak').then(({ streak }) => {
    if (!streak) return;
    const days = Math.floor((Date.parse(new Date().toLocaleDateString('sv')) - Date.parse(streak.startDay)) / 86400000) + 1;
    if (days < 2) return;
    $('gateStreak').textContent = `This ends a ${days}-day streak.`;
    $('gateStreak').hidden = false;
  });
  $('gate').hidden = false;
  $('cancelBtn').focus();
  let left = GATE_SECONDS;
  $('timer').textContent = left;
  $('announce').textContent = `${left} seconds until the change applies`;
  countdown = setInterval(async () => {
    left -= 1;
    $('timer').textContent = left;
    if (left === 30 || left === 10) {
      $('announce').textContent = `${left} seconds until the change applies`;
    }
    if (left <= 0) {
      clearInterval(countdown);
      $('gate').hidden = true;
      $('announce').textContent = 'Change applied';
      await apply(next);
    }
  }, 1000);
}

$('cancelBtn').addEventListener('click', () => {
  clearInterval(countdown);
  $('gate').hidden = true;
  $('announce').textContent = 'Cancelled. Your limit is unchanged.';
  load();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('gate').hidden) $('cancelBtn').click();
});

load();
