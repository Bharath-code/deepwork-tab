export const BREATH_SECONDS = 60;
export const INHALE = 4;
export const CYCLE = 10;

export const breathCaption = (left) =>
  left <= 0 ? 'Change applied' : (BREATH_SECONDS - left) % CYCLE < INHALE ? 'Breathe in' : 'Breathe out';

export const breathClock = (left) => {
  const s = Math.max(0, left);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export const announceAt = (left) => left > 0 && left < BREATH_SECONDS && left % 15 === 0;

export function describeChange(prev, next) {
  if (!next.enabled && prev.enabled) return 'Turning enforcement off.';
  if (next.cap > prev.cap) return `Raising your cap from ${prev.cap} to ${next.cap}.`;
  return 'Loosening what counts toward your cap.';
}
