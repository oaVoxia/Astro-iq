import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, BrainCircuit, ShieldCheck, WalletCards, TrendingUp, Zap } from 'lucide-react';
import { MarketingShell } from '@/components/marketing-shell';

export const metadata: Metadata = { title: 'Features' };

const items = [
  { icon: BarChart3, title: 'Structured overview', text: 'Keep the numbers that matter organised in one considered workspace.' },
  { icon: BrainCircuit, title: 'Insights with context', text: 'Findings sit next to their source, date, and assumptions.' },
  { icon: TrendingUp, title: 'Decision support', text: 'Turn observations into a prioritised next step.' },
  { icon: ShieldCheck, title: 'Account controls', text: 'Secure sign-in, clear access status, and purchase history.' },
  { icon: WalletCards, title: 'One-time access', text: 'Choose 30, 90, or 365 days. Pay once through Stripe.' },
  { icon: Zap, title: 'Focused experience', text: 'A responsive interface that stays quick on desktop and mobile.' },
];

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <main className="section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Capabilities</span>
            <h1 style={{ fontSize: 'clamp(40px,5vw,60px)' }}>A more thoughtful way<br />to work with <span className="gradient-text">financial data.</span></h1>
            <p>Clarity, context, and control — without the spreadsheet sprawl.</p>
          </div>
          <div className="feature-grid">
            {items.map(x => (
              <article className="feature-card glass" key={x.title}>
                <div className="feature-icon"><x.icon size={18} /></div>
                <h3>{x.title}</h3>
                <p>{x.text}</p>
              </article>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link href="/pricing" className="btn btn-primary">Compare access passes</Link>
          </div>
        </div>
      </main>
    </MarketingShell>
  );
}
