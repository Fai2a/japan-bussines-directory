// Domain types. These mirror the Prisma models in prisma/schema.prisma so the
// in-repo seed data layer and a real Postgres/Prisma backend stay compatible.

export type CategoryGroupKey =
  | 'food'
  | 'health'
  | 'trades'
  | 'pro'
  | 'retail'
  | 'edu'
  | 'auto'
  | 'travel';

export interface CategoryGroup {
  key: CategoryGroupKey;
  name: string;
  nameJa: string;
  hue: string; // matches tailwind grp.* token
}

export interface Category {
  slug: string;
  name: string;
  nameJa: string;
  group: CategoryGroupKey;
  count: number; // listings in this category
  image: string; // real photo thumbnail (Unsplash)
  blurb: string;
}

export interface Prefecture {
  slug: string;
  name: string;
  nameJa: string;
}

export interface City {
  slug: string;
  name: string;
  nameJa: string;
  prefecture: string; // prefecture slug
  count: number;
  image: string;
}

export type PlanTier = 'none' | 'basic' | 'premium' | 'lifetime';
export type VerifyTier = 'none' | 'community' | 'admin';

export interface Photo {
  url: string;
  alt: string;
  credit?: string;
}

export interface Product {
  name: string;
  price: number; // JPY
  blurb: string;
}

export interface JobOffer {
  title: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  salaryMin: number;
  salaryMax: number;
}

export interface Review {
  author: string;
  rating: number; // 1..5
  date: string; // ISO
  text: string;
  receiptVerified?: boolean;
  ownerReply?: { date: string; text: string };
}

export interface Business {
  id: number;
  slug: string; // used in /company/[id]/[slug]
  name: string;
  nameJa: string;
  categorySlugs: string[];
  citySlug: string;
  prefecture: string;
  address: string;
  addressJa: string;
  lat: number;
  lng: number;
  phone: string;
  website?: string;
  email: string;
  established: number;
  employees: number;
  manager: string;
  corporateNumber: string; // 法人番号 (13 digits)
  hours: Record<string, [string, string] | null>; // mon..sun -> [open, close] | null = closed
  plan: PlanTier;
  verify: VerifyTier;
  rating: number;
  reviewCount: number;
  photos: Photo[];
  products: Product[];
  jobs: JobOffer[];
  reviews: Review[];
  keywords: string[];
  status: 'new' | 'updated' | 'active';
  updatedAt: string; // ISO
  blurb: string;
}
