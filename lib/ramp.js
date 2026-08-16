const STEPS = [0, 0, 3000, 6000, 10000];

export function interceptsFor(weekLog, domain, now = Date.now(), windowMs = 86_400_000) {
  if (!Array.isArray(weekLog) || !domain) return 0;
  const cutoff = now - windowMs;
  return weekLog.filter((e) => e.type === 'intercept' && e.domain === domain && e.ts >= cutoff).length;
}

export const rampDelayMs = (count) => STEPS[Math.min(count, STEPS.length - 1)];
