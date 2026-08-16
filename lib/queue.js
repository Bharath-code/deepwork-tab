export function queueAfterAdd(queue, item, max = 200) {
  if (!Array.isArray(queue) || !item?.url) return queue;
  if (queue.some((q) => q.url === item.url)) return queue;
  return [item, ...queue].slice(0, max);
}

export function titleFor(url, title) {
  if (title && title !== url) return title;
  try {
    return new URL(url).hostname.replace(/^www\./, '') || url;
  } catch {
    return url;
  }
}

export function restoreAction({ cap, tabCount, queuedUrl, openUrls }) {
  if (queuedUrl && Array.isArray(openUrls) && openUrls.includes(queuedUrl)) {
    return { action: 'focus' };
  }
  if (tabCount < cap) return { action: 'open' };
  return { action: 'swap' };
}

export function queueCurrentPlan({ tabCount, url, interceptBase }) {
  if (!url) return { action: 'noop' };
  if (url.startsWith('chrome:') || url.startsWith('edge:') || url.startsWith('about:')) {
    return { action: 'noop' };
  }
  if (interceptBase && url.startsWith(interceptBase)) return { action: 'noop' };
  if (tabCount <= 1) return { action: 'enqueue-keep' };
  return { action: 'enqueue-close' };
}
