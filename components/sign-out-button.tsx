'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
export function SignOutButton(){const [busy,setBusy]=useState(false);const router=useRouter();async function signOut(){setBusy(true);try{const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)throw new Error('Authentication configuration is missing.');const supabase=createBrowserClient(url,key);const {error}=await supabase.auth.signOut();if(error)throw error;router.push('/');router.refresh();}catch(e){console.error('sign_out_failed',e instanceof Error?e.message:'unknown');setBusy(false);}}return <button className="side-link" style={{width:'100%',border:0,background:'transparent',cursor:'pointer',textAlign:'left'}} onClick={signOut} disabled={busy}>{busy?'Signing out…':'Sign out'}</button>}
