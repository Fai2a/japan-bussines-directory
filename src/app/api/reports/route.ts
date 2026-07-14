import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

const REASONS = ['wrong-info', 'closed', 'spam', 'abuse', 'other'];

/**
 * POST /api/reports — public "Report a problem" submission.
 * Body: { businessId, reason, details, email? (optional), website? (honeypot) }
 */
export async function POST(req: Request) {
  let body: { businessId?: number; reason?: string; details?: string; email?: string; website?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (body.website) return NextResponse.json({ ok: true }); // honeypot

  const businessId = Number(body.businessId);
  const reason = body.reason;
  const details = body.details?.trim();
  const email = body.email?.trim() || undefined;

  if (!businessId) return NextResponse.json({ error: 'businessId required.' }, { status: 400 });
  if (!reason || !REASONS.includes(reason)) return NextResponse.json({ error: 'Choose a valid reason.' }, { status: 400 });
  if (!details || details.length < 10) return NextResponse.json({ error: 'Add a few details (at least 10 characters).' }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Enter a valid email address, or leave it blank.' }, { status: 400 });

  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });

  await db.report.create({ data: { businessId, reason, details, email } });
  return NextResponse.json({ ok: true });
}
