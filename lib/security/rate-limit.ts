/** Placeholder interface for a production distributed rate limiter (e.g. Cloudflare rate limiting).
 * Do not use an in-memory Map as a production limiter in horizontally distributed Workers. */
export function rateLimitConfiguration(route: string) {
  const limits: Record<string, { requests: number; windowSeconds: number }> = {
    checkout: { requests: 8, windowSeconds: 60 },
    auth: { requests: 10, windowSeconds: 60 },
    metrics: { requests: 30, windowSeconds: 60 },
    notes: { requests: 20, windowSeconds: 60 },
  };
  return limits[route] ?? { requests: 60, windowSeconds: 60 };
}

const hits = new Map<string, { count: number; reset: number }>();

export function isRateLimited(route: string, userId: string): boolean {
  const { requests, windowSeconds } = rateLimitConfiguration(route);
  const now = Date.now();
  const key = `${route}:${userId}`;
  const entry = hits.get(key);
  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + windowSeconds * 1000 });
    return false;
  }
  if (entry.count >= requests) return true;
  entry.count += 1;
  return false;
}
