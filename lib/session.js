const isFiniteNumber = (n) => typeof n === 'number' && Number.isFinite(n);

export function sessionState(session, now = Date.now()) {
  if (!session || !isFiniteNumber(session.endsAt) || session.endsAt <= now) {
    return { active: false, remainingMs: 0 };
  }
  return { active: true, remainingMs: session.endsAt - now };
}

export function effectiveCap(cap, session, now = Date.now()) {
  const { active } = sessionState(session, now);
  if (!active || !isFiniteNumber(session.cap)) return cap;
  return Math.min(cap, session.cap);
}

export function formatRemaining(ms) {
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'less than a minute';
  return `${m} minute${m === 1 ? '' : 's'}`;
}
