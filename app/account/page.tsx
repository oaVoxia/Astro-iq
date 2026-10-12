import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { ProfileForm } from '@/components/profile-form';

export const metadata: Metadata = { title: 'Account settings', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in?next=/account');
  const { data: profile } = await supabase.from('profiles').select('display_name,created_at').eq('id', user.id).maybeSingle();

  return (
    <>
      <Nav />
      <main className="container section" style={{ minHeight: '65vh' }}>
        <div style={{ maxWidth: 640, margin: 'auto' }}>
          <span className="eyebrow">Account</span>
          <h1 style={{ fontSize: 40, margin: '16px 0 8px' }}>Your account</h1>
          <p className="muted">Update your display name. Email changes stay with support.</p>
          <div className="glass" style={{ padding: 24, borderRadius: 18, marginTop: 24 }}>
            <div className="field">
              <label>Email address</label>
              <div style={{ padding: 13, border: '1px solid var(--border)', borderRadius: 10, overflowWrap: 'anywhere' }}>{user.email}</div>
            </div>
            <ProfileForm initialName={profile?.display_name ?? ''} />
            <div className="field" style={{ marginTop: 16 }}>
              <label>Account created</label>
              <div style={{ padding: 13, border: '1px solid var(--border)', borderRadius: 10 }}>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB', { dateStyle: 'long', timeZone: 'UTC' }) : '—'}</div>
            </div>
            <Link className="btn btn-secondary" href="/dashboard" style={{ marginTop: 16 }}>Back to workspace</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
