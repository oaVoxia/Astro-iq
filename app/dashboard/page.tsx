import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Settings, ShieldCheck, Sparkles, CreditCard } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasActiveEntitlement } from '@/lib/entitlements/access';
import { operatingMargin, runwayMonths } from '@/lib/workspace/types';
import { buildInsights } from '@/lib/workspace/insights';
import { Nav } from '@/components/nav';
import { SignOutButton } from '@/components/sign-out-button';
import { Footer } from '@/components/footer';
import { FintechChat } from '@/components/fintech-chat';
import { WorkspacePanel } from '@/components/workspace-panel';
import { WorkspaceName } from '@/components/workspace-name';
import { CheckoutNotice } from '@/components/checkout-notice';

export const metadata: Metadata = { title: 'Workspace', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

function gbp(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/sign-in?next=/dashboard');

  const [{ data: grants, error: grantError }, { data: orders, error: orderError }, { data: profile }, { data: workspace }, { data: metrics }, { data: notes }] = await Promise.all([
    supabase.from('entitlements').select('id,tier,status,starts_at,expires_at').eq('user_id', user.id).order('expires_at', { ascending: false }).limit(20),
    supabase.from('orders').select('id,tier,amount_total,currency,status,created_at,paid_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('profiles').select('display_name,avatar_url').eq('id', user.id).maybeSingle(),
    supabase.from('workspaces').select('id,name,currency').eq('user_id', user.id).maybeSingle(),
    supabase.from('metrics').select('id,period_start,net_position_pence,revenue_pence,expenses_pence,cash_pence,burn_pence').eq('user_id', user.id).order('period_start', { ascending: false }).limit(8),
    supabase.from('notes').select('id,title,body,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8),
  ]);

  const active = !grantError && hasActiveEntitlement(grants);
  const current = active ? grants?.find(g => g.status === 'active' && new Date(g.starts_at).getTime() <= Date.now() && new Date(g.expires_at).getTime() > Date.now()) : null;
  const name = profile?.display_name || user.email?.split('@')[0] || 'there';
  const latest = metrics?.[0];
  const margin = latest ? operatingMargin(latest.revenue_pence, latest.expenses_pence) : null;
  const runway = latest ? runwayMonths(latest.cash_pence, latest.burn_pence) : null;
  const insights = active ? buildInsights(metrics ?? []) : [];
  const letter = name.slice(0, 1).toUpperCase();

  return (
    <>
      <Nav />
      <main className="container">
        <div className="dash-layout">
          <aside className="sidebar glass">
            <div className="side-link active"><LayoutDashboard size={17} /> Overview</div>
            <Link className="side-link" href="/account"><Settings size={17} /> Account settings</Link>
            <Link className="side-link" href="/pricing"><CreditCard size={17} /> Access passes</Link>
            <SignOutButton />
          </aside>
          <section className="dash-main">
            <Suspense fallback={null}><CheckoutNotice /></Suspense>
            {active && workspace ? <WorkspaceName initialName={workspace.name} /> : <span className="eyebrow"><span className="dot" /> {workspace?.name ?? 'Workspace'}</span>}
            <div className="avatar-row" style={{ marginTop: 16 }}>
              <div className="avatar" aria-hidden="true">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{letter}</span>}</div>
              <div>
                <h1 style={{ margin: 0 }}>Good to see you, {name}.</h1>
                <p className="muted" style={{ lineHeight: 1.7, margin: '6px 0 0' }}>Track periods, notes, and access in one workspace.</p>
              </div>
            </div>
            {grantError || orderError ? <div className="notice" role="alert">Some account data could not be loaded. Refresh in a moment or contact support if the issue persists.</div> : null}
            <div className="dash-grid">
              <article className="dash-card glass">
                <div className="muted" style={{ fontSize: 12 }}>Access status</div>
                <div className="big" style={{ fontSize: 22 }}>{active ? '● Active access' : '● No active access'}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>{active && current ? `Until ${new Date(current.expires_at).toLocaleDateString('en-GB', { dateStyle: 'medium', timeZone: 'UTC' })}` : 'Choose a pass to unlock the workspace.'}</div>
              </article>
              <article className="dash-card glass">
                <div className="muted" style={{ fontSize: 12 }}>Net position</div>
                <div className="big" style={{ fontSize: 22 }}>{active && latest ? gbp(latest.net_position_pence) : '—'}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>{active ? (margin != null ? `Margin ${margin}%` : 'Add a period to see margin') : 'Unlock to track metrics'}</div>
              </article>
              <article className="dash-card glass">
                <div className="muted" style={{ fontSize: 12 }}>Runway</div>
                <div className="big" style={{ fontSize: 22 }}>{active && runway != null ? `${runway} mo` : '—'}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>{active ? 'From latest cash and burn' : 'Unlock to track runway'}</div>
              </article>
            </div>
            {!active && (
              <article className="glass" style={{ padding: 24, borderRadius: 17, marginBottom: 22 }}>
                <div className="feature-icon"><Sparkles /></div>
                <h2 style={{ fontSize: 22, margin: '0 0 9px' }}>Your next step starts here.</h2>
                <p className="muted" style={{ lineHeight: 1.7, fontSize: 14 }}>Choose a 30-, 90- or 365-day access pass. Every purchase is a one-time payment with no automatic renewal.</p>
                <Link className="btn btn-primary" href="/pricing">View access passes ↗</Link>
              </article>
            )}
            {active && insights.length > 0 && (
              <article className="glass" style={{ padding: 18, borderRadius: 16, marginTop: 8 }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Insights</div>
                <ul className="check-list" style={{ margin: 0 }}>
                  {insights.map(item => <li key={item}><span className="check">✓</span>{item}</li>)}
                </ul>
              </article>
            )}
            {active && <WorkspacePanel metrics={metrics ?? []} notes={notes ?? []} />}
            <h2 style={{ fontSize: 20, margin: '30px 0 14px' }}>Recent purchases</h2>
            <div className="table-wrap">
              {!orders?.length ? <div className="empty-state"><CreditCard size={28} style={{ margin: '0 auto 12px' }} /><div>No purchases yet.</div><p style={{ fontSize: 13 }}>Your confirmed orders will appear here.</p></div> : (
                <table>
                  <thead><tr><th>Date</th><th>Access pass</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td>{new Date(o.created_at).toLocaleDateString('en-GB', { timeZone: 'UTC' })}</td>
                        <td>{o.tier === 'starter' ? 'Starter · 30 days' : o.tier === 'professional' ? 'Professional · 90 days' : 'Annual · 365 days'}</td>
                        <td>{new Intl.NumberFormat('en-GB', { style: 'currency', currency: o.currency.toUpperCase() }).format(o.amount_total / 100)}</td>
                        <td><span className={`status-pill ${o.status === 'paid' ? '' : 'inactive'}`}>{o.status.replace('_', ' ')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <p className="muted" style={{ fontSize: 12, marginTop: 16 }}><ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Payments are processed by Stripe. Astroiq does not store card numbers.</p>
          </section>
        </div>
      </main>
      <FintechChat />
      <Footer />
    </>
  );
}
