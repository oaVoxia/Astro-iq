/** Placeholder interface for a production distributed rate limiter (e.g. Cloudflare rate limiting).
 * Do not use an in-memory Map as a production limiter in horizontally distributed Workers. */
export function rateLimitConfiguration(route: string) {
  const limits: Record<string, { requests: number; windowSeconds: number }> = {
    checkout: { requests: 8, windowSeconds: 60 },
    auth: { requests: 10, windowSeconds: 60 },
  };
  return limits[route] ?? { requests: 60, windowSeconds: 60 };
}
