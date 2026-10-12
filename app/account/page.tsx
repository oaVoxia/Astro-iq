import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { ProfileForm } from '@/components/profile-form';
import { PasswordForm } from '@/components/password-form';
import { AvatarUpload } from '@/components/avatar-upload';

export const metadata: Metadata = { title: 'Account settings', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in?next=/account');
  const { data: profile } = await supabase.from('profiles').select('display_name,company,job_title,timezone,bio,avatar_url,created_at').eq('id', user.id).maybeSingle();
  const name = profile?.display_name || user.email?.split('@')[0] || 'there';

  return (
    <>
      <Nav />
      <main className="container section" style={{ minHeight: '65vh' }}>
        <div style={{ maxWidth: 680, margin: 'auto' }}>
          <span className="eyebrow">Account</span>
          <h1 style={{ fontSize: 40, margin: '16px 0 8px' }}>Profile</h1>
          <p className="muted">Manage how you appear in the workspace. Email changes stay with support.</p>
          <div className="glass" style={{ padding: 24, borderRadius: 18, marginTop: 24 }}>
            <AvatarUpload initialUrl={profile?.avatar_url ?? null} name={name} />
            <div className="field" style={{ marginTop: 16 }}>
              <label>Email address</label>
              <div style={{ padding: 13, border: '1px solid var(--border)', borderRadius: 10, overflowWrap: 'anywhere' }}>{user.email}</div>
              <span className="muted" style={{ fontSize: 12 }}>{user.email_confirmed_at ? 'Verified' : 'Verification pending'}</span>
            </div>
            <ProfileForm initial={{
              displayName: profile?.display_name ?? '',
              company: profile?.company ?? '',
              jobTitle: profile?.job_title ?? '',
              timezone: profile?.timezone ?? 'Europe/London',
              bio: profile?.bio ?? '',
            }} />
            <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '20px 0' }} />
            <PasswordForm />
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
