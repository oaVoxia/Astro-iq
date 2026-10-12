import type { Metadata } from 'next';
import Link from 'next/link';
import { Orbit } from 'lucide-react';
import { NewPasswordForm } from '@/components/new-password-form';

export const metadata: Metadata = { title: 'New password', robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return (
    <main className="form-wrap">
      <Link href="/" className="brand"><span className="brand-icon"><Orbit size={18} /></span>astroiq</Link>
      <section className="form-card glass" style={{ marginTop: 25 }}>
        <span className="eyebrow">New password</span>
        <h1>Choose a new password</h1>
        <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>Use at least 8 characters.</p>
        <NewPasswordForm />
      </section>
    </main>
  );
}
