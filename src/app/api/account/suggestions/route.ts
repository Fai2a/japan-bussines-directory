import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

/** GET /api/account/suggestions — the signed-in user's own edit suggestions, newest first. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const suggestions = await db.editSuggestion.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { business: { select: { id: true, slug: true, name: true } } },
  });

  return NextResponse.json({
    suggestions: suggestions.map((s) => ({
      id: s.id,
      businessId: s.business.id,
      businessSlug: s.business.slug,
      businessName: s.business.name,
      summary: s.changes,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    })),
  });
}
