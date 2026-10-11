import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots { const base = process.env.NEXT_PUBLIC_APP_URL || 'https://astroiq.example'; return { rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard','/account','/api/','/auth/','/sign-in','/sign-up'] }], sitemap: `${base}/sitemap.xml` }; }
