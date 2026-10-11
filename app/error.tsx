'use client';
import { useEffect } from 'react';
export default function ErrorPage({error,reset}:{error:Error & {digest?:string};reset:()=>void}){useEffect(()=>{console.error('astroiq_ui_error',error.digest??'unknown')},[error]);return <main className="container section" style={{textAlign:'center',minHeight:'70vh'}}><span className="eyebrow">TEMPORARY ERROR</span><h1 style={{fontSize:42}}>Something didn't load.</h1><p className="muted">Your account and payment records are not changed by this page error.</p><button className="btn btn-primary" onClick={()=>reset()}>Try again</button></main>}
