import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/account', '/get-listed', '/search'] },
    ],
    sitemap: 'https://nihonpages.example.jp/sitemap.xml',
  };
}
