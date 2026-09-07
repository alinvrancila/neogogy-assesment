/**
 * A throttle held in memory.
 *
 * The app runs as a single node process behind nginx, so one map is the whole
 * picture. It restarts empty, which is the right failure: a restart is rare and
 * losing the counters costs less than refusing a person their own link, or
 * locking an administrator out of their own dashboard.
 *
 * Used for two unrelated jobs, which is why it lives on its own: bounding how
 * often a report link can be mailed or guessed at, and bounding how often a
 * password can be tried.
 */
type Window = { count: number; resetAt: number };
const windows = new Map<string, Window>();

const HOUR = 60 * 60 * 1000;

/** Keep the map from growing without bound on a long lived process. */
function sweep(now: number) {
  if (windows.size < 5000) return;
  for (const [key, w] of windows) if (w.resetAt <= now) windows.delete(key);
}

/** Spend one from a budget. False once it is empty. */
export function allow(key: string, limit: number, windowMs = HOUR, now = Date.now()): boolean {
  sweep(now);
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

/** Read a budget without spending from it. */
export function peek(key: string, limit: number, now = Date.now()): boolean {
  const current = windows.get(key);
  if (!current || current.resetAt <= now) return true;
  return current.count < limit;
}

/** Test seam: the counters are process state, and a suite needs them clean. */
export function resetThrottles() {
  windows.clear();
}
