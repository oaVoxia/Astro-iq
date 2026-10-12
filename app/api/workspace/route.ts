import { isAuthError, requireUser } from '@/lib/api/context';
import { fail, ok } from '@/lib/api/json';
import { assertActiveAccess, getWorkspace } from '@/lib/workspace/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await requireUser();
  if (isAuthError(ctx)) return ctx;

  const access = await assertActiveAccess(ctx.supabase, ctx.user.id);
  if (!access.ok) return fail(access.error, access.status);

  const workspace = await getWorkspace(ctx.supabase, ctx.user.id);
  if (!workspace.ok) return fail(workspace.error, 404);

  return ok({ workspace: workspace.workspace });
}

export async function PATCH(request: Request) {
  const ctx = await requireUser();
  if (isAuthError(ctx)) return ctx;

  const access = await assertActiveAccess(ctx.supabase, ctx.user.id);
  if (!access.ok) return fail(access.error, access.status);

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 1 || name.length > 80) return fail('Name must be 1–80 characters.', 400);

  const { data, error } = await ctx.supabase
    .from('workspaces')
    .update({ name })
    .eq('user_id', ctx.user.id)
    .select('id,name,currency')
    .single();

  if (error || !data) return fail('Unable to update workspace.', 500);
  return ok({ workspace: data });
}
