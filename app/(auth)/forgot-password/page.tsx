import type { Metadata } from 'next';
import Link from 'next/link';
import { Orbit } from 'lucide-react';
import { ResetRequestForm } from '@/components/reset-request-form';

export const metadata: Metadata = { title: 'Reset password', robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <main className="form-wrap">
      <Link href="/" className="brand"><span className="brand-icon"><Orbit size={18} /></span>astroiq</Link>
      <section className="form-card glass" style={{ marginTop: 25 }}>
        <span className="eyebrow">Account recovery</span>
        <h1>Reset your password</h1>
        <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>We will email a secure link if the address is registered.</p>
        <ResetRequestForm />
      </section>
      <p className="muted" style={{ fontSize: 12, textAlign: 'center', marginTop: 20 }}><Link href="/sign-in">Back to sign in</Link></p>
    </main>
  );
}
