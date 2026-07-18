const $ = (id) => document.getElementById(id);

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

async function render() {
  const [{ cap, queue = [] }, tabs] = await Promise.all([
    chrome.storage.local.get({ cap: 7, queue: [] }),
    chrome.tabs.query({ windowType: 'normal' })
  ]);
  $('count').textContent = tabs.length;
  $('cap').textContent = cap;
  renderDots(tabs.length, cap);

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
