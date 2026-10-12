import Link from 'next/link';
import { Brand } from '@/components/brand';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function Nav() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Brand />
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/features">Features</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/#faq">FAQ</Link>
          {user ? (
            <Link href="/dashboard" className="btn btn-primary">Workspace</Link>
          ) : (
            <>
              <Link href="/sign-in">Sign in</Link>
              <Link href="/sign-up" className="btn btn-primary">Get started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
