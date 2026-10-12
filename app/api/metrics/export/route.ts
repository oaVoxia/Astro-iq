import { isAuthError, requireUser } from '@/lib/api/context';
import { assertActiveAccess } from '@/lib/workspace/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function cell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  const ctx = await requireUser();
  if (isAuthError(ctx)) return ctx;

  const access = await assertActiveAccess(ctx.supabase, ctx.user.id);
  if (!access.ok) return new Response(access.error, { status: access.status });

  const { data, error } = await ctx.supabase
    .from('metrics')
    .select('period_start,period_end,net_position_pence,revenue_pence,expenses_pence,cash_pence,burn_pence,notes')
    .eq('user_id', ctx.user.id)
    .order('period_start', { ascending: false })
    .limit(200);

  if (error) return new Response('Unable to export metrics.', { status: 500 });

  const header = 'period_start,period_end,net_gbp,revenue_gbp,expenses_gbp,cash_gbp,burn_gbp,notes';
  const rows = (data ?? []).map(row => [
    row.period_start,
    row.period_end,
    (row.net_position_pence / 100).toFixed(2),
    (row.revenue_pence / 100).toFixed(2),
    (row.expenses_pence / 100).toFixed(2),
    (row.cash_pence / 100).toFixed(2),
    (row.burn_pence / 100).toFixed(2),
    row.notes ?? '',
  ].map(cell).join(','));

  return new Response([header, ...rows].join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="astroiq-metrics.csv"',
    },
  });
}
