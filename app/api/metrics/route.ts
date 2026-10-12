import { isAuthError, requireUser } from '@/lib/api/context';
import { fail, ok } from '@/lib/api/json';
import { isRateLimited } from '@/lib/security/rate-limit';
import { assertActiveAccess, getWorkspace } from '@/lib/workspace/access';
import { operatingMargin, runwayMonths } from '@/lib/workspace/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isPence(value: unknown, allowNegative = false): value is number {
  return typeof value === 'number' && Number.isInteger(value) && (allowNegative || value >= 0) && Math.abs(value) <= 1_000_000_000_000;
}

export async function GET() {
  const ctx = await requireUser();
  if (isAuthError(ctx)) return ctx;

  const access = await assertActiveAccess(ctx.supabase, ctx.user.id);
  if (!access.ok) return fail(access.error, access.status);

  const { data, error } = await ctx.supabase
    .from('metrics')
    .select('id,period_start,period_end,net_position_pence,revenue_pence,expenses_pence,cash_pence,burn_pence,notes,created_at')
    .eq('user_id', ctx.user.id)
    .order('period_start', { ascending: false })
    .limit(24);

  if (error) return fail('Unable to load metrics.', 500);

  const latest = data?.[0] ?? null;
  const summary = latest
    ? {
        netPositionPence: latest.net_position_pence,
        marginPct: operatingMargin(latest.revenue_pence, latest.expenses_pence),
        runwayMonths: runwayMonths(latest.cash_pence, latest.burn_pence),
      }
    : null;

  return ok({ metrics: data ?? [], summary });
}

export async function POST(request: Request) {
  const ctx = await requireUser();
  if (isAuthError(ctx)) return ctx;
  if (isRateLimited('metrics', ctx.user.id)) return fail('Too many metric writes. Try again shortly.', 429);

  const access = await assertActiveAccess(ctx.supabase, ctx.user.id);
  if (!access.ok) return fail(access.error, access.status);

  const workspace = await getWorkspace(ctx.supabase, ctx.user.id);
  if (!workspace.ok) return fail(workspace.error, 404);

  const body = await request.json().catch(() => ({}));
  if (!isDate(body.period_start) || !isDate(body.period_end) || body.period_end < body.period_start) {
    return fail('Valid period_start and period_end are required.', 400);
  }
  if (!isPence(body.net_position_pence, true)) return fail('net_position_pence must be an integer.', 400);
  if (body.revenue_pence != null && !isPence(body.revenue_pence)) return fail('revenue_pence must be a non-negative integer.', 400);
  if (body.expenses_pence != null && !isPence(body.expenses_pence)) return fail('expenses_pence must be a non-negative integer.', 400);
  if (body.cash_pence != null && !isPence(body.cash_pence, true)) return fail('cash_pence must be an integer.', 400);
  if (body.burn_pence != null && !isPence(body.burn_pence)) return fail('burn_pence must be a non-negative integer.', 400);
  if (body.notes != null && (typeof body.notes !== 'string' || body.notes.length > 500)) {
    return fail('Notes must be 500 characters or fewer.', 400);
  }

  const { data, error } = await ctx.supabase
    .from('metrics')
    .upsert({
      workspace_id: workspace.workspace.id,
      user_id: ctx.user.id,
      period_start: body.period_start,
      period_end: body.period_end,
      net_position_pence: body.net_position_pence,
      revenue_pence: body.revenue_pence ?? 0,
      expenses_pence: body.expenses_pence ?? 0,
      cash_pence: body.cash_pence ?? 0,
      burn_pence: body.burn_pence ?? 0,
      notes: body.notes ?? null,
    }, { onConflict: 'workspace_id,period_start' })
    .select('id,period_start,period_end,net_position_pence,revenue_pence,expenses_pence,cash_pence,burn_pence,notes')
    .single();

  if (error || !data) return fail('Unable to save metric.', 500);
  return ok({ metric: data }, 201);
}
