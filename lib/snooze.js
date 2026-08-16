const hidden = (item, now) => item.snoozedUntil != null && item.snoozedUntil > now;

export const visibleItems = (queue, now = Date.now()) => queue.filter((i) => !hidden(i, now));

export function nextWake(queue, now = Date.now()) {
  const future = queue.filter((i) => hidden(i, now)).map((i) => i.snoozedUntil);
  return future.length ? Math.min(...future) : null;
}

export function snoozeTargets(now = Date.now()) {
  const at = (h) => {
    const d = new Date(now);
    d.setHours(h, 0, 0, 0);
    if (d.getTime() <= now) d.setDate(d.getDate() + 1);
    return d.getTime();
  };
  return [
    { label: 'In 3 hours', at: now + 3 * 3600000 },
    { label: 'Tonight', at: at(20) },
    { label: 'Tomorrow 9am', at: at(9) }
  ];
}
