import { sessionState, formatRemaining } from '../lib/session.js';
import { wrapFocus } from '../lib/focus.js';
import { RULE_DEFAULTS, countedTabs, parseDomains, rulesLoosen } from '../lib/rules.js';
import { BREATH_SECONDS, CYCLE, INHALE, breathCaption, breathClock, announceAt, describeChange } from '../lib/breath.js';

const $ = (id) => document.getElementById(id);
let current = {};
let countdown = null;
let breathAnims = [];
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

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

async function apply(next) {
  await chrome.storage.local.set(next);
  current = { ...current, ...next };
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
  if (needsGate(next)) {
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
  apply(next);
});

function paintBreath(left) {
  $('caption').textContent = breathCaption(left);
  $('timer').textContent = breathClock(left);
  if (still()) $('arc').style.strokeDashoffset = left / BREATH_SECONDS;
}

function startBreath() {
  if (still()) return;
  const ms = BREATH_SECONDS * 1000;
  breathAnims = [
    $('breath').animate(
      [
        { transform: 'scale(.86)', easing: 'cubic-bezier(.65, 0, .35, 1)' },
        { transform: 'scale(1)', offset: INHALE / CYCLE, easing: 'cubic-bezier(.65, 0, .35, 1)' },
        { transform: 'scale(.86)' }
      ],
      { duration: CYCLE * 1000, iterations: BREATH_SECONDS / CYCLE }
    ),
    $('arc').animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: ms, fill: 'forwards' })
  ];
}

function closeGate() {
  clearInterval(countdown);
  breathAnims.forEach((a) => a.cancel());
  breathAnims = [];
  $('arc').style.strokeDashoffset = '';
  $('settings').inert = false;
  $('license').inert = false;
  $('gate').hidden = true;
}

function openGate(next, streakAtStake) {
  const change = describeChange(current, next);
  $('gateTitle').hidden = !current.reason;
  $('gateReason').classList.toggle('empty', !current.reason);
  $('gateReason').textContent = current.reason
    ? `\u201c${current.reason}\u201d`
    : "You didn't write a reason. Add one after this, so next time you hear your own words.";
  $('gateChange').textContent = `${change} It applies when the minute ends.`;
  chrome.storage.local.get('streak').then(({ streak }) => {
    if (!streak || !streakAtStake) return;
    const days = Math.floor((Date.parse(new Date().toLocaleDateString('sv')) - Date.parse(streak.startDay)) / 86400000) + 1;
    if (days < 2) return;
    $('gateChange').textContent = `${change} It applies when the minute ends. Day ${days} of keeping it.`;
  });
  $('gate').hidden = false;
  $('settings').inert = true;
  $('license').inert = true;
  $('cancelBtn').focus();
  const end = Date.now() + BREATH_SECONDS * 1000;
  let left = BREATH_SECONDS;
  paintBreath(left);
  startBreath();
  $('announce').textContent = 'A slow minute, then the change applies. Escape keeps your limit.';
  countdown = setInterval(async () => {
    left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    paintBreath(left);
    if (announceAt(left)) $('announce').textContent = `${left} seconds left`;
    if (left > 0) return;
    clearInterval(countdown);
    $('announce').textContent = 'Change applied';
    $('cancelBtn').disabled = true;
    if (!still()) $('breath').animate([{ transform: 'scale(.86)' }, { transform: 'scale(1)' }], { duration: 520, easing: getComputedStyle(document.body).getPropertyValue('--spring') || 'ease-out' });
    await apply(next);
    setTimeout(() => {
      $('cancelBtn').disabled = false;
      closeGate();
    }, 900);
  }, 250);
}

$('cancelBtn').addEventListener('click', () => {
  closeGate();
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
