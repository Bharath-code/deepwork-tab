const DAY_MS = 86_400_000;
const DAYS = 7;
const HEADROOM = 3;

/**
 * The cap in force today for someone who onboarded over their target.
 *
 * target    — the cap the user chose (e.g. 7)
 * stepDown  — { from, at } saved at onboarding: tab count then, and when; or null
 * now       — ms timestamp
 *
 * Must return an integer that is:
 *   - `target` when stepDown is null or from <= target
 *   - above `from` on day 0, so the next new tab isn't intercepted
 *   - never below `target`, never rising as days pass
 *   - `target` by day 7, so D14 measures the real cap, not the ramp
 */
export function stepDownCap(target, stepDown, now = Date.now()) {
  if (!stepDown || !(stepDown.from > target)) return target;
  // Whole days, so the cap changes once a day, never mid-session.
  const day = Math.max(0, Math.floor((now - stepDown.at) / DAY_MS));
  if (day >= DAYS) return target;
  const start = stepDown.from + HEADROOM;
  return target + Math.ceil(((start - target) * (DAYS - day)) / DAYS);
}

/** Whole days until stepDownCap reaches target; 0 if it already has. */
export function daysToTarget(target, stepDown) {
  if (!stepDown) return 0;
  for (let d = 0; d <= 365; d++) {
    if (stepDownCap(target, stepDown, stepDown.at + d * DAY_MS) <= target) return d;
  }
  return 365;
}
