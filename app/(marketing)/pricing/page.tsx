import type { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing-shell';
import { CheckoutButton } from '@/components/checkout-button';

export const metadata: Metadata = { title: 'Pricing' };

const plans = [
  { tier: 'starter' as const, name: 'Starter', price: '£990', days: '30 days', desc: '30-day enterprise pilot for a single team.' },
  { tier: 'professional' as const, name: 'Professional', price: '£2,490', days: '90 days', desc: '90-day professional engagement.', popular: true },
  { tier: 'annual' as const, name: 'Annual', price: '£7,490', days: '365 days', desc: 'Full-year enterprise access.' },
];

export default function PricingPage() {
  return (
    <MarketingShell>
      <main className="section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Pricing</span>
            <h1 style={{ fontSize: 'clamp(40px,5vw,60px)' }}>One payment.<br /><span className="gradient-text">Your chosen duration.</span></h1>
            <p>Fixed-duration access. No recurring billing. No automatic renewals.</p>
          </div>
          <div className="pricing-grid">
            {plans.map(p => (
              <article className={`price-card glass ${p.popular ? 'popular' : ''}`} key={p.tier}>
                {p.popular && <span className="popular-tag">Popular</span>}
                <h3>{p.name}</h3>
                <div className="price">{p.price} <small>one-time</small></div>
                <div style={{ fontSize: 12.5, color: '#a1a1aa', marginBottom: 6 }}>{p.days}</div>
                <p>{p.desc}</p>
                <ul className="check-list">
                  <li><span className="check">✓</span>Workspace features</li>
                  <li><span className="check">✓</span>Secure account</li>
                  <li><span className="check">✓</span>Purchase another pass any time</li>
                  <li><span className="check">✓</span>No automatic renewal</li>
                </ul>
                <CheckoutButton tier={p.tier} label="Continue" className={p.popular ? 'btn btn-primary' : 'btn btn-secondary'} />
              </article>
            ))}
          </div>
          <p className="muted" style={{ textAlign: 'center', fontSize: 12, marginTop: 20 }}>Prices match the active Stripe Price objects for this environment.</p>
        </div>
      </main>
    </MarketingShell>
  );
}
