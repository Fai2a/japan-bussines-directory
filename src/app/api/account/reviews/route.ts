import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

/** GET /api/account/reviews — the signed-in user's own reviews, newest first. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const reviews = await db.review.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { business: { select: { id: true, slug: true, name: true } }, ownerReply: true },
  });

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      businessId: r.business.id,
      businessSlug: r.business.slug,
      businessName: r.business.name,
      rating: r.rating,
      text: r.text,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      ownerReply: r.ownerReply ? { text: r.ownerReply.text, createdAt: r.ownerReply.createdAt.toISOString() } : null,
    })),
  });
}
