(() => {
  const now = Date.now();
  const H = 3600000;
  const tab = (id, url, title, extra = {}) => ({ id, url, title, windowId: 1, lastAccessed: now - id * H, ...extra });
  const tabs = [
    tab(1, location.href, document.title, { active: true }),
    tab(2, 'https://github.com/Bharath-code/deepwork-tab/pull/22', 'P6 brand by Bharath-code · Pull Request #22'),
    tab(3, 'https://developer.chrome.com/docs/extensions/reference/api/tabs', 'chrome.tabs | API | Chrome for Developers'),
    tab(4, 'https://news.ycombinator.com/', 'Hacker News'),
    tab(5, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Lo-fi beats to focus to'),
    tab(6, 'https://docs.google.com/document/d/1/edit', 'Launch post draft'),
    tab(7, 'https://mail.google.com/mail/u/0/', 'Inbox (3)'),
    tab(8, 'https://stackoverflow.com/questions/1', 'How do service workers stay alive in MV3?'),
    tab(9, 'https://en.wikipedia.org/wiki/Attention_residue', 'Attention residue')
  ];
  const ev = (type, hoursAgo, extra = {}) => ({ type, ts: now - hoursAgo * H, ...extra });
  const state = {
    cap: 7, enabled: true, onboarded: true, pro: false,
    reason: "I'm someone who ships first and browses after.",
    streak: { startDay: new Date(now - 11 * 24 * H).toLocaleDateString('sv'), longest: 12 },
    queue: [
      { url: 'https://www.youtube.com/watch?v=abc', title: 'How Linear builds product', ts: now - 2 * H, note: 'for the launch post' },
      { url: 'https://news.ycombinator.com/item?id=1', title: 'Show HN: a tab cap for Chrome', ts: now - 26 * H },
      { url: 'https://arxiv.org/abs/2213.114', title: 'Nudging phone use with a pause', ts: now - 9 * 24 * H }
    ],
    weekLog: [
      ev('intercept', 1, { domain: 'youtube.com' }), ev('outcome', 1, { value: 'queued' }), ev('queue', 1, { domain: 'youtube.com' }),
      ev('intercept', 5, { domain: 'news.ycombinator.com' }), ev('outcome', 5, { value: 'back' }),
      ev('intercept', 28, { domain: 'youtube.com' }), ev('feeling', 28, { value: 'stuck' }), ev('queue', 28, { domain: 'youtube.com' }),
      ev('intercept', 50, { domain: 'twitter.com' }), ev('loosen', 49.95), ev('intercept', 75, { domain: 'youtube.com' }), ev('feeling', 75, { value: 'stuck' })
    ],
    ...JSON.parse(new URLSearchParams(location.search).get('s') || '{}')
  };
  const listener = { addListener() {}, removeListener() {} };
  const get = async (keys) => {
    if (keys == null) return { ...state };
    if (typeof keys === 'string') keys = [keys];
    if (Array.isArray(keys)) return Object.fromEntries(keys.filter((k) => k in state).map((k) => [k, state[k]]));
    return Object.fromEntries(Object.keys(keys).map((k) => [k, k in state ? state[k] : keys[k]]));
  };
  const api = {
    storage: {
      local: {
        get,
        set: async (o) => void Object.assign(state, JSON.parse(JSON.stringify(o))),
        remove: async (k) => void [].concat(k).forEach((x) => delete state[x])
      },
      onChanged: listener
    },
    runtime: { getURL: (p) => `${location.origin}/${p}`, sendMessage: async () => ({ url: 'about:blank' }), onMessage: listener, id: 'preview' },
    tabs: {
      query: async () => tabs,
      getCurrent: async () => tabs[0],
      remove: async (ids) => void [].concat(ids).forEach((id) => tabs.splice(tabs.findIndex((t) => t.id === id), 1)),
      update: async () => {}, create: async () => {},
      onRemoved: listener, onCreated: listener, onUpdated: listener
    },
    action: { getUserSettings: async () => ({ isOnToolbar: false }) },
    permissions: { contains: async () => false, request: async () => false },
    windows: { getAll: async () => [] }
  };
  window.chrome = api;
  window.__state = state;
})();
