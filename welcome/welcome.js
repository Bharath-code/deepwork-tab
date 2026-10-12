import { lensSvg } from '../shared/lens.js';
import { RULE_DEFAULTS, countedTabs } from '../lib/rules.js';
import { queueAfterAdd, titleFor } from '../lib/queue.js';
import { STEPS, MIN_REASON, reasonReady, clampCap, nextStep, stepLabel, capNote, shelveOrder } from '../lib/onboard.js';

const $ = (id) => document.getElementById(id);
const section = (step) => document.querySelector(`section[data-step="${step}"]`);
const web = (url) => /^https?:\/\//i.test(url || '');
let step = 'welcome';
let cap = 7;
let self = null;
let pinTimer = null;

const hour = new Date().getHours();
document.documentElement.dataset.phase = hour >= 5 && hour < 10 ? 'dawn' : hour < 16 && hour >= 10 ? 'day' : hour >= 16 && hour < 20 ? 'dusk' : 'night';

async function openTabs() {
  const [all, rules] = await Promise.all([
    chrome.tabs.query({ windowType: 'normal' }),
    chrome.storage.local.get(RULE_DEFAULTS)
  ]);
  return countedTabs(all, rules).filter((t) => t.id !== self?.id);
}

function paintDots() {
  const at = STEPS.indexOf(step);
  $('dots').innerHTML = [0, 1, 2, 3].map((i) => `<span${i <= at ? ' class="on"' : ''}></span>`).join('');
  $('dots').setAttribute('aria-label', stepLabel(step) || 'Setup almost done');
}

async function show(next) {
  clearInterval(pinTimer);
  step = next;
  for (const s of document.querySelectorAll('section')) s.hidden = s.dataset.step !== step;
  const el = section(step);
  const label = el.querySelector('.step');
  if (label) label.textContent = stepLabel(step);
  paintDots();
  await chrome.storage.local.set({ onboardStep: step });
  await enter[step]?.();
  el.querySelector('h1').focus();
}

function paintReason() {
  const text = $('reason').value.trim();
  const ready = reasonReady(text);
  $('count').textContent = ready ? `${text.length} characters` : `at least ${MIN_REASON} characters (${text.length})`;
  $('count').classList.toggle('short', !ready && text.length > 0);
  $('bar').style.width = `${Math.min(100, Math.round((text.length / 90) * 100))}%`;
  $('bar').classList.toggle('ready', ready);
  $('preview').textContent = text ? `“${text}”` : 'Your sentence appears here.';
  $('preview').classList.toggle('empty', !text);
  $('reasonGo').setAttribute('aria-disabled', String(!ready));
}

async function paintCap() {
  const open = (await openTabs()).length;
  $('capLens').innerHTML = lensSvg(open, cap, 260, 6);
  $('capNum').textContent = cap;
  $('capNote').textContent = capNote(open, cap);
  $('capNote').classList.toggle('over', open > cap);
  $('capGo').firstChild.textContent = `Set cap at ${cap} `;
}

async function paintClear() {
  const tabs = await openTabs();
  const over = tabs.length - cap;
  $('clearLens').innerHTML = lensSvg(tabs.length, cap, 28, 3);
  $('clearMeta').textContent = `${tabs.length} of ${cap}`;
  const under = over <= 0;
  $('clearTitle').textContent = under ? "You're under." : `Shelve ${over} more.`;
  $('clearLede').hidden = under;
  $('clearList').hidden = under;
  $('clearAll').hidden = under;
  $('clearGo').hidden = !under;
  if (under) {
    $('announce').textContent = "You're under the cap.";
    return;
  }
  $('clearList').replaceChildren(...tabs.map(row));
}

