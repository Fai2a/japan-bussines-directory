import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

/** GET /api/favorites — the signed-in user's favorite business ids. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const rows = await db.favorite.findMany({
    where: { userId: session.user.id },
    select: { businessId: true },
  });
  return NextResponse.json({ ids: rows.map((r) => r.businessId) });
}

/**
 * POST /api/favorites — toggle one favorite, or bulk-merge guest favorites.
 * Body: { businessId } to toggle, or { merge: number[] } to import
 * localStorage favorites after sign-in.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  let body: { businessId?: number; merge?: number[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const userId = session.user.id;

  if (Array.isArray(body.merge)) {
    const ids = body.merge.filter((n) => Number.isInteger(n)).slice(0, 500);
    const existing = await db.business.findMany({ where: { id: { in: ids } }, select: { id: true } });
    for (const { id } of existing) {
      await db.favorite.upsert({
        where: { userId_businessId: { userId, businessId: id } },
        create: { userId, businessId: id },
        update: {},
      });
    }
    const rows = await db.favorite.findMany({ where: { userId }, select: { businessId: true } });
    return NextResponse.json({ ids: rows.map((r) => r.businessId) });
  }

  const businessId = Number(body.businessId);
  if (!businessId) return NextResponse.json({ error: 'businessId required.' }, { status: 400 });

  const existing = await db.favorite.findUnique({
    where: { userId_businessId: { userId, businessId } },
  });
  if (existing) {
    await db.favorite.delete({ where: { userId_businessId: { userId, businessId } } });
    return NextResponse.json({ saved: false });
  }
  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });
  await db.favorite.create({ data: { userId, businessId } });
  return NextResponse.json({ saved: true });
}
