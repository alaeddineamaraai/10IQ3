// Simple per-key sliding-window rate limiter backed by an in-process Map.
// Resets on cold starts — acceptable for a small deployment.
// Replace with Upstash/Redis for multi-region or high-traffic scenarios.

const windows = new Map<string, { count: number; start: number }>();

/**
 * Returns true if the request is allowed, false if the limit is exceeded.
 * @param key       Unique key (e.g. `ai-draft:${userId}`)
 * @param max       Max requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const w = windows.get(key);

  if (!w || now - w.start > windowMs) {
    windows.set(key, { count: 1, start: now });
    return true;
  }

  if (w.count >= max) return false;
  w.count++;
  return true;
}
