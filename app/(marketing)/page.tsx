import Link from 'next/link';
import { ArrowRight, Shield, Clock, CreditCard } from 'lucide-react';
import { MarketingShell } from '@/components/marketing-shell';
import { CheckoutButton } from '@/components/checkout-button';

function Preview() {
  return (
    <div className="dashboard-preview glass">
      <div className="preview-top">
        <div>
          <div style={{ fontSize: 10.5, color: '#71717a', letterSpacing: '.06em', fontWeight: 550 }}>WORKSPACE</div>
          <strong style={{ display: 'block', marginTop: 2, fontWeight: 600, fontSize: 14 }}>Financial pulse</strong>
        </div>
        <span className="status-pill">● Live</span>
      </div>
      <div className="preview-grid">
        <div className="metric"><div className="metric-label">Net position</div><div className="metric-value">£84.2k</div><div style={{ color: '#6ee7b7', fontSize: 11, marginTop: 4 }}>↗ 8.4%</div></div>
        <div className="metric"><div className="metric-label">Margin</div><div className="metric-value">24.8%</div><div style={{ color: '#6ee7b7', fontSize: 11, marginTop: 4 }}>↗ 2.1 pts</div></div>
        <div className="metric"><div className="metric-label">Runway</div><div className="metric-value">9.6 mo</div><div style={{ color: '#c4b5fd', fontSize: 11, marginTop: 4 }}>Stable</div></div>
      </div>
      <div className="chart">
        <div className="chart-label">Illustrative trend</div>
        <svg viewBox="0 0 420 120" preserveAspectRatio="none" aria-label="Trend">
          <defs>
            <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity=".35" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 92 C28 86 35 74 60 80 S93 49 122 62 S154 82 182 56 S218 67 244 42 S282 55 310 28 S346 46 371 18 S400 22 420 8 L420 120 L0 120 Z" fill="url(#area)" />
          <path d="M0 92 C28 86 35 74 60 80 S93 49 122 62 S154 82 182 56 S218 67 244 42 S282 55 310 28 S346 46 371 18 S400 22 420 8" fill="none" stroke="#a78bfa" strokeWidth="1.75" />
        </svg>
      </div>
      <div className="preview-bottom">
        <div className="small-panel">
          <div className="metric-label">Priority</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.45, marginTop: 6, color: '#d4d4d8' }}>Review largest cost movements before the next cycle.</div>
        </div>
        <div className="small-panel">
          <div className="metric-label">Health</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}><span className="dot" /><strong style={{ fontSize: 12.5 }}>Normal</strong></div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <MarketingShell>
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <span className="eyebrow">Financial intelligence</span>
              <h1>Clarity for the<br />decisions that<br /><span className="gradient-text">actually matter.</span></h1>
              <p>A focused workspace for founders and operators who want clear numbers, better decisions, and fewer spreadsheets.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 26 }}>
                <Link href="/sign-up" className="btn btn-primary">Get started <ArrowRight size={14} /></Link>
                <Link href="/pricing" className="btn btn-secondary">View pricing</Link>
              </div>
              <div className="trust-row">
                <span><Shield size={13} /> Secure by design</span>
                <span><Clock size={13} /> One-time access</span>
                <span><CreditCard size={13} /> Stripe checkout</span>
              </div>
            </div>
            <Preview />
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">Access</span>
              <h2>One payment.<br /><span className="gradient-text">No renewals.</span></h2>
              <p>Choose a fixed duration. Pay once. Keep working.</p>
            </div>
            <div className="pricing-grid">
              {[
                { tier: 'starter' as const, name: 'Starter', price: '£990', days: '30 days', desc: 'Pilot the workspace with a single team.' },
                { tier: 'professional' as const, name: 'Professional', price: '£2,490', days: '90 days', desc: 'Build a consistent working rhythm.', popular: true },
                { tier: 'annual' as const, name: 'Annual', price: '£7,490', days: '365 days', desc: 'Full-year enterprise access.' },
              ].map(p => (
                <article className={`price-card glass ${p.popular ? 'popular' : ''}`} key={p.tier}>
                  {p.popular && <span className="popular-tag">Popular</span>}
                  <h3 style={{ fontSize: 15 }}>{p.name}</h3>
                  <div className="price">{p.price} <small>one-time</small></div>
                  <div style={{ fontSize: 12.5, color: '#a1a1aa', marginBottom: 8 }}>{p.days}</div>
                  <p>{p.desc}</p>
                  <ul className="check-list">
                    <li><span className="check">✓</span>Workspace access</li>
                    <li><span className="check">✓</span>Secure account</li>
                    <li><span className="check">✓</span>No automatic renewal</li>
                  </ul>
                  <CheckoutButton tier={p.tier} label="Choose" className={p.popular ? 'btn btn-primary' : 'btn btn-secondary'} />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="faq">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">Questions</span>
              <h2>Straightforward <span className="gradient-text">answers.</span></h2>
            </div>
            <div className="faq-grid">
              <article className="faq glass"><h3>Will I be charged again?</h3><p>No. Every pass is a one-time payment. There are no subscriptions and no automatic renewals.</p></article>
              <article className="faq glass"><h3>When does access start?</h3><p>When Stripe confirms payment and Astroiq activates your entitlement. Duration is measured in 24-hour periods.</p></article>
              <article className="faq glass"><h3>Can I buy another pass?</h3><p>Yes. Additional paid passes extend your current access. Status and expiry are shown on your dashboard.</p></article>
              <article className="faq glass"><h3>What happens when it ends?</h3><p>Protected features become unavailable until you purchase another pass. Your account and records remain.</p></article>
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
