import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Orbit } from 'lucide-react';
import { AuthForm } from '@/components/auth-form';
export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } };
export default function SignInPage(){return <main className="form-wrap"><Link href="/" className="brand"><span className="brand-icon"><Orbit size={21}/></span>astroiq</Link><section className="form-card glass" style={{marginTop:25}}><span className="eyebrow">WELCOME BACK</span><h1>Sign in to Astroiq</h1><p className="muted" style={{fontSize:14,lineHeight:1.6}}>Pick up where you left off in your workspace.</p><Suspense fallback={<p className="muted">Loading sign-in…</p>}><AuthForm mode="sign-in"/></Suspense></section><p className="muted" style={{fontSize:12,textAlign:'center',marginTop:20}}><Link href="/" >← Back to website</Link></p></main>;}
