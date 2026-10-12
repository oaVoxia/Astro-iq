'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type ProfileValues = {
  displayName: string;
  company: string;
  jobTitle: string;
  timezone: string;
  bio: string;
};

const ZONES = ['Europe/London', 'Europe/Paris', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles', 'Asia/Singapore', 'UTC'];

export function ProfileForm({ initial }: { initial: ProfileValues }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function set(key: keyof ProfileValues, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        displayName: form.displayName.trim(),
        company: form.company.trim(),
        jobTitle: form.jobTitle.trim(),
        timezone: form.timezone,
        bio: form.bio.trim(),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Unable to update.');
      return;
    }
    setMessage('Profile saved.');
    router.refresh();
  }

  return (
    <form onSubmit={save}>
      <label className="field"><span>Display name</span><input value={form.displayName} onChange={e => set('displayName', e.target.value)} maxLength={120} /></label>
      <label className="field"><span>Company</span><input value={form.company} onChange={e => set('company', e.target.value)} maxLength={120} /></label>
      <label className="field"><span>Job title</span><input value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} maxLength={80} /></label>
      <label className="field">
        <span>Timezone</span>
        <select value={form.timezone} onChange={e => set('timezone', e.target.value)}>
          {ZONES.map(zone => <option key={zone} value={zone}>{zone}</option>)}
        </select>
      </label>
      <label className="field"><span>Bio</span><textarea value={form.bio} onChange={e => set('bio', e.target.value)} maxLength={500} rows={4} /></label>
      {error ? <div className="alert" role="alert">{error}</div> : null}
      {message ? <div className="success-notice">{message}</div> : null}
      <button className="btn btn-primary" disabled={busy} type="submit" style={{ marginTop: 8 }}>{busy ? 'Saving…' : 'Save profile'}</button>
    </form>
  );
}
