import { isAuthError, requireUser } from '@/lib/api/context';
import { fail, ok } from '@/lib/api/json';
import { hasActiveEntitlement } from '@/lib/entitlements/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROFILE_COLUMNS = 'display_name,company,job_title,timezone,bio,created_at';

function optionalText(value: unknown, min: number, max: number, label: string) {
  if (value == null || value === '') return { ok: true as const, value: null };
  if (typeof value !== 'string') return { ok: false as const, error: `${label} must be text.` };
  const text = value.trim();
  if (text.length < min || text.length > max) return { ok: false as const, error: `${label} must be ${min}–${max} characters.` };
  return { ok: true as const, value: text };
}

export async function GET() {
  const ctx = await requireUser();
  if (isAuthError(ctx)) return ctx;

  const [{ data: profile }, { data: entitlements }, { data: workspace }] = await Promise.all([
    ctx.supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', ctx.user.id).maybeSingle(),
    ctx.supabase.from('entitlements').select('tier,status,starts_at,expires_at').eq('user_id', ctx.user.id).order('expires_at', { ascending: false }).limit(10),
    ctx.supabase.from('workspaces').select('id,name,currency').eq('user_id', ctx.user.id).maybeSingle(),
  ]);

  return ok({
    user: {
      id: ctx.user.id,
      email: ctx.user.email,
      emailConfirmed: Boolean(ctx.user.email_confirmed_at),
      displayName: profile?.display_name ?? null,
      company: profile?.company ?? null,
      jobTitle: profile?.job_title ?? null,
      timezone: profile?.timezone ?? 'Europe/London',
      bio: profile?.bio ?? null,
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
  const patch: Record<string, string | null> = {};

  if ('displayName' in body) {
    const parsed = optionalText(body.displayName, 1, 120, 'Display name');
    if (!parsed.ok) return fail(parsed.error, 400);
    patch.display_name = parsed.value;
  }
  if ('company' in body) {
    const parsed = optionalText(body.company, 1, 120, 'Company');
    if (!parsed.ok) return fail(parsed.error, 400);
    patch.company = parsed.value;
  }
  if ('jobTitle' in body) {
    const parsed = optionalText(body.jobTitle, 1, 80, 'Job title');
    if (!parsed.ok) return fail(parsed.error, 400);
    patch.job_title = parsed.value;
  }
  if ('timezone' in body) {
    const parsed = optionalText(body.timezone, 1, 64, 'Timezone');
    if (!parsed.ok || !parsed.value) return fail('Timezone is required.', 400);
    if (!/^([A-Za-z_]+\/)?[A-Za-z_]+$/.test(parsed.value)) return fail('Timezone is not valid.', 400);
    patch.timezone = parsed.value;
  }
  if ('bio' in body) {
    const parsed = optionalText(body.bio, 1, 500, 'Bio');
    if (!parsed.ok) return fail(parsed.error, 400);
    patch.bio = parsed.value;
  }

  if (!Object.keys(patch).length) return fail('No valid fields to update.', 400);

  const { error } = await ctx.supabase.from('profiles').update(patch).eq('id', ctx.user.id);
  if (error) return fail('Unable to update profile.', 500);
  return ok({ updated: true });
}
