import { isAuthError, requireUser } from '@/lib/api/context';
import { fail, ok } from '@/lib/api/json';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getServerEnv } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const ctx = await requireUser();
  if (isAuthError(ctx)) return ctx;

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return fail('Choose an image.', 400);
  const ext = TYPES[file.type];
  if (!ext) return fail('Use a JPG, PNG, or WebP image.', 400);
  if (file.size > MAX_BYTES) return fail('Image must be 2 MB or smaller.', 400);

  const path = `${ctx.user.id}/avatar.${ext}`;
  const admin = createSupabaseAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage.from('avatars').upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) return fail('Unable to upload image.', 500);

  const env = getServerEnv();
  const avatarUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}?v=${Date.now()}`;
  const { error } = await admin.from('profiles').update({ avatar_url: avatarUrl }).eq('id', ctx.user.id);
  if (error) return fail('Unable to save profile image.', 500);
  return ok({ avatarUrl });
}

export async function DELETE() {
  const ctx = await requireUser();
  if (isAuthError(ctx)) return ctx;
  const admin = createSupabaseAdminClient();
  await admin.storage.from('avatars').remove([
    `${ctx.user.id}/avatar.jpg`,
    `${ctx.user.id}/avatar.png`,
    `${ctx.user.id}/avatar.webp`,
  ]);
  const { error } = await admin.from('profiles').update({ avatar_url: null }).eq('id', ctx.user.id);
  if (error) return fail('Unable to remove image.', 500);
  return ok({ removed: true });
}
