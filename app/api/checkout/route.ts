import { NextResponse } from 'next/server';
import { getServerEnv, isTierId, tierConfig, type TierId } from '@/lib/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/server';
import { safeReturnUrl } from '@/lib/security/urls';

export const runtime = 'nodejs';

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

    // Create a pending order so the webhook can fulfill against a known record.
    const { data: order, error: orderError } = await supabase
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

    const session = await stripe.checkout.sessions.create({
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

    if (!session.url) {
      return NextResponse.json({ error: 'Checkout session missing URL.' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('checkout_error', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json({ error: 'Checkout failed.' }, { status: 500 });
  }
}
