import Stripe from 'stripe';
import { getServerEnv } from '@/lib/config';
let client: Stripe | undefined;
export function getStripe() {
  if (!client) client = new Stripe(getServerEnv().STRIPE_SECRET_KEY);
  return client;
}
