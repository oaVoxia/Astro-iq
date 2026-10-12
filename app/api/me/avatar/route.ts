import { isAuthError, requireUser } from '@/lib/api/context';
import { fail, ok } from '@/lib/api/json';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getServerEnv } from '@/lib/config';
import { isRateLimited } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TYPES: Record<string, { ext: string; sniff: (bytes: Uint8Array) => boolean }> = {
  'image/jpeg': { ext: 'jpg', sniff: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', sniff: b => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  'image/webp': { ext: 'webp', sniff: b => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
};
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const ctx = await requireUser();
  if (isAuthError(ctx)) return ctx;
  if (isRateLimited('avatar', ctx.user.id)) return fail('Too many uploads. Try again shortly.', 429);

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return fail('Choose an image.', 400);
  const spec = TYPES[file.type];
  if (!spec) return fail('Use a JPG, PNG, or WebP image.', 400);
  if (file.size > MAX_BYTES) return fail('Image must be 2 MB or smaller.', 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length < 12 || !spec.sniff(buffer)) return fail('File contents do not match the image type.', 400);

  const path = `${ctx.user.id}/avatar.${spec.ext}`;
  const admin = createSupabaseAdminClient();
  await admin.storage.from('avatars').remove([
    `${ctx.user.id}/avatar.jpg`,
    `${ctx.user.id}/avatar.png`,
    `${ctx.user.id}/avatar.webp`,
  ]);
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
