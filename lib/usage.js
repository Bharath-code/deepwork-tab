import { dayOf } from './ritual.js';
import { FEELINGS } from './habit.js';

export const HOLD_WINDOW_MS = 600000;
export const DAYS_KEPT = 400;
export const OUTCOMES = ['queued', 'back', 'swapped'];
const PLAIN = ['intercept', 'queue', 'loosen'];

export const shouldPing = ({ telemetry, installId, lastPing }, day) =>
  telemetry === 'yes' && !!installId && lastPing !== day;

export function lostIntercepts(log = [], windowMs = HOLD_WINDOW_MS) {
  const open = [];
  let lost = 0;
  for (const e of [...log].sort((a, b) => a.ts - b.ts)) {
    if (e.type === 'intercept') open.push(e.ts);
    else if (e.type === 'loosen' && open.length && e.ts - open[open.length - 1] < windowMs) {
      open.pop();
      lost += 1;
    }
  }
  return lost;
}

export function heldMoments(weekLog = [], windowMs = HOLD_WINDOW_MS) {
  const log = Array.isArray(weekLog) ? weekLog : [];
  const intercepts = log.filter((e) => e?.type === 'intercept').length;
  const held = intercepts - lostIntercepts(log, windowMs);
  return { intercepts, held, holdRate: intercepts ? held / intercepts : null };
}

export function eventKey({ type, value } = {}) {
  if (PLAIN.includes(type)) return type;
  if (type === 'outcome' && OUTCOMES.includes(value)) return value;
  if (type === 'feeling' && FEELINGS.includes(value)) return `feel_${value}`;
  return '';
}

export function rollup(days = {}, event, lostDelta = 0, kept = DAYS_KEPT) {
  const key = eventKey(event);
  if (!key) return days;
  const day = dayOf(new Date(event.ts));
  const d = { ...days[day], [key]: (days[day]?.[key] || 0) + 1 };
  if (lostDelta > 0) d.lost = (d.lost || 0) + lostDelta;
  const out = { ...days, [day]: d };
  for (const old of Object.keys(out).sort().slice(0, -kept)) delete out[old];
  return out;
}
