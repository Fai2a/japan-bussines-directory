import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

/** GET /api/businesses/search?q= — lightweight lookup for the claim flow. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ results: [] });

  const rows = await db.business.findMany({
    where: { OR: [{ name: { contains: q } }, { nameJa: { contains: q } }] },
    take: 6,
    select: {
      id: true, slug: true, name: true, nameJa: true, address: true, verify: true, ownerId: true,
      city: { select: { name: true } },
      categories: { take: 1, select: { category: { select: { name: true, group: true } } } },
    },
  });

  return NextResponse.json({
    results: rows.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      nameJa: b.nameJa,
      address: b.address,
      verify: b.verify.toLowerCase(),
      claimed: Boolean(b.ownerId),
      city: b.city.name,
      category: b.categories[0]?.category.name ?? '',
      group: b.categories[0]?.category.group ?? 'pro',
    })),
  });
}
