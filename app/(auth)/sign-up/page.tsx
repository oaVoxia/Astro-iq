import type { Metadata } from 'next';
import Link from 'next/link';
import { Orbit } from 'lucide-react';
import { AuthForm } from '@/components/auth-form';
export const metadata: Metadata = { title: 'Create account', robots: { index: false, follow: false } };
export default function SignUpPage(){return <main className="form-wrap"><Link href="/" className="brand"><span className="brand-icon"><Orbit size={21}/></span>astroiq</Link><section className="form-card glass" style={{marginTop:25}}><span className="eyebrow">YOUR WORKSPACE STARTS HERE</span><h1>Create your account</h1><p className="muted" style={{fontSize:14,lineHeight:1.6}}>Sign up to choose a one-time access pass and keep your work together.</p><AuthForm mode="sign-up"/></section><p className="muted" style={{fontSize:12,textAlign:'center',marginTop:20}}><Link href="/">← Back to website</Link></p></main>;}
