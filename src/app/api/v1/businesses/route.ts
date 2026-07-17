import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { authenticateApiKey } from '@/lib/server/apiKey';

const MAX_LIMIT = 50;

/**
 * GET /api/v1/businesses — the public, read-only Data Hub API (the
 * "Read-only public API" feature on the Enterprise plan). Requires
 * `Authorization: Bearer <key>` from /api/account/api-keys.
 *
 * Query params: category (slug), city (slug), q (name search), page, limit (<=50).
 */
export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const category = url.searchParams.get('category') ?? undefined;
  const city = url.searchParams.get('city') ?? undefined;
  const q = url.searchParams.get('q')?.trim() ?? undefined;
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(url.searchParams.get('limit')) || 20));

  const where = {
    status: 'ACTIVE' as const,
    ...(category ? { categories: { some: { category: { slug: category } } } } : {}),
    ...(city ? { city: { slug: city } } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
  };

  const [total, rows] = await Promise.all([
    db.business.count({ where }),
    db.business.findMany({
      where,
      orderBy: { id: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        city: { include: { prefecture: true } },
        categories: { include: { category: true } },
      },
    }),
  ]);

  return NextResponse.json({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    results: rows.map((b) => ({
      id: b.id,
      name: b.name,
      nameJa: b.nameJa,
      city: b.city.name,
      prefecture: b.city.prefecture.name,
      categories: b.categories.map((c) => c.category.name),
      phone: b.phone,
      email: b.email,
      website: b.website,
      rating: b.rating,
      reviewCount: b.reviewCount,
      established: b.established,
      employees: b.employees,
      plan: b.plan,
      updatedAt: b.updatedAt.toISOString(),
    })),
  });
}
