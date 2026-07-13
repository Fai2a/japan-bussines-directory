import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

/**
 * POST /api/reviews — submit a review into the moderation queue.
 * Body: { businessId, rating (1–5), text, website? (honeypot) }
 * Requires a signed-in user (spec: reviews require an account).
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in to write a review.' }, { status: 401 });
  }

  let body: { businessId?: number; rating?: number; text?: string; website?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  // Honeypot: bots fill every field; humans never see this one.
  if (body.website) return NextResponse.json({ ok: true });

  const businessId = Number(body.businessId);
  const rating = Number(body.rating);
  const text = (body.text ?? '').trim();

  if (!businessId || !Number.isInteger(rating) || rating < 1 || rating > 5)
    return NextResponse.json({ error: 'Choose a rating between 1 and 5 stars.' }, { status: 400 });
  if (text.length < 10)
    return NextResponse.json({ error: 'Reviews need at least 10 characters.' }, { status: 400 });

  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });

  const review = await db.review.create({
    data: {
      businessId,
      authorId: session.user.id,
      authorName: session.user.name ?? 'Anonymous',
      rating,
      text,
      status: 'PENDING',
    },
  });

  return NextResponse.json({ ok: true, id: review.id, status: 'PENDING' });
}
