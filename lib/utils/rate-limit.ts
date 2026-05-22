/**
 * Rate limiter in-memory simples (token bucket).
 * Adequado pra Vercel: cada lambda warm tem seu próprio counter, então é "best effort"
 * — não previne abuse coordenado, mas cobre 95% dos casos.
 *
 * Para rate limit forte usar Upstash Redis em F2.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests: number, windowSeconds: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    cleanup();
    return true;
  }

  if (bucket.count >= maxRequests) {
    return false;
  }

  bucket.count++;
  return true;
}

let lastCleanup = 0;
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return; // a cada 60s no max
  lastCleanup = now;
  for (const [k, v] of buckets) {
    if (v.resetAt < now) buckets.delete(k);
  }
}
