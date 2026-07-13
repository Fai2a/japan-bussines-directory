import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

async function ownedBusiness(userId: string) {
  return db.business.findFirst({
    where: { ownerId: userId },
    include: {
      city: true,
      categories: { include: { category: true } },
      keywords: true,
      photos: true,
      products: true,
      jobs: true,
      reviews: { orderBy: { createdAt: 'desc' }, include: { ownerReply: true } },
    },
  });
}

/** GET /api/owner/business — the signed-in owner's listing with children. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const b = await ownedBusiness(session.user.id);
  if (!b) return NextResponse.json({ error: 'No listing linked to this account. Claim one first.' }, { status: 404 });

  return NextResponse.json({
    business: {
      id: b.id,
      slug: b.slug,
      name: b.name,
      nameJa: b.nameJa,
      blurb: b.blurb,
      phone: b.phone,
      website: b.website ?? '',
      email: b.email,
      address: b.address,
      employees: b.employees,
      plan: b.plan.toLowerCase(),
      status: b.status,
      city: b.city.name,
      category: b.categories[0]?.category.name ?? '',
      categoryCount: b.categories.length,
      keywordCount: b.keywords.length,
      photos: b.photos.map((p) => ({ url: p.url, alt: p.alt })),
      productCount: b.products.length,
      jobCount: b.jobs.length,
      reviews: b.reviews.map((r) => ({
        id: r.id,
        authorName: r.authorName,
        rating: r.rating,
        text: r.text,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        ownerReply: r.ownerReply ? { text: r.ownerReply.text, createdAt: r.ownerReply.createdAt.toISOString() } : null,
      })),
    },
  });
}

/**
 * PATCH /api/owner/business — update editable fields on the owned listing.
 * Changes apply immediately; verified listings keep their badge (a real
 * deployment would queue a re-check for sensitive fields).
 */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const b = await db.business.findFirst({ where: { ownerId: session.user.id } });
  if (!b) return NextResponse.json({ error: 'No listing linked to this account.' }, { status: 404 });

  let body: { blurb?: string; phone?: string; website?: string; email?: string; address?: string; employees?: string | number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.blurb === 'string' && body.blurb.trim().length >= 20) data.blurb = body.blurb.trim();
  if (typeof body.phone === 'string' && body.phone.trim()) data.phone = body.phone.trim();
  if (typeof body.website === 'string') data.website = body.website.trim() || null;
  if (typeof body.email === 'string' && body.email.trim()) data.email = body.email.trim();
  if (typeof body.address === 'string' && body.address.trim()) data.address = body.address.trim();
  const emp = Number(body.employees);
  if (Number.isInteger(emp) && emp > 0) data.employees = emp;

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: 'Nothing valid to update.' }, { status: 400 });

  await db.business.update({ where: { id: b.id }, data });
  await db.auditLog.create({
    data: { actorId: session.user.id, action: 'business.edit', target: String(b.id), meta: JSON.stringify(Object.keys(data)) },
  });
  return NextResponse.json({ ok: true });
}
