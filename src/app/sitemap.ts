import type { MetadataRoute } from 'next';
import { BUSINESSES } from '@/lib/businesses';
import { CATEGORIES } from '@/lib/categories';
import { CITIES } from '@/lib/cities';

const BASE = 'https://nihonpages.example.jp';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/categories', '/locations', '/saas', '/holidays', '/get-listed', '/contact'].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: p === '' ? 1 : 0.7,
  }));

  const categoryRoutes = CATEGORIES.map((c) => ({
    url: `${BASE}/category/${c.slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const cityRoutes = CITIES.map((c) => ({
    url: `${BASE}/location/${c.slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const companyRoutes = BUSINESSES.map((b) => ({
    url: `${BASE}/company/${b.id}/${b.slug}`,
    lastModified: new Date(b.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...cityRoutes, ...companyRoutes];
}
