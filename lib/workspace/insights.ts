export type InsightMetric = {
  period_start: string;
  net_position_pence: number;
  revenue_pence: number;
  expenses_pence: number;
  cash_pence?: number;
  burn_pence?: number;
};

export function buildInsights(metrics: InsightMetric[]): string[] {
  if (!metrics.length) return ['Add a period to generate workspace insights.'];
  const latest = metrics[0];
  const previous = metrics[1];
  const notes: string[] = [];

  if (latest.revenue_pence > 0) {
    const margin = Math.round(((latest.revenue_pence - latest.expenses_pence) / latest.revenue_pence) * 1000) / 10;
    notes.push(`Latest period margin is ${margin}%.`);
  }

  if (previous) {
    const delta = latest.net_position_pence - previous.net_position_pence;
    const direction = delta >= 0 ? 'up' : 'down';
    notes.push(`Net position is ${direction} £${Math.abs(delta / 100).toLocaleString('en-GB')} versus the prior period.`);
  }

  if (latest.expenses_pence > latest.revenue_pence) {
    notes.push('Expenses exceeded revenue in the latest period.');
  }

  if ((latest.burn_pence ?? 0) > 0 && (latest.cash_pence ?? 0) > 0) {
    const months = Math.round((latest.cash_pence! / latest.burn_pence!) * 10) / 10;
    notes.push(`Runway is about ${months} months at the current burn.`);
  }

  return notes.length ? notes : ['No material movement in the latest period.'];
}
