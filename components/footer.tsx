import Link from 'next/link';
import { Brand } from '@/components/brand';
export function Footer() { return <footer className="footer"><div className="container footer-inner"><Brand/><span>© {new Date().getFullYear()} Astroiq. Clearer decisions start here.</span><span><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> · <Link href="/refunds">Refunds</Link></span></div></footer>; }
