'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function CheckoutButton({ tier, label = 'Get access', className = 'btn btn-primary' }: { tier: 'starter'|'professional'|'annual'; label?: string; className?: string }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const router = useRouter();
  async function checkout() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier }) });
      const data = await response.json();
      if (response.status === 401) { router.push('/sign-in?next=/pricing'); return; }
      if (!response.ok || typeof data.url !== 'string') throw new Error(data.error || 'Unable to start checkout.');
      const target = new URL(data.url);
      if (target.protocol !== 'https:' || !['checkout.stripe.com'].includes(target.hostname)) throw new Error('Unexpected checkout destination.');
      window.location.assign(target.toString());
    } catch (e) { setError(e instanceof Error ? e.message : 'Checkout failed. Try again.'); setBusy(false); }
  }
  return <div><button type="button" className={className} onClick={checkout} disabled={busy}>{busy ? 'Preparing secure checkout…' : label}</button>{error && <p role="alert" className="muted" style={{fontSize:12,marginTop:8}}>{error}</p>}</div>;
}
