const params = new URLSearchParams(location.search);
const target = params.get('target') || '';
const hasTarget = /^https?:\/\//i.test(target);

const $ = (id) => document.getElementById(id);
let acting = false;
let listShown = false;

function announce(msg) {
  $('status').textContent = msg;
}

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
    $('closeBtn').classList.add('primary');
    $('whereto').textContent =
      'Close one tab and you’re through — its address is saved to your queue.';
  }
  if (!enabled || tabs.length <= cap) passThrough();
}

async function logIntent() {
  const text = $('intent').value.trim();
  if (!text) return;
  const { intents = [] } = await chrome.storage.local.get('intents');
  intents.push({ text, url: target, ts: Date.now() });
  await chrome.storage.local.set({ intents: intents.slice(-500) });
  $('intent').value = '';
}

async function enqueue(url, title = url) {
  const { queue = [] } = await chrome.storage.local.get('queue');
  if (queue.some((q) => q.url === url)) return;
  queue.unshift({ url, title, ts: Date.now() });
  await chrome.storage.local.set({ queue: queue.slice(0, 200) });
  chrome.runtime.sendMessage({ type: 'fetchTitle', url }).catch(() => {});
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
  setTimeout(fn, 700);
}

async function queueIt() {
  if (acting || !hasTarget) return;
  acting = true;
  await logIntent();
  await enqueue(target);
  announce('Queued — saved to your queue');
  confirmThen($('queueBtn'), 'Queued ✓', closeSelf);
}

async function goBack() {
  if (acting) return;
  acting = true;
  await logIntent();
  if (hasTarget) {
    await enqueue(target);
    announce('Saved to your queue, just in case');
    confirmThen($('backBtn'), 'Saved it, just in case ✓', closeSelf);
  } else {
    closeSelf();
  }
}

function hideTabs() {
  $('tablist').hidden = true;
  $('closeBtn').hidden = false;
  listShown = false;
  document.querySelector('.actions').classList.remove('receded');
  $('closeBtn').focus();
}

async function showTabs() {
  if (acting || listShown) return;
  listShown = true;
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
    title.title = t.url;
    li.appendChild(title);
    const btn = document.createElement('button');
    btn.textContent = 'Close';
    btn.setAttribute('aria-label', `Close ${t.title || t.url}`);
    btn.addEventListener('click', async () => {
      if (acting) return;
      acting = true;
      btn.disabled = true;
      try {
        const saved = /^https?:\/\//i.test(t.url);
        if (saved) await enqueue(t.url, t.title || t.url);
        await chrome.tabs.remove(t.id);
        announce(saved ? 'Closed — its address is in your queue' : 'Closed');
        confirmThen(btn, 'Closed ✓', passThrough);
      } catch {
        acting = false;
        li.remove();
        announce('That tab was already closed — pick another');
      }
    });
    li.appendChild(btn);
    list.appendChild(li);
  }
  $('tablist').hidden = false;
  $('closeBtn').hidden = true;
  document.querySelector('.actions').classList.add('receded');
  announce(`${candidates.length} open tabs listed — pick one to close`);
  list.querySelector('button')?.focus();
}

function sortForClosing(tabs) {
  return tabs.sort((a, b) => (a.lastAccessed || 0) - (b.lastAccessed || 0));
}

$('queueBtn').addEventListener('click', queueIt);
$('backBtn').addEventListener('click', goBack);
$('closeBtn').addEventListener('click', showTabs);

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const typing = e.target === $('intent');
  if (e.key === 'Escape') {
    if (typing) {
      $('intent').blur();
    } else if (listShown) {
      hideTabs();
    } else {
      goBack();
    }
    return;
  }
  if (typing) {
    if (e.key === 'Enter' && hasTarget) queueIt();
    return;
  }
  if (e.key === 'Enter') {
    if (hasTarget && e.target.tagName !== 'BUTTON') queueIt();
    return;
  }
  const k = e.key.toLowerCase();
  if (k === 'q' && hasTarget) queueIt();
  if (k === 'c') showTabs();
});

init();
