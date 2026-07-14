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

/** GET /api/admin/reports — pending listing-problem reports. */
export async function GET() {
  const session = await requireModerator();
  if (!session) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const rows = await db.report.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: { business: { select: { id: true, slug: true, name: true } } },
    take: 50,
  });

  return NextResponse.json({
    reports: rows.map((r) => ({
      id: r.id,
      reason: r.reason,
      details: r.details,
      email: r.email,
      business: r.business,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

/**
 * PATCH /api/admin/reports — resolve or dismiss a report.
 * Body: { id, action: "resolve" | "dismiss" }
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
  if (!id || (action !== 'resolve' && action !== 'dismiss'))
    return NextResponse.json({ error: 'Provide id and action (resolve|dismiss).' }, { status: 400 });

  const report = await db.report.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });

  await db.report.update({ where: { id }, data: { status: action === 'resolve' ? 'RESOLVED' : 'DISMISSED' } });
  await db.auditLog.create({
    data: { actorId: session.user.id, action: `report.${action}`, target: id, meta: JSON.stringify({ businessId: report.businessId }) },
  });

  return NextResponse.json({ ok: true });
}
