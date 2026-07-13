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

/** GET /api/admin/removals — pending removal requests. */
export async function GET() {
  const session = await requireModerator();
  if (!session) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const rows = await db.removalRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: { business: { select: { id: true, slug: true, name: true } } },
    take: 50,
  });

  return NextResponse.json({
    removals: rows.map((r) => ({
      id: r.id,
      email: r.email,
      reason: r.reason,
      business: r.business,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

/**
 * PATCH /api/admin/removals — approve (suspend the listing) or decline.
 * Body: { id, action: "approve" | "decline" }
 */
export async function PATCH(req: Request) {
  const session = await requireModerator();
  if (!session) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  let body: { id?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const { id, action } = body;
  if (!id || (action !== 'approve' && action !== 'decline'))
    return NextResponse.json({ error: 'Provide id and action (approve|decline).' }, { status: 400 });

  const removal = await db.removalRequest.findUnique({ where: { id } });
  if (!removal) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });

  await db.removalRequest.update({ where: { id }, data: { status: action === 'approve' ? 'APPROVED' : 'REJECTED', verified: action === 'approve' } });
  if (action === 'approve') {
    await db.business.update({ where: { id: removal.businessId }, data: { status: 'SUSPENDED' } });
  }
  await db.auditLog.create({
    data: { actorId: session.user.id, action: `removal.${action}`, target: id, meta: JSON.stringify({ businessId: removal.businessId }) },
  });

  return NextResponse.json({ ok: true });
}
