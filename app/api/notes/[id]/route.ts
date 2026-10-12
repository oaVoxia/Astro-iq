import { isAuthError, requireUser } from '@/lib/api/context';
import { fail, ok } from '@/lib/api/json';
import { isRateLimited } from '@/lib/security/rate-limit';
import { assertActiveAccess } from '@/lib/workspace/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUser();
  if (isAuthError(ctx)) return ctx;
  if (isRateLimited('notes', ctx.user.id)) return fail('Too many note writes. Try again shortly.', 429);

  const access = await assertActiveAccess(ctx.supabase, ctx.user.id);
  if (!access.ok) return fail(access.error, access.status);

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const patch: Record<string, string> = {};

  if (body.title != null) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (title.length < 1 || title.length > 120) return fail('Title must be 1–120 characters.', 400);
    patch.title = title;
  }
  if (body.body != null) {
    const text = typeof body.body === 'string' ? body.body.trim() : '';
    if (text.length < 1 || text.length > 4000) return fail('Body must be 1–4000 characters.', 400);
    patch.body = text;
  }
  if (!Object.keys(patch).length) return fail('No valid fields to update.', 400);

  const { data, error } = await ctx.supabase
    .from('notes')
    .update(patch)
    .eq('id', id)
    .eq('user_id', ctx.user.id)
    .select('id,title,body,updated_at')
    .maybeSingle();

  if (error) return fail('Unable to update note.', 500);
  if (!data) return fail('Note not found.', 404);
  return ok({ note: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUser();
  if (isAuthError(ctx)) return ctx;
  if (isRateLimited('notes', ctx.user.id)) return fail('Too many note writes. Try again shortly.', 429);

  const access = await assertActiveAccess(ctx.supabase, ctx.user.id);
  if (!access.ok) return fail(access.error, access.status);

  const { id } = await params;
  const { data, error } = await ctx.supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', ctx.user.id)
    .select('id')
    .maybeSingle();

  if (error) return fail('Unable to delete note.', 500);
  if (!data) return fail('Note not found.', 404);
  return ok({ deleted: true });
}
