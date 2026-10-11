'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

function getBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Authentication is not configured yet. Add Supabase public environment variables.');
  return createBrowserClient(url, key);
}
export function AuthForm({ mode }: { mode: 'sign-in'|'sign-up' }) {
  const [email,setEmail] = useState(''); const [password,setPassword] = useState(''); const [name,setName] = useState('');
  const [message,setMessage] = useState(''); const [error,setError] = useState(''); const [busy,setBusy] = useState(false);
  const router = useRouter(); const params = useSearchParams();
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage(''); setError('');
    try {
      const supabase = getBrowserClient();
      if (mode === 'sign-up') {
        const redirect = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`;
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: name.trim() }, emailRedirectTo: redirect } });
        if (authError) throw authError;
        if (!data.session) { setMessage('Check your email for a verification link. Your account is not signed in until verification is complete.'); }
        else { router.push('/dashboard'); router.refresh(); }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        const next = params.get('next');
        let destination = '/dashboard';
        if (next) {
          try {
            const target = new URL(next, window.location.origin);
            if (target.origin === window.location.origin) destination = `${target.pathname}${target.search}${target.hash}`;
          } catch { /* Keep the safe default destination. */ }
        }
        router.push(destination); router.refresh();
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} noValidate>
    {mode==='sign-up'&&<div className="field"><label htmlFor="name">Name (optional)</label><input id="name" name="name" autoComplete="name" maxLength={120} value={name} onChange={e=>setName(e.target.value)} /></div>}
    <div className="field"><label htmlFor="email">Work email</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} /></div>
    <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={mode==='sign-in'?'current-password':'new-password'} required minLength={8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} /></div>
    {error&&<p role="alert" className="notice">{error}</p>}{message&&<p role="status" className="notice success-notice">{message}</p>}
    <button className="btn btn-primary" style={{width:'100%',marginTop:8}} disabled={busy}>{busy?'Please wait…':mode==='sign-in'?'Sign in securely':'Create account'}</button>
    <p className="muted" style={{fontSize:12,lineHeight:1.6,marginTop:16}}>{mode==='sign-up'?'By creating an account, you agree to the published Terms and Privacy Policy.':'Use the email associated with your Astroiq account.'}</p>
    <p className="muted" style={{fontSize:13,marginTop:20}}>{mode==='sign-in'?<>New to Astroiq? <Link href="/sign-up" style={{color:'#b8adff'}}>Create an account</Link></>:<>Already registered? <Link href="/sign-in" style={{color:'#b8adff'}}>Sign in</Link></>}</p>
  </form>;
}
