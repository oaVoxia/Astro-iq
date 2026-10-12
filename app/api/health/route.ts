import { ok } from '@/lib/api/json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return ok({ ok: true, service: 'astroiq', time: new Date().toISOString() });
}
