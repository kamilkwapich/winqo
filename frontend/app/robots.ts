import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_BASE_URL || 'https://winqo.app';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/app/', '/admin/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
