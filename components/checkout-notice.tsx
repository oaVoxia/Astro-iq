'use client';

import { useSearchParams } from 'next/navigation';

export function CheckoutNotice() {
  const params = useSearchParams();
  const checkout = params.get('checkout');
  if (checkout === 'success') {
    return <div className="success-notice" role="status">Payment received. Access updates once Stripe confirms the payment.</div>;
  }
  if (checkout === 'cancelled') {
    return <div className="notice" role="status">Checkout was cancelled. No payment was taken.</div>;
  }
  return null;
}
