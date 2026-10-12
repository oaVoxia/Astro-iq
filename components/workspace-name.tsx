'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function WorkspaceName({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const next = name.trim();
    if (next.length < 1 || next.length > 80) {
      setError('Name must be 1–80 characters.');
      return;
    }
    setBusy(true);
    setError('');
    const res = await fetch('/api/workspace', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: next }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Unable to rename.');
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button className="eyebrow" type="button" onClick={() => setEditing(true)}>
        <span className="dot" /> {initialName}
      </button>
    );
  }

  return (
    <form onSubmit={save} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <input value={name} onChange={e => setName(e.target.value)} maxLength={80} aria-label="Workspace name" style={{ maxWidth: 240 }} />
      <button className="btn btn-primary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save'}</button>
      <button className="btn btn-secondary" type="button" onClick={() => { setEditing(false); setName(initialName); }}>Cancel</button>
      {error ? <span className="alert">{error}</span> : null}
    </form>
  );
}
