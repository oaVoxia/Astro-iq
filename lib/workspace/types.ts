export type Workspace = {
  id: string;
  user_id: string;
  name: string;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type Metric = {
  id: string;
  workspace_id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  net_position_pence: number;
  revenue_pence: number;
  expenses_pence: number;
  cash_pence: number;
  burn_pence: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type MetricInput = {
  period_start: string;
  period_end: string;
  net_position_pence: number;
  revenue_pence?: number;
  expenses_pence?: number;
  cash_pence?: number;
  burn_pence?: number;
  notes?: string | null;
};

export function runwayMonths(cashPence: number, burnPence: number): number | null {
  if (burnPence <= 0) return null;
  return Math.round((cashPence / burnPence) * 10) / 10;
}

export function operatingMargin(revenuePence: number, expensesPence: number): number | null {
  if (revenuePence <= 0) return null;
  return Math.round(((revenuePence - expensesPence) / revenuePence) * 1000) / 10;
}
