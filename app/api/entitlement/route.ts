import { isAuthError, requireUser } from '@/lib/api/context';
import { ok } from '@/lib/api/json';
import { hasActiveEntitlement } from '@/lib/entitlements/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await requireUser();
  if (isAuthError(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from('entitlements')
    .select('id,tier,status,starts_at,expires_at,created_at')
    .eq('user_id', ctx.user.id)
    .order('expires_at', { ascending: false })
    .limit(20);

  if (error) return ok({ active: false, current: null, entitlements: [] });

  const active = hasActiveEntitlement(data);
  const now = Date.now();
  const current = active
    ? data?.find((row) => row.status === 'active' && Date.parse(row.starts_at) <= now && Date.parse(row.expires_at) > now) ?? null
    : null;

  return ok({ active, current, entitlements: data ?? [] });
}
