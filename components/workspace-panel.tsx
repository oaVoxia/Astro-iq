'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type MetricRow = {
  id: string;
  period_start: string;
  net_position_pence: number;
  revenue_pence: number;
  expenses_pence: number;
};

export type NoteRow = {
  id: string;
  title: string;
  created_at: string;
};

function gbp(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
}

function toPence(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export function WorkspacePanel({ metrics, notes }: { metrics: MetricRow[]; notes: NoteRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [metric, setMetric] = useState({ start: '', end: '', net: '', revenue: '', expenses: '', cash: '', burn: '' });
  const [note, setNote] = useState({ title: '', body: '' });

  async function saveMetric(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const net = toPence(metric.net);
    if (!metric.start || !metric.end || net == null) {
      setError('Period dates and net position are required.');
      return;
    }
    setBusy(true);
    const res = await fetch('/api/metrics', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        period_start: metric.start,
        period_end: metric.end,
        net_position_pence: net,
        revenue_pence: toPence(metric.revenue) ?? 0,
        expenses_pence: toPence(metric.expenses) ?? 0,
        cash_pence: toPence(metric.cash) ?? 0,
        burn_pence: toPence(metric.burn) ?? 0,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Unable to save period.');
      return;
    }
    setMetric({ start: '', end: '', net: '', revenue: '', expenses: '', cash: '', burn: '' });
    router.refresh();
  }

  async function saveNote(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!note.title.trim() || !note.body.trim()) {
      setError('Title and note are required.');
      return;
    }
    setBusy(true);
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: note.title, body: note.body }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Unable to save note.');
      return;
    }
    setNote({ title: '', body: '' });
    router.refresh();
  }

  async function remove(path: string) {
    setError('');
    setBusy(true);
    const res = await fetch(path, { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Unable to delete.');
      return;
    }
    router.refresh();
  }

  return (
    <>
      {error ? <div className="alert" role="alert">{error}</div> : null}

      <h2 style={{ fontSize: 20, margin: '30px 0 14px' }}>Record a period</h2>
      <form className="glass form-grid" onSubmit={saveMetric}>
        <label className="field"><span>Start</span><input type="date" value={metric.start} onChange={e => setMetric({ ...metric, start: e.target.value })} required /></label>
        <label className="field"><span>End</span><input type="date" value={metric.end} onChange={e => setMetric({ ...metric, end: e.target.value })} required /></label>
        <label className="field"><span>Net (£)</span><input inputMode="decimal" value={metric.net} onChange={e => setMetric({ ...metric, net: e.target.value })} placeholder="84200" required /></label>
        <label className="field"><span>Revenue (£)</span><input inputMode="decimal" value={metric.revenue} onChange={e => setMetric({ ...metric, revenue: e.target.value })} /></label>
        <label className="field"><span>Expenses (£)</span><input inputMode="decimal" value={metric.expenses} onChange={e => setMetric({ ...metric, expenses: e.target.value })} /></label>
        <label className="field"><span>Cash (£)</span><input inputMode="decimal" value={metric.cash} onChange={e => setMetric({ ...metric, cash: e.target.value })} /></label>
        <label className="field"><span>Monthly burn (£)</span><input inputMode="decimal" value={metric.burn} onChange={e => setMetric({ ...metric, burn: e.target.value })} /></label>
        <div className="form-actions"><button className="btn btn-primary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save period'}</button></div>
      </form>

      <h2 style={{ fontSize: 20, margin: '30px 0 14px' }}>Recent periods</h2>
      <div className="table-wrap">
        {!metrics.length ? <div className="empty-state">No periods yet.</div> : (
          <table>
            <thead><tr><th>Period</th><th>Net</th><th>Revenue</th><th>Expenses</th><th></th></tr></thead>
            <tbody>
              {metrics.map(m => (
                <tr key={m.id}>
                  <td>{m.period_start}</td>
                  <td>{gbp(m.net_position_pence)}</td>
                  <td>{gbp(m.revenue_pence)}</td>
                  <td>{gbp(m.expenses_pence)}</td>
                  <td><button className="btn btn-secondary" type="button" disabled={busy} onClick={() => remove(`/api/metrics/${m.id}`)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 style={{ fontSize: 20, margin: '30px 0 14px' }}>Add a note</h2>
      <form className="glass note-form" onSubmit={saveNote}>
        <label className="field"><span>Title</span><input value={note.title} onChange={e => setNote({ ...note, title: e.target.value })} maxLength={120} required /></label>
        <label className="field"><span>Note</span><textarea value={note.body} onChange={e => setNote({ ...note, body: e.target.value })} maxLength={4000} rows={4} required /></label>
        <button className="btn btn-primary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save note'}</button>
      </form>

      <h2 style={{ fontSize: 20, margin: '30px 0 14px' }}>Notes</h2>
      <div className="table-wrap">
        {!notes.length ? <div className="empty-state">No notes yet.</div> : (
          <table>
            <thead><tr><th>Title</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {notes.map(n => (
                <tr key={n.id}>
                  <td>{n.title}</td>
                  <td>{new Date(n.created_at).toLocaleDateString('en-GB', { timeZone: 'UTC' })}</td>
                  <td><button className="btn btn-secondary" type="button" disabled={busy} onClick={() => remove(`/api/notes/${n.id}`)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
