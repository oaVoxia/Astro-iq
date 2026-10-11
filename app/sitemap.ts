import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap { const base = process.env.NEXT_PUBLIC_APP_URL || 'https://astroiq.example'; return ['', '/features', '/pricing', '/privacy', '/terms', '/refunds'].map(path => ({ url: `${base}${path}`, lastModified: new Date() })); }
