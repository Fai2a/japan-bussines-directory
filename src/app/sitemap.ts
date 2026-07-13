import type { MetadataRoute } from 'next';
import { BUSINESSES } from '@/lib/businesses';
import { CATEGORIES } from '@/lib/categories';
import { CITIES } from '@/lib/cities';

const BASE = 'https://nihonpages.example.jp';

/** English is unprefixed (localePrefix: "as-needed"); Japanese lives under /ja. */
function withAlternates(path: string) {
  return { en: `${BASE}${path}`, ja: `${BASE}/ja${path}` };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/categories', '/locations', '/saas', '/holidays', '/get-listed', '/contact'].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: p === '' ? 1 : 0.7,
    alternates: { languages: withAlternates(p) },
  }));

  const categoryRoutes = CATEGORIES.map((c) => ({
    url: `${BASE}/category/${c.slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.8,
    alternates: { languages: withAlternates(`/category/${c.slug}`) },
  }));

  const cityRoutes = CITIES.map((c) => ({
    url: `${BASE}/location/${c.slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.8,
    alternates: { languages: withAlternates(`/location/${c.slug}`) },
  }));

  const companyRoutes = BUSINESSES.map((b) => ({
    url: `${BASE}/company/${b.id}/${b.slug}`,
    lastModified: new Date(b.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
    alternates: { languages: withAlternates(`/company/${b.id}/${b.slug}`) },
  }));

  return [...staticRoutes, ...categoryRoutes, ...cityRoutes, ...companyRoutes];
}
