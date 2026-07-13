import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

async function requireModerator() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user || (role !== 'ADMIN' && role !== 'MODERATOR')) return null;
  return session;
}

/** GET /api/admin/listings — businesses awaiting review (new submissions). */
export async function GET() {
  const session = await requireModerator();
  if (!session) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const rows = await db.business.findMany({
    where: { status: 'IN_REVIEW' },
    orderBy: { createdAt: 'asc' },
    include: {
      city: true,
      categories: { take: 1, include: { category: true } },
      owner: { select: { name: true, email: true } },
    },
    take: 50,
  });

  return NextResponse.json({
    listings: rows.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      plan: b.plan.toLowerCase(),
      city: b.city.name,
      category: b.categories[0]?.category.name ?? '',
      owner: b.owner?.name ?? b.owner?.email ?? null,
      createdAt: b.createdAt.toISOString(),
    })),
  });
}

/**
 * PATCH /api/admin/listings — publish or reject a pending submission.
 * Body: { id, action: "approve" | "reject" }
 */
export async function PATCH(req: Request) {
  const session = await requireModerator();
  if (!session) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  let body: { id?: number; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const id = Number(body.id);
  const action = body.action;
  if (!id || (action !== 'approve' && action !== 'reject'))
    return NextResponse.json({ error: 'Provide id and action (approve|reject).' }, { status: 400 });

  const business = await db.business.findUnique({ where: { id } });
  if (!business || business.status !== 'IN_REVIEW')
    return NextResponse.json({ error: 'Listing not found or not pending.' }, { status: 404 });

  await db.business.update({ where: { id }, data: { status: action === 'approve' ? 'ACTIVE' : 'SUSPENDED' } });
  await db.auditLog.create({
    data: { actorId: session.user.id, action: `listing.${action}`, target: String(id) },
  });

  return NextResponse.json({ ok: true });
}
