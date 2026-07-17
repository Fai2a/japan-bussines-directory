import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

/**
 * POST /api/suggestions — submit a "suggest an edit" correction on a listing.
 * Body: { businessId, changes } (auth required — same rule as reviews, so
 * every suggestion in the queue is traceable to an account).
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in to suggest an edit.' }, { status: 401 });

  let body: { businessId?: number; changes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const businessId = Number(body.businessId);
  const changes = body.changes?.trim();
  if (!businessId) return NextResponse.json({ error: 'businessId required.' }, { status: 400 });
  if (!changes) return NextResponse.json({ error: 'changes required.' }, { status: 400 });

  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });

  const suggestion = await db.editSuggestion.create({
    data: { businessId, authorId: session.user.id, changes },
  });

  return NextResponse.json({ ok: true, id: suggestion.id });
}
