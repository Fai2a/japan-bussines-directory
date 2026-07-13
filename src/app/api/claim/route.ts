import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

/**
 * POST /api/claim — start a claim.
 * Body: { businessId, method: "email" | "phone" | "docs" }
 *
 * Fast paths (email/phone) just acknowledge — the actual ownership transfer
 * happens in PATCH once the code is confirmed. The "docs" path creates a
 * ClaimRequest row for a human to review against 法人番号 open data.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in to claim a listing.' }, { status: 401 });

  let body: { businessId?: number; method?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const businessId = Number(body.businessId);
  const method = body.method;
  if (!businessId || !['email', 'phone', 'docs'].includes(method ?? ''))
    return NextResponse.json({ error: 'businessId and a valid method are required.' }, { status: 400 });

  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });
  if (business.ownerId && business.ownerId !== session.user.id)
    return NextResponse.json({ error: 'This listing is already claimed by another account.' }, { status: 409 });

  if (method === 'docs') {
    const existing = await db.claimRequest.findFirst({ where: { businessId, userId: session.user.id, status: 'PENDING' } });
    if (!existing) {
      await db.claimRequest.create({ data: { businessId, userId: session.user.id, method: 'docs' } });
    }
    return NextResponse.json({ ok: true, queued: true });
  }

  // Email/phone: acknowledge only — code verification happens in PATCH.
  return NextResponse.json({ ok: true, queued: false });
}

/**
 * PATCH /api/claim — confirm the code for an email/phone claim.
 * Body: { businessId, code }
 * Demo: any 6-digit code is accepted (there's no real SMS/email dispatch here).
 * On success, sets Business.ownerId and promotes OWNER role + verify tier.
 */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in to claim a listing.' }, { status: 401 });

  let body: { businessId?: number; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const businessId = Number(body.businessId);
  if (!businessId) return NextResponse.json({ error: 'businessId required.' }, { status: 400 });
  if (!/^\d{6}$/.test(body.code?.trim() ?? ''))
    return NextResponse.json({ error: 'Enter the 6-digit code we sent you.' }, { status: 400 });

  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });
  if (business.ownerId && business.ownerId !== session.user.id)
    return NextResponse.json({ error: 'This listing is already claimed by another account.' }, { status: 409 });

  await db.business.update({
    where: { id: businessId },
    data: {
      ownerId: session.user.id,
      verify: business.verify === 'NONE' ? 'COMMUNITY' : business.verify,
    },
  });
  if (session.user.role === 'USER') {
    await db.user.update({ where: { id: session.user.id }, data: { role: 'OWNER' } });
  }
  await db.auditLog.create({
    data: { actorId: session.user.id, action: 'business.claim', target: String(businessId), meta: JSON.stringify({ method: 'code' }) },
  });

  return NextResponse.json({ ok: true });
}
