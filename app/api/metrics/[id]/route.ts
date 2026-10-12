import { isAuthError, requireUser } from '@/lib/api/context';
import { fail, ok } from '@/lib/api/json';
import { isRateLimited } from '@/lib/security/rate-limit';
import { assertActiveAccess } from '@/lib/workspace/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isPence(value: unknown, allowNegative = false): value is number {
  return typeof value === 'number' && Number.isInteger(value) && (allowNegative || value >= 0) && Math.abs(value) <= 1_000_000_000_000;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUser();
  if (isAuthError(ctx)) return ctx;
  if (isRateLimited('metrics', ctx.user.id)) return fail('Too many metric writes. Try again shortly.', 429);

  const access = await assertActiveAccess(ctx.supabase, ctx.user.id);
  if (!access.ok) return fail(access.error, access.status);

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if (body.net_position_pence != null) {
    if (!isPence(body.net_position_pence, true)) return fail('net_position_pence must be an integer.', 400);
    patch.net_position_pence = body.net_position_pence;
  }
  if (body.revenue_pence != null) {
    if (!isPence(body.revenue_pence)) return fail('revenue_pence must be a non-negative integer.', 400);
    patch.revenue_pence = body.revenue_pence;
  }
  if (body.expenses_pence != null) {
    if (!isPence(body.expenses_pence)) return fail('expenses_pence must be a non-negative integer.', 400);
    patch.expenses_pence = body.expenses_pence;
  }
  if (body.cash_pence != null) {
    if (!isPence(body.cash_pence, true)) return fail('cash_pence must be an integer.', 400);
    patch.cash_pence = body.cash_pence;
  }
  if (body.burn_pence != null) {
    if (!isPence(body.burn_pence)) return fail('burn_pence must be a non-negative integer.', 400);
    patch.burn_pence = body.burn_pence;
  }
  if (body.notes != null) {
    if (typeof body.notes !== 'string' || body.notes.length > 500) return fail('Notes must be 500 characters or fewer.', 400);
    patch.notes = body.notes;
  }
  if (!Object.keys(patch).length) return fail('No valid fields to update.', 400);

  const { data, error } = await ctx.supabase
    .from('metrics')
    .update(patch)
    .eq('id', id)
    .eq('user_id', ctx.user.id)
    .select('id,period_start,period_end,net_position_pence,revenue_pence,expenses_pence,cash_pence,burn_pence,notes')
    .maybeSingle();

  if (error) return fail('Unable to update metric.', 500);
  if (!data) return fail('Metric not found.', 404);
  return ok({ metric: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUser();
  if (isAuthError(ctx)) return ctx;
  if (isRateLimited('metrics', ctx.user.id)) return fail('Too many metric writes. Try again shortly.', 429);

  const access = await assertActiveAccess(ctx.supabase, ctx.user.id);
  if (!access.ok) return fail(access.error, access.status);

  const { id } = await params;
  const { data, error } = await ctx.supabase
    .from('metrics')
    .delete()
    .eq('id', id)
    .eq('user_id', ctx.user.id)
    .select('id')
    .maybeSingle();

  if (error) return fail('Unable to delete metric.', 500);
  if (!data) return fail('Metric not found.', 404);
  return ok({ deleted: true });
}
