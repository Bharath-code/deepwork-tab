import { RULE_DEFAULTS, countedTabs } from '../lib/rules.js';
import { queueAfterAdd, titleFor } from '../lib/queue.js';
import { dayOf, dayLine, laterAllowed, shelfGroup, cleanThing, LATER_MS } from '../lib/ritual.js';

const $ = (id) => document.getElementById(id);
const web = (url) => /^https?:\/\//i.test(url || '');
const CHIPS = 12;
let self = null;
let tabs = [];
let busy = false;

const domainOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

async function closeSelf() {
  const siblings = await chrome.tabs.query({ windowId: self.windowId });
  if (siblings.length > 1) chrome.tabs.remove(self.id);
  else chrome.tabs.update(self.id, { url: 'chrome://newtab/' });
}

async function finish(extra = {}) {
  const { ritual = {} } = await chrome.storage.local.get('ritual');
  await chrome.storage.local.set({ ritual: { ...ritual, ...extra } });
}

function chip(tab, i) {
  const li = document.createElement('li');
  li.style.transitionDelay = `${Math.min(i, CHIPS) * 30}ms`;
  const t = document.createElement('span');
  t.className = 't';
  t.textContent = titleFor(tab.url, tab.title);
  const d = document.createElement('span');
  d.className = 'd';
  d.textContent = domainOf(tab.url);
  li.append(t, d);
  return li;
}

function paintTabs() {
  const shelvable = tabs.filter((t) => web(t.url));
  $('tabsBox').hidden = shelvable.length === 0;
  $('tabsLead').textContent = `${shelvable.length} open. They go to your shelf, nothing is lost.`;
  const items = shelvable.slice(0, CHIPS).map(chip);
  if (shelvable.length > CHIPS) {
    const more = document.createElement('li');
    more.className = 'more';
    more.textContent = `+${shelvable.length - CHIPS} more`;
    items.push(more);
  }
  $('chips').replaceChildren(...items);
  $('go').firstChild.textContent = shelvable.length ? 'Shelve all and shut down ' : 'Shut down ';
}

async function shutDown() {
  if (busy) return;
  busy = true;
  const shelvable = tabs.filter((t, i) => web(t.url) && tabs.findIndex((u) => u.url === t.url) === i);
  const { queue = [] } = await chrome.storage.local.get('queue');
  const fresh = shelvable.filter((t) => !queue.some((q) => q.url === t.url));
  const group = shelfGroup(fresh.length);
  let next = queue;
  for (const t of [...fresh].reverse()) {
    next = queueAfterAdd(next, { url: t.url, title: titleFor(t.url, t.title), ts: Date.now(), group });
  }
  await chrome.storage.local.set({ queue: next });
  const lis = [...$('chips').children];
  lis.slice(0, CHIPS).forEach((li) => li.classList.add('gone'));
  const wait = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.min(lis.length, CHIPS) * 30 + 200;
  await new Promise((r) => setTimeout(r, wait));
  try {
    await chrome.tabs.remove(tabs.filter((t) => web(t.url)).map((t) => t.id));
  } catch {}
  const { weekLog = [], oneThing } = await chrome.storage.local.get(['weekLog', 'oneThing']);
  $('line').textContent = dayLine({ weekLog, oneThing });
  $('review').hidden = true;
  $('end').hidden = false;
  $('end').querySelector('h1').focus();
  $('status').textContent = 'Shutdown complete.';
}

async function init() {
  self = await chrome.tabs.getCurrent();
  const [all, s] = await Promise.all([
    chrome.tabs.query({ windowType: 'normal' }),
    chrome.storage.local.get({ oneThing: null, ritual: {}, ...RULE_DEFAULTS })
  ]);
  tabs = countedTabs(all, s).filter((t) => t.id !== self.id);
  const today = s.oneThing?.text && s.oneThing.day === dayOf();
  $('check').hidden = !today || s.oneThing.done;
  if (today) $('thing').textContent = s.oneThing.text;
  $('later').hidden = !laterAllowed(s.ritual);
  paintTabs();
  $('review').querySelector('h1').focus();
}

$('finished').addEventListener('click', async () => {
  const { oneThing } = await chrome.storage.local.get('oneThing');
  await chrome.storage.local.set({ oneThing: { ...oneThing, done: true } });
  $('check').hidden = true;
  $('status').textContent = 'Marked done.';
});
$('carry').addEventListener('click', async () => {
  const { oneThing } = await chrome.storage.local.get('oneThing');
  await finish({ carry: cleanThing(oneThing?.text) });
  $('check').hidden = true;
  $('status').textContent = 'Carried to tomorrow.';
});
$('go').addEventListener('click', shutDown);
$('leave').addEventListener('click', closeSelf);
$('close').addEventListener('click', closeSelf);
$('later').addEventListener('click', async () => {
  await finish({ shutdownShown: '', laterDay: dayOf(), laterUntil: Date.now() + LATER_MS });
  chrome.alarms.create('shutdown-later', { when: Date.now() + LATER_MS });
  closeSelf();
});

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Escape') closeSelf();
  else if (e.key === 'Enter' && !e.target.matches('button')) {
    e.preventDefault();
    if ($('end').hidden) shutDown();
    else closeSelf();
  }
});

init();
