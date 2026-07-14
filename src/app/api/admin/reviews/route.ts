import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { sendEmail, emailShell } from '@/lib/server/email';

async function requireModerator() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user || (role !== 'ADMIN' && role !== 'MODERATOR')) return null;
  return session;
}

/** GET /api/admin/reviews — pending reviews for the moderation queue. */
export async function GET() {
  const session = await requireModerator();
  if (!session) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const reviews = await db.review.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: { business: { select: { id: true, slug: true, name: true } } },
    take: 50,
  });
  return NextResponse.json({ reviews });
}

/**
 * PATCH /api/admin/reviews — approve or reject one review.
 * Body: { id, action: "approve" | "reject" }
 * Approval recomputes the business's rating and review count, and the change
 * is audit-logged.
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
  if (!id || (action !== 'approve' && action !== 'reject'))
    return NextResponse.json({ error: 'Provide id and action (approve|reject).' }, { status: 400 });

  const review = await db.review.findUnique({
    where: { id },
    include: { business: { select: { name: true } }, author: { select: { email: true } } },
  });
  if (!review) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });

  const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
  await db.review.update({ where: { id }, data: { status } });

  if (status === 'APPROVED') {
    const agg = await db.review.aggregate({
      where: { businessId: review.businessId, status: 'APPROVED' },
      _avg: { rating: true },
      _count: true,
    });
    await db.business.update({
      where: { id: review.businessId },
      data: {
        rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewCount: agg._count,
      },
    });

    if (review.author?.email) {
      await sendEmail({
        to: review.author.email,
        subject: `Your review of ${review.business.name} is live`,
        html: emailShell(
          'Your review was published',
          `<p>Thanks for reviewing <strong>${review.business.name}</strong> — it's live on NihonPages now.</p>`,
        ),
      });
    }
  }

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: `review.${action}`,
      target: id,
      meta: JSON.stringify({ businessId: review.businessId }),
    },
  });

  return NextResponse.json({ ok: true, status });
}
