const DAY_MS = 86400000;
const WEEK_MS = 7 * DAY_MS;

const recentOf = (weekLog, now) =>
  Array.isArray(weekLog) ? weekLog.filter((e) => e && e.ts >= now - WEEK_MS) : [];

export function weekSummary(weekLog = [], now = Date.now()) {
  let intercepts = 0;
  let queued = 0;
  const domains = {};
  for (const e of recentOf(weekLog, now)) {
    if (e.type === 'intercept') intercepts += 1;
    else if (e.type === 'queue') queued += 1;
    else continue;
    if (e.domain) domains[e.domain] = (domains[e.domain] || 0) + 1;
  }
  const [top = ''] = Object.entries(domains).sort((a, b) => b[1] - a[1])[0] || [];
  return { intercepts, queued, top };
}

export function fullSummary(weekLog = [], now = Date.now()) {
  const base = weekSummary(weekLog, now);
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const byDay = new Array(7).fill(0);
  const domains = {};
  for (const e of recentOf(weekLog, now)) {
    if (e.type !== 'intercept') continue;
    const idx = 6 - Math.round((startOfToday - new Date(e.ts).setHours(0, 0, 0, 0)) / DAY_MS);
    if (idx >= 0 && idx < 7) byDay[idx] += 1;
    if (e.domain) domains[e.domain] = (domains[e.domain] || 0) + 1;
  }
  const topDomains = Object.entries(domains)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([domain, count]) => ({ domain, count }));
  const queueRate = base.intercepts ? Math.round((base.queued / base.intercepts) * 100) : 0;
  return { ...base, byDay, topDomains, queueRate };
}

export const SHARE_URL = 'https://deepwork-tab.kumarbharath63.workers.dev/?ref=receipt';

// Only the user's own numbers, only lines worth posting. Nothing is sent anywhere.
export function shareText({ intercepts, queued, top }, streakDays = 0, url = SHARE_URL) {
  if (!intercepts && !queued) return '';
  const lines = ['My browser this week, with a tab cap:'];
  if (intercepts) lines.push(`· ${intercepts} tab${intercepts === 1 ? '' : 's'} stopped at the cap`);
  if (queued) lines.push(`· ${queued} queued for later instead of opened`);
  if (top) lines.push(`· Top distraction: ${top}`);
  if (streakDays >= 2) lines.push(`· Day ${streakDays} under the cap`);
  lines.push('', `DeepWork Tab: ${url}`);
  return lines.join('\n');
}
