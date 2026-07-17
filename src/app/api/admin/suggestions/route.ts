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

/** GET /api/admin/suggestions — pending "suggest an edit" submissions. */
export async function GET() {
  const session = await requireModerator();
  if (!session) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const rows = await db.editSuggestion.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: { business: { select: { id: true, slug: true, name: true } }, author: { select: { name: true, email: true } } },
    take: 50,
  });

  return NextResponse.json({
    suggestions: rows.map((s) => ({
      id: s.id,
      changes: s.changes,
      author: s.author ? { name: s.author.name, email: s.author.email } : null,
      business: s.business,
      createdAt: s.createdAt.toISOString(),
    })),
  });
}

/**
 * PATCH /api/admin/suggestions — apply or reject a suggestion.
 * Body: { id, action: "apply" | "reject" }
 * "Apply" only marks the suggestion resolved — the change itself is free-text
 * (e.g. "Phone number: 03-xxxx"), so an admin/owner still edits the listing
 * by hand; there's no automatic field write.
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
  if (!id || (action !== 'apply' && action !== 'reject'))
    return NextResponse.json({ error: 'Provide id and action (apply|reject).' }, { status: 400 });

  const suggestion = await db.editSuggestion.findUnique({ where: { id } });
  if (!suggestion) return NextResponse.json({ error: 'Suggestion not found.' }, { status: 404 });

  await db.editSuggestion.update({ where: { id }, data: { status: action === 'apply' ? 'APPLIED' : 'REJECTED' } });
  await db.auditLog.create({
    data: { actorId: session.user.id, action: `suggestion.${action}`, target: id, meta: JSON.stringify({ businessId: suggestion.businessId }) },
  });

  return NextResponse.json({ ok: true });
}
