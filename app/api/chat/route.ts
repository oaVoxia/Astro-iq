import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitConfiguration } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

const hits = new Map<string, { count: number; reset: number }>();

function isLimited(userId: string) {
  const { requests, windowSeconds } = rateLimitConfiguration('auth');
  const now = Date.now();
  const key = `chat:${userId}`;
  const entry = hits.get(key);
  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + windowSeconds * 1000 });
    return false;
  }
  if (entry.count >= requests) return true;
  entry.count += 1;
  return false;
}

function localReply(message: string): string {
  const q = message.toLowerCase();
  if (q.includes('runway')) return 'Runway is the number of months your current cash can cover operating expenses at the current burn rate. In Astroiq it is shown as an illustrative metric on the workspace overview. This is general information, not financial advice.';
  if (q.includes('access') || q.includes('pass') || q.includes('subscription')) return 'Astroiq uses one-time access passes (30, 90 or 365 days). There are no subscriptions or automatic renewals. Your current status and expiry are shown on the dashboard.';
  if (q.includes('price') || q.includes('cost') || q.includes('£')) return 'Current enterprise passes are £990 (30 days), £2,490 (90 days) and £7,490 (365 days). Final taxes are shown at Stripe Checkout.';
  if (q.includes('refund')) return 'Full refunds processed through Stripe revoke the associated entitlement. Partial refunds are recorded but do not automatically revoke access. See the refunds page for the placeholder policy.';
  if (q.includes('advice') || q.includes('invest') || q.includes('should i')) return 'I can explain concepts and help you use the workspace, but I cannot give investment, tax or personalised financial advice. Please consult a qualified adviser for decisions.';
  return 'I can help with workspace navigation, access status, and general financial concepts (runway, margin, position). What would you like to know?';
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

    if (isLimited(user.id)) {
      return NextResponse.json({ error: 'Too many messages. Please wait a moment.' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message || message.length > 500) {
      return NextResponse.json({ error: 'Message is required (max 500 characters).' }, { status: 400 });
    }

    const reply = localReply(message);

    return NextResponse.json({
      reply,
      disclaimer: 'General information only. Not financial advice.',
    });
  } catch {
    return NextResponse.json({ error: 'Chat unavailable.' }, { status: 500 });
  }
}
