import { NextResponse } from 'next/server';
import { getServerEnv, isTierId, tierConfig, type TierId } from '@/lib/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/server';
import { safeReturnUrl } from '@/lib/security/urls';
import { rateLimitConfiguration } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

// Simple in-memory limiter. Replace with Cloudflare rate limiting for production multi-isolate use.
const hits = new Map<string, { count: number; reset: number }>();

function isRateLimited(userId: string): boolean {
  const { requests, windowSeconds } = rateLimitConfiguration('checkout');
  const now = Date.now();
  const key = `checkout:${userId}`;
  const entry = hits.get(key);
  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + windowSeconds * 1000 });
    return false;
  }
  if (entry.count >= requests) return true;
  entry.count += 1;
  return false;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const tier = body?.tier;
    if (!isTierId(tier)) {
      return NextResponse.json({ error: 'Invalid tier.' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    if (isRateLimited(user.id)) {
      return NextResponse.json({ error: 'Too many checkout attempts. Try again shortly.' }, { status: 429 });
    }

    const env = getServerEnv();
    const config = tierConfig[tier as TierId];
    const priceId = env[config.priceEnv as keyof typeof env] as string;
    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured.' }, { status: 500 });
    }

    const stripe = getStripe();
    const price = await stripe.prices.retrieve(priceId);

    if (price.type !== 'one_time' || price.currency !== 'gbp' || price.unit_amount !== config.expectedAmount) {
      return NextResponse.json({ error: 'Price configuration mismatch.' }, { status: 500 });
    }

    const baseUrl = env.APP_BASE_URL;
    const successUrl = safeReturnUrl(null, baseUrl, '/dashboard?checkout=success');
    const cancelUrl = safeReturnUrl(null, baseUrl, '/pricing?checkout=cancelled');

    const admin = createSupabaseAdminClient();
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        user_id: user.id,
        tier,
        duration_days: config.days,
        amount_total: config.expectedAmount,
        currency: 'gbp',
        status: 'pending',
      })
      .select('id')
      .single();

    if (orderError || !order) {
      console.error('order_insert_failed', orderError?.message);
      return NextResponse.json({ error: 'Unable to start checkout.' }, { status: 500 });
    }

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: user.email ?? undefined,
        client_reference_id: order.id,
        metadata: {
          order_id: order.id,
          user_id: user.id,
          tier,
          duration_days: String(config.days),
        },
      });
    } catch (stripeErr) {
      // Clean up the pending order if session creation fails.
      await admin.from('orders').update({ status: 'failed' }).eq('id', order.id);
      throw stripeErr;
    }

    if (!session.url) {
      await admin.from('orders').update({ status: 'failed' }).eq('id', order.id);
      return NextResponse.json({ error: 'Checkout session missing URL.' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('checkout_error', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json({ error: 'Checkout failed.' }, { status: 500 });
  }
}