function row(tab) {
  const li = document.createElement('li');
  const text = document.createElement('span');
  text.className = 'tab-text';
  const title = document.createElement('span');
  title.className = 'tab-title';
  title.textContent = titleFor(tab.url, tab.title);
  const domain = document.createElement('span');
  domain.className = 'tab-domain num';
  domain.textContent = (tab.url || '').replace(/^https?:\/\/(www\.)?/i, '').split(/[?#]/)[0];
  text.append(title, domain);
  const btn = document.createElement('button');
  btn.textContent = web(tab.url) ? 'Shelve' : 'Close';
  btn.setAttribute('aria-label', `${btn.textContent} ${title.textContent}`);
  btn.addEventListener('click', async () => {
    li.classList.add('gone');
    await shelve([tab]);
    paintClear();
  });
  li.append(text, btn);
  return li;
}

async function shelve(tabs) {
  const { queue = [] } = await chrome.storage.local.get('queue');
  let next = queue;
  for (const t of tabs.filter((t) => web(t.url))) {
    next = queueAfterAdd(next, { url: t.url, title: titleFor(t.url, t.title), ts: Date.now() });
  }
  await chrome.storage.local.set({ queue: next });
  try {
    await chrome.tabs.remove(tabs.map((t) => t.id));
  } catch {}
}

async function watchPin() {
  if (!chrome.action.getUserSettings) {
    $('pinState').textContent = 'Pin it whenever you are ready.';
    return;
  }
  const check = async () => {
    const { isOnToolbar } = await chrome.action.getUserSettings();
    section('pin').querySelector('.pin').classList.toggle('done', isOnToolbar);
    $('pinState').textContent = isOnToolbar ? 'Pinned. Your shelf is one click away.' : 'Waiting for the pin…';
    if (isOnToolbar) clearInterval(pinTimer);
  };
  await check();
  pinTimer = setInterval(check, 1000);
}

const enter = { cap: paintCap, clear: paintClear, pin: watchPin, reason: paintReason };

const commit = {
  async reason() {
    if (!reasonReady($('reason').value)) {
      $('announce').textContent = `At least ${MIN_REASON} characters, or skip for now.`;
      $('reason').focus();
      return false;
    }
    await chrome.storage.local.set({ reason: $('reason').value.trim() });
  },
  async cap() {
    await chrome.storage.local.set({ cap });
  },
  async day() {
    const start = $('schedStart').value || RULE_DEFAULTS.schedule.start;
    const end = $('schedEnd').value || RULE_DEFAULTS.schedule.end;
    if ($('schedOn').checked && start === end) {
      $('announce').textContent = 'Work hours need different start and end times.';
      $('schedStart').focus();
      return false;
    }
    const { schedule } = await chrome.storage.local.get({ schedule: RULE_DEFAULTS.schedule });
    await chrome.storage.local.set({
      schedule: { ...schedule, on: $('schedOn').checked, start, end },
      rituals: { oneThing: $('ritualOne').checked, shutdown: $('ritualShut').checked }
    });
  }
};

async function advance(skip = false) {
  if (!skip && (await commit[step]?.()) === false) return;
  const over = (await openTabs()).length - cap;
  const next = nextStep(step, over);
  if (next !== 'done') return show(next);
  await chrome.storage.local.set({ onboarded: true });
  await chrome.storage.local.remove('onboardStep');
  const siblings = await chrome.tabs.query({ windowId: self.windowId });
  if (siblings.length > 1) chrome.tabs.remove(self.id);
  else chrome.tabs.update(self.id, { url: 'chrome://newtab/' });
}

for (const btn of document.querySelectorAll('[data-go]')) btn.addEventListener('click', () => advance());
section('reason').querySelector('[data-skip]').addEventListener('click', async () => {
  await chrome.storage.local.set({ reason: '' });
  advance(true);
});

$('reason').addEventListener('input', paintReason);
for (const chip of document.querySelectorAll('[data-example]')) {
  chip.addEventListener('click', () => {
    $('reason').value = chip.dataset.example;
    paintReason();
    $('preview').classList.remove('set');
    void $('preview').offsetWidth;
    $('preview').classList.add('set');
    $('reason').focus();
  });
}

const nudge = (d) => {
  cap = clampCap(cap + d);
  paintCap();
};
$('capDown').addEventListener('click', () => nudge(-1));
$('capUp').addEventListener('click', () => nudge(1));
$('schedOn').addEventListener('change', () => ($('schedTimes').hidden = !$('schedOn').checked));

$('clearAll').addEventListener('click', async () => {
  const tabs = await openTabs();
  await shelve(shelveOrder(tabs, tabs.length - cap));
  paintClear();
});

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const typing = e.target.matches('textarea, input[type="time"]');
  if (e.key === 'Enter' && !e.shiftKey && !e.target.matches('button')) {
    if (e.target.matches('input[type="time"]')) return;
    e.preventDefault();
    const go = section(step).querySelector('[data-go]:not([hidden])');
    go?.click();
  } else if (step === 'cap' && !typing && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault();
    nudge(e.key === 'ArrowLeft' ? -1 : 1);
  } else if (step === 'clear' && !typing && e.key.toLowerCase() === 'q' && !$('clearAll').hidden) {
    $('clearAll').click();
  }
});

const refresh = () => (step === 'cap' ? paintCap() : step === 'clear' ? paintClear() : null);
chrome.tabs.onRemoved.addListener(refresh);
chrome.tabs.onCreated.addListener(refresh);

async function init() {
  const s = await chrome.storage.local.get({
    onboarded: true,
    onboardStep: 'welcome',
    reason: '',
    cap: 7,
    rituals: { oneThing: false, shutdown: false },
    ...RULE_DEFAULTS
  });
  if (s.onboarded !== false) {
    location.replace(chrome.runtime.getURL('options/options.html'));
    return;
  }
  self = await chrome.tabs.getCurrent();
  cap = clampCap(s.cap);
  $('reason').value = s.reason;
  $('schedOn').checked = s.schedule.on;
  $('schedTimes').hidden = !s.schedule.on;
  $('schedStart').value = s.schedule.start;
  $('schedEnd').value = s.schedule.end;
  $('ritualOne').checked = s.rituals.oneThing;
  $('ritualShut').checked = s.rituals.shutdown;
  show(STEPS.includes(s.onboardStep) ? s.onboardStep : 'welcome');
}

init();
