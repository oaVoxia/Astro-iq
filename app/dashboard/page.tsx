import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Settings, ShieldCheck, Sparkles, CreditCard } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasActiveEntitlement } from '@/lib/entitlements/access';
import { operatingMargin, runwayMonths } from '@/lib/workspace/types';
import { Nav } from '@/components/nav';
import { SignOutButton } from '@/components/sign-out-button';
import { Footer } from '@/components/footer';
import { FintechChat } from '@/components/fintech-chat';

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
    supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
    supabase.from('workspaces').select('id,name,currency').eq('user_id', user.id).maybeSingle(),
    supabase.from('metrics').select('period_start,net_position_pence,revenue_pence,expenses_pence,cash_pence,burn_pence').eq('user_id', user.id).order('period_start', { ascending: false }).limit(6),
    supabase.from('notes').select('id,title,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
  ]);

  const active = !grantError && hasActiveEntitlement(grants);
  const current = active ? grants?.find(g => g.status === 'active' && new Date(g.starts_at).getTime() <= Date.now() && new Date(g.expires_at).getTime() > Date.now()) : null;
  const name = profile?.display_name || user.email?.split('@')[0] || 'there';
  const latest = metrics?.[0];
  const margin = latest ? operatingMargin(latest.revenue_pence, latest.expenses_pence) : null;
  const runway = latest ? runwayMonths(latest.cash_pence, latest.burn_pence) : null;

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
            <span className="eyebrow"><span className="dot" /> {workspace?.name ?? 'Workspace'}</span>
            <h1 style={{ marginTop: 16 }}>Good to see you, {name}.</h1>
            <p className="muted" style={{ lineHeight: 1.7 }}>Your Astroiq workspace and access details at a glance.</p>
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
            {active && (
              <>
                <h2 style={{ fontSize: 20, margin: '30px 0 14px' }}>Recent periods</h2>
                <div className="table-wrap">
                  {!metrics?.length ? <div className="empty-state">No periods yet. Post to /api/metrics to record one.</div> : (
                    <table>
                      <thead><tr><th>Period</th><th>Net</th><th>Revenue</th><th>Expenses</th></tr></thead>
                      <tbody>
                        {metrics.map(m => (
                          <tr key={m.period_start}>
                            <td>{m.period_start}</td>
                            <td>{gbp(m.net_position_pence)}</td>
                            <td>{gbp(m.revenue_pence)}</td>
                            <td>{gbp(m.expenses_pence)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <h2 style={{ fontSize: 20, margin: '30px 0 14px' }}>Notes</h2>
                <div className="table-wrap">
                  {!notes?.length ? <div className="empty-state">No notes yet. Post to /api/notes to save one.</div> : (
                    <table>
                      <thead><tr><th>Title</th><th>Created</th></tr></thead>
                      <tbody>
                        {notes.map(n => (
                          <tr key={n.id}>
                            <td>{n.title}</td>
                            <td>{new Date(n.created_at).toLocaleDateString('en-GB', { timeZone: 'UTC' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
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
