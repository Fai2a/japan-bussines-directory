import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/account', '/get-listed', '/search', '/ja/account', '/ja/get-listed', '/ja/search'],
      },
    ],
    sitemap: 'https://nihonpages.example.jp/sitemap.xml',
  };
}
