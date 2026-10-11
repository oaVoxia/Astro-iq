import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerEnv, isTierId, tierConfig } from '@/lib/config';
import { getStripe } from '@/lib/stripe/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const env = getServerEnv();
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('webhook_signature_failed', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== 'paid') {
        return NextResponse.json({ received: true });
      }

      const orderId = session.metadata?.order_id || session.client_reference_id;
      const userId = session.metadata?.user_id;
      const tier = session.metadata?.tier;
      const durationDays = Number(session.metadata?.duration_days);

      if (!orderId || !userId || !isTierId(tier) || !Number.isInteger(durationDays)) {
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      const expected = tierConfig[tier].expectedAmount;
      if (session.amount_total !== expected || session.currency !== 'gbp') {
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
      }

      const { error } = await admin.rpc('fulfill_paid_checkout', {
        p_event_id: event.id,
        p_session_id: session.id,
        p_order_id: orderId,
        p_user_id: userId,
        p_tier: tier,
        p_duration_days: durationDays,
        p_amount_total: expected,
        p_currency: 'gbp',
        p_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      });

      if (error) {
        console.error('fulfill_failed', error.message);
        return NextResponse.json({ error: 'Fulfillment failed' }, { status: 500 });
      }
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
      if (!paymentIntentId) {
        return NextResponse.json({ received: true });
      }

      const { error } = await admin.rpc('process_refund_event', {
        p_event_id: event.id,
        p_payment_intent_id: paymentIntentId,
        p_refunded_amount: charge.amount_refunded,
        p_amount: charge.amount,
      });

      if (error) {
        console.error('refund_failed', error.message);
        // Ask Stripe to retry if the payment record is not yet visible.
        return NextResponse.json({ error: 'Refund processing failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('webhook_error', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
