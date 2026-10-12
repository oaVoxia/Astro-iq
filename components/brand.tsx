import Link from 'next/link';
import { Orbit } from 'lucide-react';
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Astroiq home">
      <span className="brand-icon"><Orbit size={18} strokeWidth={2.2} /></span>
      <span>astroiq</span>
    </Link>
  );
}
