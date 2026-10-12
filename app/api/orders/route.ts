import { isAuthError, requireUser } from '@/lib/api/context';
import { fail, ok } from '@/lib/api/json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await requireUser();
  if (isAuthError(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from('orders')
    .select('id,tier,duration_days,amount_total,currency,status,created_at,paid_at')
    .eq('user_id', ctx.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return fail('Unable to load orders.', 500);
  return ok({ orders: data ?? [] });
}
