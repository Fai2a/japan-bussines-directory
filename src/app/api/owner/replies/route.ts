import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

/**
 * POST /api/owner/replies — publish an owner reply to a review on the
 * signed-in owner's listing. Body: { reviewId, text }
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  let body: { reviewId?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const text = body.text?.trim();
  if (!body.reviewId || !text) return NextResponse.json({ error: 'reviewId and text required.' }, { status: 400 });

  const review = await db.review.findUnique({
    where: { id: body.reviewId },
    include: { business: { select: { ownerId: true } }, ownerReply: true },
  });
  if (!review) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
  if (review.business.ownerId !== session.user.id)
    return NextResponse.json({ error: 'You can only reply to reviews on your own listing.' }, { status: 403 });
  if (review.ownerReply)
    return NextResponse.json({ error: 'This review already has a reply.' }, { status: 409 });

  await db.ownerReply.create({ data: { reviewId: review.id, text } });
  return NextResponse.json({ ok: true });
}
