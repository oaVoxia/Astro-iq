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

  const { data, error } = await ctx.supabase
    .from('notes')
    .select('id,title,body,created_at,updated_at')
    .eq('user_id', ctx.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return fail('Unable to load notes.', 500);
  return ok({ notes: data ?? [] });
}

export async function POST(request: Request) {
  const ctx = await requireUser();
  if (isAuthError(ctx)) return ctx;

  const access = await assertActiveAccess(ctx.supabase, ctx.user.id);
  if (!access.ok) return fail(access.error, access.status);

  const workspace = await getWorkspace(ctx.supabase, ctx.user.id);
  if (!workspace.ok) return fail(workspace.error, 404);

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (title.length < 1 || title.length > 120) return fail('Title must be 1–120 characters.', 400);
  if (text.length < 1 || text.length > 4000) return fail('Body must be 1–4000 characters.', 400);

  const { data, error } = await ctx.supabase
    .from('notes')
    .insert({ workspace_id: workspace.workspace.id, user_id: ctx.user.id, title, body: text })
    .select('id,title,body,created_at')
    .single();

  if (error || !data) return fail('Unable to save note.', 500);
  return ok({ note: data }, 201);
}
