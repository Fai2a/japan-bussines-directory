import 'server-only';
import { db } from './db';
import type { Business, PlanTier, VerifyTier } from '@/lib/types';
import type { Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// DB-backed queries. Each returns the same `Business` shape the UI has used
// since Phase 1, so pages and components need no changes — only their data
// source moves from the in-memory seed to Prisma.
// ---------------------------------------------------------------------------

const businessInclude = {
  city: { include: { prefecture: true } },
  categories: { include: { category: true } },
  keywords: true,
  photos: true,
  products: true,
  jobs: true,
  reviews: {
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'desc' as const },
    include: { ownerReply: true },
  },
} satisfies Prisma.BusinessInclude;

type Row = Prisma.BusinessGetPayload<{ include: typeof businessInclude }>;

function toBusiness(row: Row): Business {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameJa: row.nameJa,
    categorySlugs: row.categories.map((c) => c.category.slug),
    citySlug: row.city.slug,
    prefecture: row.city.prefecture.slug,
    address: row.address,
    addressJa: row.addressJa,
    lat: row.lat,
    lng: row.lng,
    phone: row.phone,
    website: row.website ?? undefined,
    email: row.email,
    established: row.established,
    employees: row.employees,
    manager: row.manager,
    corporateNumber: row.corporateNumber ?? '',
    hours: JSON.parse(row.hours) as Business['hours'],
    plan: row.plan.toLowerCase() as PlanTier,
    verify: row.verify.toLowerCase() as VerifyTier,
    rating: row.rating,
    reviewCount: row.reviewCount,
    photos: row.photos.map((p) => ({ url: p.url, alt: p.alt, credit: p.credit ?? undefined })),
    products: row.products.map((p) => ({ name: p.name, price: p.price, blurb: p.blurb })),
    jobs: row.jobs.map((j) => ({
      title: j.title,
      type: j.type as Business['jobs'][number]['type'],
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
    })),
    reviews: row.reviews.map((r) => ({
      author: r.authorName,
      rating: r.rating,
      date: r.createdAt.toISOString(),
      text: r.text,
      receiptVerified: r.receiptVerified,
      ownerReply: r.ownerReply
        ? { date: r.ownerReply.createdAt.toISOString(), text: r.ownerReply.text }
        : undefined,
    })),
    keywords: row.keywords.map((k) => k.value),
    status: daysSince(row.updatedAt) < 10 ? 'new' : daysSince(row.updatedAt) < 30 ? 'updated' : 'active',
    updatedAt: row.updatedAt.toISOString(),
    blurb: row.blurb,
  };
}

function daysSince(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export async function dbGetBusiness(id: number): Promise<Business | undefined> {
  const row = await db.business.findFirst({
    where: { id, status: { in: ['ACTIVE', 'IN_REVIEW'] } },
    include: businessInclude,
  });
  return row ? toBusiness(row) : undefined;
}

export async function dbByCategory(slug: string): Promise<Business[]> {
  const rows = await db.business.findMany({
    where: { status: 'ACTIVE', categories: { some: { category: { slug } } } },
    include: businessInclude,
  });
  return rows.map(toBusiness);
}

export async function dbByCity(slug: string): Promise<Business[]> {
  const rows = await db.business.findMany({
    where: { status: 'ACTIVE', city: { slug } },
    include: businessInclude,
  });
  return rows.map(toBusiness);
}

export async function dbAllBusinesses(): Promise<Business[]> {
  const rows = await db.business.findMany({ where: { status: 'ACTIVE' }, include: businessInclude });
  return rows.map(toBusiness);
}

export async function dbRecentCompanies(limit = 12): Promise<Business[]> {
  const rows = await db.business.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    include: businessInclude,
  });
  return rows.map(toBusiness).filter((b) => b.status !== 'active');
}

export async function dbSearch(query: string, cityQuery?: string): Promise<Business[]> {
  const q = query.trim();
  const city = cityQuery?.trim();
  const rows = await db.business.findMany({
    where: {
      status: 'ACTIVE',
      AND: [
        city
          ? { OR: [{ city: { name: { contains: city } } }, { city: { slug: { contains: city.toLowerCase() } } }, { address: { contains: city } }] }
          : {},
        q
          ? {
              OR: [
                { name: { contains: q } },
                { nameJa: { contains: q } },
                { categories: { some: { category: { name: { contains: q } } } } },
                { keywords: { some: { value: { contains: q } } } },
              ],
            }
          : {},
      ],
    },
    include: businessInclude,
  });
  return rows.map(toBusiness);
}
