import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Astroiq — Financial clarity for better decisions', template: '%s · Astroiq' },
  description: 'A focused financial intelligence workspace for clearer business decisions.',
  applicationName: 'Astroiq',
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-GB"><body>{children}</body></html>;
}
