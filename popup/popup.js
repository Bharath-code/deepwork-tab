const $ = (id) => document.getElementById(id);
const WEEK_MS = 7 * 86400000;

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

/** Minimal weekly receipt from weekLog events (last 7 days). */
function weekSummary(weekLog = []) {
  const cutoff = Date.now() - WEEK_MS;
  const recent = weekLog.filter((e) => e.ts >= cutoff);
  let intercepts = 0;
  let queued = 0;
  const domains = {};
  for (const e of recent) {
    if (e.type === 'intercept') intercepts += 1;
    else if (e.type === 'queue') queued += 1;
    else continue;
    if (e.domain) domains[e.domain] = (domains[e.domain] || 0) + 1;
  }
  const [top = ''] = Object.entries(domains).sort((a, b) => b[1] - a[1])[0] || [];
  return { intercepts, queued, top };
}

function renderReceipt(weekLog) {
  const { intercepts, queued, top } = weekSummary(weekLog);
  const hasAny = intercepts > 0 || queued > 0;
  $('receipt').hidden = !hasAny;
  if (!hasAny) return;
  $('rIntercepts').textContent = intercepts;
  $('rQueued').textContent = queued;
  if (top) {
    $('rTop').textContent = top;
    $('rTopRow').hidden = false;
  } else {
    $('rTopRow').hidden = true;
  }
}

async function render() {
  const [{ cap, queue = [], streak, weekLog = [] }, tabs] = await Promise.all([
    chrome.storage.local.get({ cap: 7, queue: [], streak: null, weekLog: [] }),
    chrome.tabs.query({ windowType: 'normal' })
  ]);
  $('count').textContent = tabs.length;
  $('cap').textContent = cap;
  renderDots(tabs.length, cap);
  $('streak').textContent = streakText(streak);
  $('streak').hidden = !streak;
  renderReceipt(weekLog);

  const list = $('queue');
  list.replaceChildren();
  $('empty').hidden = queue.length > 0;

  queue.forEach((item, i) => {
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
    open.addEventListener('click', async () => {
      await removeAt(i);
      chrome.tabs.create({ url: item.url });
      window.close();
    });
    li.appendChild(open);

    const del = document.createElement('button');
    del.className = 'x';
    del.textContent = '✕';
    del.setAttribute('aria-label', 'Remove from queue');
    del.addEventListener('click', async () => {
      await removeAt(i);
      render();
    });
    li.appendChild(del);

    list.appendChild(li);
  });
}

async function removeAt(i) {
  const { queue = [] } = await chrome.storage.local.get('queue');
  queue.splice(i, 1);
  await chrome.storage.local.set({ queue });
}

$('settingsBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());

render();
