import type { Business } from './types';
import { BUSINESSES, BUSINESS_BY_ID } from './businesses';
import { CATEGORY_BY_SLUG } from './categories';
import { CITY_BY_SLUG } from './cities';

export interface GridFilters {
  city?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  hasPhotos?: boolean;
  openNow?: boolean;
}

export type SortKey = 'relevance' | 'newest' | 'rating' | 'alpha';

const PLAN_RANK: Record<Business['plan'], number> = { lifetime: 3, premium: 2, basic: 1, none: 0 };

export function getBusiness(id: number): Business | undefined {
  return BUSINESS_BY_ID[id];
}

export function byCategory(slug: string): Business[] {
  return BUSINESSES.filter((b) => b.categorySlugs.includes(slug));
}

export function byCity(slug: string): Business[] {
  return BUSINESSES.filter((b) => b.citySlug === slug);
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

/** Open-now status for a Business, given a reference time (defaults to now). */
export function openStatus(b: Business, now = new Date()): { open: boolean; label: string } {
  const day = DAY_KEYS[now.getDay()];
  const today = b.hours[day];
  if (!today) return { open: false, label: 'Closed today' };
  const [oh, om] = today[0].split(':').map(Number);
  const [ch, cm] = today[1].split(':').map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  const openM = oh * 60 + om;
  const closeM = ch * 60 + cm;
  if (mins >= openM && mins < closeM) return { open: true, label: `Open now · closes ${today[1]}` };
  if (mins < openM) return { open: false, label: `Opens ${today[0]}` };
  return { open: false, label: `Closed · opens ${today[0]} tomorrow` };
}

export function applyFilters(list: Business[], f: GridFilters): Business[] {
  return list.filter((b) => {
    if (f.city && b.citySlug !== f.city) return false;
    if (f.minRating && b.rating < f.minRating) return false;
    if (f.verifiedOnly && b.verify === 'none') return false;
    if (f.hasPhotos && b.photos.length === 0) return false;
    if (f.openNow && !openStatus(b).open) return false;
    return true;
  });
}

export function sortBusinesses(list: Business[], sort: SortKey): Business[] {
  const arr = [...list];
  switch (sort) {
    case 'newest':
      return arr.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    case 'rating':
      return arr.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case 'alpha':
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case 'relevance':
    default:
      // Featured (paid) first, then rating — honest pinning, clearly labelled in UI.
      return arr.sort(
        (a, b) => PLAN_RANK[b.plan] - PLAN_RANK[a.plan] || b.rating - a.rating,
      );
  }
}

export function isFeatured(b: Business): boolean {
  return b.plan === 'premium' || b.plan === 'lifetime';
}

/** Recently added/updated companies for the homepage feed. */
export function recentCompanies(limit = 12): Business[] {
  return [...BUSINESSES]
    .filter((b) => b.status !== 'active')
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, limit);
}

export interface SearchResult {
  companies: Business[];
  matchedKeyword?: string;
  matchedCategory?: string;
}

export function search(query: string, cityQuery?: string): SearchResult {
  const q = query.trim().toLowerCase();
  const city = cityQuery?.trim().toLowerCase();
  let companies = BUSINESSES;

  if (city) {
    companies = companies.filter(
      (b) =>
        CITY_BY_SLUG[b.citySlug]?.name.toLowerCase().includes(city) ||
        b.citySlug.includes(city) ||
        b.address.toLowerCase().includes(city),
    );
  }

  let matchedCategory: string | undefined;
  let matchedKeyword: string | undefined;

  if (q) {
    const catHit = Object.values(CATEGORY_BY_SLUG).find(
      (c) => c.name.toLowerCase().includes(q) || c.slug.includes(q) || c.nameJa.includes(query),
    );
    if (catHit) matchedCategory = catHit.slug;

    companies = companies.filter((b) => {
      if (b.name.toLowerCase().includes(q) || b.nameJa.includes(query)) return true;
      if (b.categorySlugs.some((cs) => cs.includes(q) || CATEGORY_BY_SLUG[cs]?.name.toLowerCase().includes(q))) return true;
      const kw = b.keywords.find((k) => k.includes(q));
      if (kw) {
        matchedKeyword = matchedKeyword ?? kw;
        return true;
      }
      return false;
    });
  }

  return { companies: sortBusinesses(companies, 'relevance'), matchedKeyword, matchedCategory };
}

export function paginate<T>(list: T[], page: number, per = 12): { items: T[]; page: number; pages: number; total: number } {
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / per));
  const p = Math.min(Math.max(1, page), pages);
  return { items: list.slice((p - 1) * per, p * per), page: p, pages, total };
}
