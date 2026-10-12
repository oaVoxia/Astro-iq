import { isAuthError, requireUser } from '@/lib/api/context';
import { fail, ok } from '@/lib/api/json';
import { hasActiveEntitlement } from '@/lib/entitlements/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await requireUser();
  if (isAuthError(ctx)) return ctx;

  const [{ data: profile }, { data: entitlements }, { data: workspace }] = await Promise.all([
    ctx.supabase.from('profiles').select('display_name,created_at').eq('id', ctx.user.id).maybeSingle(),
    ctx.supabase.from('entitlements').select('tier,status,starts_at,expires_at').eq('user_id', ctx.user.id).order('expires_at', { ascending: false }).limit(10),
    ctx.supabase.from('workspaces').select('id,name,currency').eq('user_id', ctx.user.id).maybeSingle(),
  ]);

  return ok({
    user: {
      id: ctx.user.id,
      email: ctx.user.email,
      displayName: profile?.display_name ?? null,
    },
    workspace,
    access: {
      active: hasActiveEntitlement(entitlements),
      entitlements: entitlements ?? [],
    },
  });
}

export async function PATCH(request: Request) {
  const ctx = await requireUser();
  if (isAuthError(ctx)) return ctx;

  const body = await request.json().catch(() => ({}));
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : null;
  if (displayName !== null && (displayName.length < 1 || displayName.length > 120)) {
    return fail('Display name must be 1–120 characters.', 400);
  }

  const { error } = await ctx.supabase
    .from('profiles')
    .update({ display_name: displayName || null })
    .eq('id', ctx.user.id);

  if (error) return fail('Unable to update profile.', 500);
  return ok({ updated: true });
}
