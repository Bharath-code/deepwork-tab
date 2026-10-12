import { dayOf } from './ritual.js';

const DAY = 86400000;
const dayMs = (s) => Date.parse(s);
const addDays = (s, n) => dayOf(new Date(dayMs(s) + n * DAY + 12 * 3600000));

export const FEELINGS = ['bored', 'stuck', 'anxious', 'tired', 'curious'];
export const REOFFER_MS = 10 * 60000;
export const STALE_DAYS = 7;
export const EASE_START = 15;

export const streakDays = (streak, today = dayOf()) =>
  streak?.startDay ? Math.floor((dayMs(today) - dayMs(streak.startDay)) / DAY) + 1 : 0;

export function loosened(streak, today = dayOf()) {
  const base = streak || { startDay: today, longest: 0 };
  if (base.missDay === today) return base;
  if (base.missDay === addDays(today, -1)) {
    return { startDay: today, longest: Math.max(base.longest || 0, streakDays(base, today)) };
  }
  return { ...base, missDay: today };
}

export const missedYesterday = (streak, today = dayOf()) => !!streak && streak.missDay === addDays(today, -1);

export function phase(days) {
  if (days >= 66) return 'Automatic';
  if (days >= 46) return 'Becoming automatic';
  if (days >= 22) return 'Settling';
  return days >= 1 ? 'Building' : '';
}

export function topFeeling(weekLog = [], now = Date.now()) {
  const counts = {};
  for (const e of weekLog) {
    if (e?.type === 'feeling' && e.ts >= now - 7 * DAY && FEELINGS.includes(e.value)) counts[e.value] = (counts[e.value] || 0) + 1;
  }
  const [top] = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return top ? { value: top[0], count: top[1] } : null;
}

export const reofferDue = (queue = [], now = Date.now()) => queue.find((i) => i.remindAt != null && i.remindAt <= now) || null;

export const frogCollapsed = ({ oneThing, now = Date.now() }) => {
  const d = new Date(now);
  return !!oneThing?.text && oneThing.day === dayOf(d) && !oneThing.done && d.getHours() < 12;
};

export function easeCap({ from, to, start }, today = dayOf()) {
  const elapsed = Math.max(0, Math.round((dayMs(today) - dayMs(start)) / DAY));
  return Math.max(to, from - elapsed);
}

export const easeOffer = (open, cap) => cap < EASE_START && open - cap >= 4;

export const isStale = (item, now = Date.now()) => now - (item.ts || now) > STALE_DAYS * DAY;

export const triageItems = (queue = [], now = Date.now()) =>
  queue.filter((i) => isStale(i, now)).sort((a, b) => a.ts - b.ts).slice(0, 10);
