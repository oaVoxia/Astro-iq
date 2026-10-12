'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AvatarUpload({ initialUrl, name }: { initialUrl: string | null; name: string }) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const letter = (name || '?').slice(0, 1).toUpperCase();

  async function upload(file: File) {
    setError('');
    setBusy(true);
    const body = new FormData();
    body.set('file', file);
    const res = await fetch('/api/me/avatar', { method: 'POST', body });
    setBusy(false);
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.error || 'Unable to upload.');
      return;
    }
    const payload = await res.json();
    setUrl(payload.avatarUrl);
    router.refresh();
  }

  async function remove() {
    setError('');
    setBusy(true);
    const res = await fetch('/api/me/avatar', { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.error || 'Unable to remove.');
      return;
    }
    setUrl(null);
    router.refresh();
  }

  return (
    <div className="avatar-row">
      <div className="avatar" aria-hidden="true">
        {url ? <img src={url} alt="" /> : <span>{letter}</span>}
      </div>
      <div>
        <label className="btn btn-secondary">
          {busy ? 'Working…' : 'Upload photo'}
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) upload(file); e.target.value = ''; }} />
        </label>
        {url ? <button className="btn btn-secondary" type="button" disabled={busy} onClick={remove} style={{ marginLeft: 8 }}>Remove</button> : null}
        <p className="muted" style={{ fontSize: 12, margin: '8px 0 0' }}>JPG, PNG, or WebP. 2 MB max.</p>
        {error ? <div className="alert" role="alert" style={{ marginTop: 8 }}>{error}</div> : null}
      </div>
    </div>
  );
}
