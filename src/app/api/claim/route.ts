import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { sendEmail, emailShell } from '@/lib/server/email';

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * POST /api/claim — start a claim.
 * Body: { businessId, method: "email" | "phone" | "docs" }
 *
 * Email verification is real: a 6-digit code is generated, stored, and
 * emailed to the address on file for the listing (via EmailLog if no
 * RESEND_API_KEY is configured — see src/lib/server/email.ts). Phone
 * verification stays simulated (no SMS provider integrated) — PATCH accepts
 * any 6 digits when no VerificationCode row exists for the attempt. The
 * "docs" path creates a ClaimRequest row for a human to review against
 * 法人番号 open data.
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

  if (method === 'email') {
    if (!business.email) return NextResponse.json({ error: 'This listing has no email on file — try phone or document verification.' }, { status: 400 });

    // Clear any previous unconsumed code for this business+user before issuing a fresh one.
    await db.verificationCode.deleteMany({ where: { businessId, userId: session.user.id, consumedAt: null } });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await db.verificationCode.create({
      data: { businessId, userId: session.user.id, code, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
    });

    await sendEmail({
      to: business.email,
      subject: `Your NihonPages verification code: ${code}`,
      html: emailShell(
        'Verify your claim',
        `<p>Someone is claiming <strong>${business.name}</strong> on NihonPages. If this was you, enter this code to finish:</p>
         <p style="margin:20px 0;font-size:28px;font-weight:700;letter-spacing:6px;font-family:monospace;">${code}</p>
         <p style="color:#8A8B85;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
      ),
    });
  }

  // Phone: acknowledge only — no real SMS provider, PATCH accepts any 6 digits.
  return NextResponse.json({ ok: true, queued: false });
}

/**
 * PATCH /api/claim — confirm the code for an email/phone claim.
 * Body: { businessId, code }
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
  const submitted = body.code?.trim() ?? '';
  if (!businessId) return NextResponse.json({ error: 'businessId required.' }, { status: 400 });
  if (!/^\d{6}$/.test(submitted))
    return NextResponse.json({ error: 'Enter the 6-digit code we sent you.' }, { status: 400 });

  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });
  if (business.ownerId && business.ownerId !== session.user.id)
    return NextResponse.json({ error: 'This listing is already claimed by another account.' }, { status: 409 });
  // Already claimed by this same user — nothing left to verify, don't fall
  // through to the "no pending code" branch below (that's reserved for the
  // simulated phone path and would accept literally any digits here).
  if (business.ownerId === session.user.id) return NextResponse.json({ ok: true });

  // An unconsumed code means email verification was used — it must match.
  // No row at all means phone (simulated) — any 6 digits pass, as documented in the UI.
  const pending = await db.verificationCode.findFirst({
    where: { businessId, userId: session.user.id, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (pending) {
    if (pending.expiresAt < new Date())
      return NextResponse.json({ error: 'That code has expired — go back and request a new one.' }, { status: 400 });
    if (pending.code !== submitted)
      return NextResponse.json({ error: 'That code doesn’t match. Check your email and try again.' }, { status: 400 });
    await db.verificationCode.update({ where: { id: pending.id }, data: { consumedAt: new Date() } });
  }

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
    data: { actorId: session.user.id, action: 'business.claim', target: String(businessId), meta: JSON.stringify({ method: pending ? 'email' : 'phone' }) },
  });

  return NextResponse.json({ ok: true });
}
