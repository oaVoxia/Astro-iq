export type Entitlement = { status: string; starts_at: string; expires_at: string };
/** Access is allowed only for a verified, active entitlement inside its UTC interval. */
export function hasActiveEntitlement(rows: Entitlement[] | null | undefined, now = new Date()): boolean {
  const timestamp = now.getTime();
  return (rows ?? []).some((row) => row.status === 'active' &&
    Number.isFinite(Date.parse(row.starts_at)) && Number.isFinite(Date.parse(row.expires_at)) &&
    Date.parse(row.starts_at) <= timestamp && Date.parse(row.expires_at) > timestamp);
}
export function addUtcDays(start: Date, days: number): Date {
  if (!Number.isInteger(days) || days < 1 || days > 365) throw new RangeError('days must be an integer from 1 to 365');
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}
