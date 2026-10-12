'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export function NewPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) throw new Error('Authentication is not configured.');
      const supabase = createBrowserClient(url, key);
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="password">New password</label>
        <input id="password" type="password" required minLength={8} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
      </div>
      {error ? <p className="notice" role="alert">{error}</p> : null}
      <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
    </form>
  );
}
