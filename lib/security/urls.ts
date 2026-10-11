/** Allow redirects only to the configured Astroiq origin. */
export function safeReturnUrl(candidate: string | null, baseUrl: string, fallback = '/dashboard'): string {
  if (!candidate) return new URL(fallback, baseUrl).toString();
  try {
    const base = new URL(baseUrl);
    const target = new URL(candidate, base);
    if (target.origin !== base.origin || (target.protocol !== 'https:' && target.protocol !== 'http:')) return new URL(fallback, base).toString();
    return target.toString();
  } catch { return new URL(fallback, baseUrl).toString(); }
}
