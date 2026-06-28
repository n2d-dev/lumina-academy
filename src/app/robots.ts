import type { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/constants';

/**
 * /robots.txt — sinh tự động.
 * Chặn bot vào các khu vực riêng tư (admin, learn, teach, api, account).
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL ?? SITE_CONFIG.url;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/teach', '/learn', '/api', '/checkout', '/cart', '/settings', '/profile'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
