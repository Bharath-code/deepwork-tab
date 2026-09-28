export const RULE_DEFAULTS = {
  exemptPinned: true,
  exemptDomains: [],
  schedule: { on: false, days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' }
};

export const MAX_DOMAINS = 10;

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

export function isExemptUrl(url, domains = []) {
  const h = hostOf(url);
  return !!h && domains.some((d) => h === d || h.endsWith(`.${d}`));
}

export function countedTabs(tabs, { exemptPinned = true, exemptDomains = [] } = {}) {
  return tabs.filter((t) => !(exemptPinned && t.pinned) && !isExemptUrl(t.pendingUrl || t.url, exemptDomains));
}

export function parseDomains(text) {
  const out = [];
  for (const raw of String(text).split(/[\s,]+/)) {
    const d = raw.trim().toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/[/?#:].*$/, '').replace(/^www\./, '');
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) && !out.includes(d)) out.push(d);
  }
  return out.slice(0, MAX_DOMAINS);
}

const toMins = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
};

// Off-hours → cap not enforced. Unparseable schedule fails safe: enforce.
export function inWorkHours(schedule, date = new Date()) {
  if (!schedule?.on) return true;
  const s = toMins(schedule.start);
  const e = toMins(schedule.end);
  const days = Array.isArray(schedule.days) ? schedule.days : [];
  if (!Number.isFinite(s) || !Number.isFinite(e) || s === e) return true;
  const now = date.getHours() * 60 + date.getMinutes();
  const day = date.getDay();
  if (s < e) return days.includes(day) && now >= s && now < e;
  // Overnight window (e.g. 22:00–02:00) belongs to the day it started.
  if (now >= s) return days.includes(day);
  if (now < e) return days.includes((day + 6) % 7);
  return false;
}

// ponytail: any edit to an active schedule counts as loosening; diff the
// windows only if people complain about the gate on harmless edits.
export function rulesLoosen(prev, next) {
  if (next.exemptPinned && !prev.exemptPinned) return true;
  if (next.exemptDomains.some((d) => !prev.exemptDomains.includes(d))) return true;
  return !!next.schedule.on && JSON.stringify(prev.schedule) !== JSON.stringify(next.schedule);
}
