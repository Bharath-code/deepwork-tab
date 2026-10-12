import { cleanThing, dayOf, ONE_THING_MAX } from '../lib/ritual.js';

const $ = (id) => document.getElementById(id);
const target = new URLSearchParams(location.search).get('target') || '';
const hour = new Date().getHours();
document.documentElement.dataset.phase = hour >= 5 && hour < 10 ? 'dawn' : hour < 16 && hour >= 10 ? 'day' : hour >= 16 && hour < 20 ? 'dusk' : 'night';
let leaving = false;

async function leave(delay = 0) {
  if (leaving) return;
  leaving = true;
  if (delay) await new Promise((r) => setTimeout(r, delay));
  let url = /^https?:\/\//i.test(target) ? target : 'chrome://newtab/';
  try {
    ({ url } = await chrome.runtime.sendMessage({ type: 'afterRitual', target }));
  } catch {}
  location.replace(url);
}

function paintCount() {
  const left = ONE_THING_MAX - $('thing').value.length;
  $('count').textContent = left < 30 ? `${left}` : '';
  $('thing').style.height = 'auto';
  $('thing').style.height = `${$('thing').scrollHeight}px`;
}

async function save() {
  const text = cleanThing($('thing').value);
  if (!text) {
    $('status').textContent = 'Write one thing, or press Escape to skip today.';
    $('thing').focus();
    return;
  }
  const { ritual = {} } = await chrome.storage.local.get('ritual');
  await chrome.storage.local.set({ oneThing: { day: dayOf(), text }, ritual: { ...ritual, carry: '' } });
  $('saved').textContent = text;
  $('saved').classList.add('racked');
  $('ask').hidden = true;
  $('done').hidden = false;
  $('status').textContent = 'Saved for today.';
  leave(matchMedia('(prefers-reduced-motion: reduce)').matches ? 700 : 1100);
}

$('save').addEventListener('click', save);
$('skip').addEventListener('click', () => leave());
$('thing').addEventListener('input', paintCount);
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Enter' && !e.shiftKey && !e.target.matches('button')) {
    e.preventDefault();
    save();
  } else if (e.key === 'Escape') {
    leave();
  }
});

(async () => {
  const { ritual = {} } = await chrome.storage.local.get('ritual');
  if (ritual.carry) {
    $('thing').value = ritual.carry;
    $('carried').hidden = false;
  }
  paintCount();
  $('thing').focus();
  $('thing').select();
})();
