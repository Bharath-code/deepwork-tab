import { sessionState, formatRemaining } from '../lib/session.js';
import { wrapFocus } from '../lib/focus.js';
import { RULE_DEFAULTS, countedTabs, parseDomains, rulesLoosen } from '../lib/rules.js';

const $ = (id) => document.getElementById(id);
const GATE_SECONDS = 60;
let current = {};
let countdown = null;

async function paintHints() {
  const [{ cap, ...rules }, allTabs] = await Promise.all([
    chrome.storage.local.get({ cap: 7, ...RULE_DEFAULTS }),
    chrome.tabs.query({ windowType: 'normal' })
  ]);
  const tabs = countedTabs(allTabs, rules);
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

async function load() {
  current = await chrome.storage.local.get({
    cap: 7,
    enabled: true,
    reason: '',
    onboarded: true,
    ...RULE_DEFAULTS
  });
  $('reason').value = current.reason;
  $('exemptPinned').checked = current.exemptPinned;
  $('exemptDomains').value = current.exemptDomains.join('\n');
  $('schedOn').checked = current.schedule.on;
  $('schedStart').value = current.schedule.start;
  $('schedEnd').value = current.schedule.end;
  for (const box of $('schedDays').querySelectorAll('input')) {
    box.checked = current.schedule.days.includes(Number(box.value));
  }
  $('schedBox').hidden = !current.schedule.on;
  $('cap').value = current.cap;
  $('enabled').checked = current.enabled;
  await paintHints();
}

const breaksStreak = (next) => next.cap > current.cap || (!next.enabled && current.enabled);
const needsGate = (next) => breaksStreak(next) || rulesLoosen(current, next);

function readRules() {
  return {
    exemptPinned: $('exemptPinned').checked,
    exemptDomains: parseDomains($('exemptDomains').value),
    schedule: {
      on: $('schedOn').checked,
      days: [...$('schedDays').querySelectorAll('input:checked')].map((b) => Number(b.value)),
      start: $('schedStart').value || RULE_DEFAULTS.schedule.start,
      end: $('schedEnd').value || RULE_DEFAULTS.schedule.end
    }
  };
}

$('schedOn').addEventListener('change', () => ($('schedBox').hidden = !$('schedOn').checked));

async function finishOnboarding(next) {
  const tabs = countedTabs(await chrome.tabs.query({ windowType: 'normal' }), next);
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
    enabled: $('enabled').checked,
    ...readRules()
  };
  if (next.schedule.on && !next.schedule.days.length) {
    $('status').textContent = 'Pick at least one work day, or turn work hours off.';
    return;
  }
  if (next.schedule.on && next.schedule.start === next.schedule.end) {
    $('status').textContent = 'Work hours need different start and end times.';
    return;
  }
  $('exemptDomains').value = next.exemptDomains.join('\n');
  const firstSave = current.onboarded === false;
  if (needsGate(next) && !firstSave) {
    const { session = null } = await chrome.storage.local.get('session');
    const { active, remainingMs } = sessionState(session);
    if (active) {
      $('status').textContent = `Focus session ends in ${formatRemaining(remainingMs)}. Your cap is locked until then.`;
      load();
      return;
    }
    openGate(next, breaksStreak(next));
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
  paintHints();
});

function openGate(next, streakAtStake) {
  $('gateReason').textContent = current.reason
    ? `"${current.reason}"`
    : '(you never wrote a reason — that itself is worth a minute)';
  $('gateStreak').hidden = true;
  chrome.storage.local.get('streak').then(({ streak }) => {
    if (!streak || !streakAtStake) return;
    const days = Math.floor((Date.parse(new Date().toLocaleDateString('sv')) - Date.parse(streak.startDay)) / 86400000) + 1;
    if (days < 2) return;
    $('gateStreak').textContent = `This ends a ${days}-day streak.`;
    $('gateStreak').hidden = false;
  });
  $('gate').hidden = false;
  $('settings').inert = true;
  $('license').inert = true;
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
      $('settings').inert = false;
      $('license').inert = false;
      $('gate').hidden = true;
      $('announce').textContent = 'Change applied';
      await apply(next);
    }
  }, 1000);
}

$('cancelBtn').addEventListener('click', () => {
  clearInterval(countdown);
  $('settings').inert = false;
  $('license').inert = false;
  $('gate').hidden = true;
  $('announce').textContent = 'Cancelled. Your limit is unchanged.';
  load();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('gate').hidden) $('cancelBtn').click();
});

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

load();
