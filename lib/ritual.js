import { inWorkHours } from './rules.js';

export const GRACE_MS = 2 * 3600000;
export const LATER_MS = 30 * 60000;
export const ONE_THING_MAX = 140;

const pad = (n) => String(n).padStart(2, '0');

export const dayOf = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const cleanThing = (text) => String(text || '').replace(/\s+/g, ' ').trim().slice(0, ONE_THING_MAX);

export function oneThingDue({ rituals, ritual, schedule, now = Date.now() }) {
  const d = new Date(now);
  return !!rituals?.oneThing && ritual?.oneThingAsked !== dayOf(d) && inWorkHours(schedule, d);
}

const endOn = (schedule, d) => {
  const [h, m] = String(schedule.end).split(':').map(Number);
  const at = new Date(d);
  at.setHours(h, m, 0, 0);
  return at.getTime();
};

// ponytail: overnight windows (start > end) have no shutdown; add when asked.
const usable = (schedule) => {
  if (!schedule?.on || !Array.isArray(schedule.days)) return false;
  const [sh, sm] = String(schedule.start).split(':').map(Number);
  const [eh, em] = String(schedule.end).split(':').map(Number);
  return [sh, sm, eh, em].every(Number.isFinite) && sh * 60 + sm < eh * 60 + em;
};

export function nextShutdownAt(schedule, now = Date.now()) {
  if (!usable(schedule)) return null;
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    if (!schedule.days.includes(d.getDay())) continue;
    const at = endOn(schedule, d);
    if (at > now) return at;
  }
  return null;
}

export function shutdownDue({ rituals, ritual, schedule, now = Date.now() }) {
  if (!rituals?.shutdown || !usable(schedule)) return false;
  const d = new Date(now);
  if (ritual?.shutdownShown === dayOf(d) || (ritual?.laterUntil ?? 0) > now) return false;
  if (!schedule.days.includes(d.getDay())) return false;
  const age = now - endOn(schedule, d);
  return age >= 0 && age <= GRACE_MS;
}

export const laterAllowed = (ritual, now = Date.now()) => ritual?.laterDay !== dayOf(new Date(now));

export function shelfGroup(count, now = Date.now()) {
  const label = new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${label} · ${count} tab${count === 1 ? '' : 's'}`;
}

export function dayLine({ weekLog = [], oneThing, now = Date.now() }) {
  const d = new Date(now);
  const start = new Date(d).setHours(0, 0, 0, 0);
  const held = weekLog.filter((e) => e?.type === 'intercept' && e.ts >= start).length;
  const parts = [];
  if (held) parts.push(`${held} intercept${held === 1 ? '' : 's'} held`);
  if (oneThing?.day === dayOf(d) && oneThing.done) parts.push('1 thing finished');
  return parts.join(' · ') || 'A quiet day.';
}
