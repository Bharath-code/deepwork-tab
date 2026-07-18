const params = new URLSearchParams(location.search);
const target = params.get('target') || '';
const hasTarget = target !== '' && !target.startsWith('chrome://');

const $ = (id) => document.getElementById(id);
let acting = false;

async function init() {
  const { cap, reason, enabled } = await chrome.storage.local.get({
    cap: 7,
    reason: '',
    enabled: true
  });
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  $('count').textContent = tabs.length;
  $('cap').textContent = cap;
  if (reason) {
    $('reason').textContent = `"${reason}"`;
    $('reason').hidden = false;
  }
  if (hasTarget) {
    $('targetUrl').textContent = target;
    $('targetRow').hidden = false;
  } else {
    $('queueBtn').hidden = true;
  }
  if (!enabled || tabs.length <= cap) passThrough();
}

async function logIntent() {
  const text = $('intent').value.trim();
  if (!text) return;
  const { intents = [] } = await chrome.storage.local.get('intents');
  intents.push({ text, url: target, ts: Date.now() });
  await chrome.storage.local.set({ intents: intents.slice(-500) });
}

async function closeSelf() {
  const tab = await chrome.tabs.getCurrent();
  chrome.tabs.remove(tab.id);
}

function passThrough() {
  if (hasTarget) {
    location.href = target;
  } else {
    closeSelf();
  }
}

function confirmThen(btn, label, fn) {
  btn.textContent = label;
  btn.classList.add('done');
  setTimeout(fn, 450);
}

async function queueIt() {
  if (acting || !hasTarget) return;
  acting = true;
  await logIntent();
  const { queue = [] } = await chrome.storage.local.get('queue');
  queue.unshift({ url: target, title: target, ts: Date.now() });
  await chrome.storage.local.set({ queue: queue.slice(0, 200) });
  chrome.runtime.sendMessage({ type: 'fetchTitle', url: target }).catch(() => {});
  confirmThen($('queueBtn'), 'Queued ✓', closeSelf);
}

async function goBack() {
  if (acting) return;
  acting = true;
  await logIntent();
  closeSelf();
}

async function showTabs() {
  if (acting) return;
  await logIntent();
  const me = await chrome.tabs.getCurrent();
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  const candidates = sortForClosing(tabs.filter((t) => t.id !== me.id));
  const list = $('tabs');
  list.replaceChildren();
  for (const t of candidates) {
    const li = document.createElement('li');
    if (t.favIconUrl && t.favIconUrl.startsWith('http')) {
      const img = document.createElement('img');
      img.src = t.favIconUrl;
      img.alt = '';
      li.appendChild(img);
    }
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = t.title || t.url;
    li.appendChild(title);
    const btn = document.createElement('button');
    btn.textContent = 'Close';
    btn.addEventListener('click', async () => {
      await chrome.tabs.remove(t.id);
      passThrough();
    });
    li.appendChild(btn);
    list.appendChild(li);
  }
  $('tablist').hidden = false;
  $('closeBtn').hidden = true;
  list.querySelector('button')?.focus();
}

function sortForClosing(tabs) {
  return tabs.sort((a, b) => (a.lastAccessed || 0) - (b.lastAccessed || 0));
}

$('queueBtn').addEventListener('click', queueIt);
$('backBtn').addEventListener('click', goBack);
$('closeBtn').addEventListener('click', showTabs);

document.addEventListener('keydown', (e) => {
  const typing = e.target === $('intent');
  if (e.key === 'Escape') {
    if (typing) {
      $('intent').blur();
    } else {
      goBack();
    }
    return;
  }
  if (typing) {
    if (e.key === 'Enter' && hasTarget) queueIt();
    return;
  }
  const k = e.key.toLowerCase();
  if (k === 'q' && hasTarget) queueIt();
  if (k === 'c') showTabs();
});

init();
