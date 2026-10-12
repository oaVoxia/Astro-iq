'use client';

import { useState, type FormEvent } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export function PasswordForm() {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) throw new Error('Authentication is not configured.');
      const supabase = createBrowserClient(url, key);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Sign in again before changing your password.');
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
      if (verifyError) throw new Error('Current password is incorrect.');
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setCurrent('');
      setPassword('');
      setMessage('Password updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label className="field">
        <span>Current password</span>
        <input type="password" value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password" required />
      </label>
      <label className="field">
        <span>New password</span>
        <input type="password" minLength={8} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" required />
      </label>
      {error ? <div className="alert" role="alert">{error}</div> : null}
      {message ? <div className="success-notice">{message}</div> : null}
      <button className="btn btn-secondary" disabled={busy} type="submit" style={{ marginTop: 8 }}>{busy ? 'Updating…' : 'Update password'}</button>
    </form>
  );
}
