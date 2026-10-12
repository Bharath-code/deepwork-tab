export const STEPS = ['welcome', 'reason', 'cap', 'day', 'pin', 'clear'];
export const MIN_REASON = 12;
export const CAP_MAX = 20;

export const reasonReady = (text) => (text || '').trim().length >= MIN_REASON;

export function clampCap(n) {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.max(1, Math.min(CAP_MAX, v)) : 7;
}

export function nextStep(step, over) {
  if (step === 'pin') return over > 0 ? 'clear' : 'done';
  const i = STEPS.indexOf(step);
  return i < 0 || step === 'clear' ? 'done' : STEPS[i + 1];
}

export function stepLabel(step) {
  const i = STEPS.indexOf(step);
  return i >= 0 && i < 4 ? `Step ${i + 1} of 4` : '';
}

export function capNote(open, cap) {
  const over = open - cap;
  if (over > 0) return `You have ${open} open, ${over} over. Next we'll shelve them together. Nothing is lost.`;
  if (over === 0) return `You have ${open} open. Right at the line.`;
  return `You have ${open} open. ${-over} to spare.`;
}

export function shelveOrder(tabs, n) {
  return [...tabs]
    .filter((t) => !t.active)
    .sort((a, b) => (a.lastAccessed || 0) - (b.lastAccessed || 0))
    .slice(0, Math.max(0, n));
}
