'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ProfileForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: name.trim() }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Unable to update.');
      return;
    }
    setMessage('Saved.');
    router.refresh();
  }

  return (
    <form onSubmit={save}>
      <label className="field">
        <span>Display name</span>
        <input value={name} onChange={e => setName(e.target.value)} maxLength={120} placeholder="Your name" />
      </label>
      {error ? <div className="alert" role="alert">{error}</div> : null}
      {message ? <div className="success-notice">{message}</div> : null}
      <button className="btn btn-primary" disabled={busy} type="submit" style={{ marginTop: 8 }}>{busy ? 'Saving…' : 'Save name'}</button>
    </form>
  );
}
