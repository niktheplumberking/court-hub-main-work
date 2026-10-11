/**
 * Tiny in-memory sliding-window limiter. The site runs as ONE Node process
 * (pm2 `courthub`), so process memory is the right scope; a restart simply
 * forgets the counters, which is harmless.
 *
 * Purpose: a starting checkout reserves real stock for ~30 minutes, so a bot
 * hammering /api/checkout could lock up the whole shop. Real shoppers never
 * get near the limit.
 */
const buckets = new Map<string, number[]>();
let lastSweep = Date.now();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  // Drop idle keys every few minutes so the map can't grow without bound.
  if (now - lastSweep > 5 * 60_000) {
    for (const [k, hits] of buckets) if (!hits.length || now - hits[hits.length - 1] > windowMs) buckets.delete(k);
    lastSweep = now;
  }
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

/** Client IP behind nginx (vps-setup.sh sets X-Real-IP). */
export function clientIp(req: Request): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}
