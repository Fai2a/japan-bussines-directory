import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

/** GET /api/businesses/[id] — minimal claim-flow lookup by id. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });

  const b = await db.business.findUnique({
    where: { id },
    select: {
      id: true, slug: true, name: true, nameJa: true, address: true, verify: true, ownerId: true,
      city: { select: { name: true } },
      categories: { take: 1, select: { category: { select: { name: true, group: true } } } },
    },
  });
  if (!b) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });

  return NextResponse.json({
    id: b.id, slug: b.slug, name: b.name, nameJa: b.nameJa, address: b.address,
    verify: b.verify.toLowerCase(), claimed: Boolean(b.ownerId),
    city: b.city.name, category: b.categories[0]?.category.name ?? '', group: b.categories[0]?.category.group ?? 'pro',
  });
}
