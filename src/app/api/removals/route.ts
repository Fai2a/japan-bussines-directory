import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

/**
 * POST /api/removals — public "Remove my company" submission.
 * Body: { url, email, reason, website? (honeypot) }
 * The listing URL is parsed for its numeric id (/company/{id}/...). Stays
 * live until an admin verifies and approves (spec: verify before removing).
 */
export async function POST(req: Request) {
  let body: { url?: string; email?: string; reason?: string; website?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (body.website) return NextResponse.json({ ok: true }); // honeypot

  const email = body.email?.trim().toLowerCase();
  const reason = body.reason?.trim();
  const match = body.url?.match(/\/company\/(\d+)/);

  if (!match) return NextResponse.json({ error: 'Paste the full listing URL (e.g. /company/123456/name).' }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (!reason || reason.length < 10)
    return NextResponse.json({ error: 'Tell us why (at least 10 characters).' }, { status: 400 });

  const businessId = Number(match[1]);
  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) return NextResponse.json({ error: "We couldn't find that listing." }, { status: 404 });

  await db.removalRequest.create({ data: { businessId, email, reason } });
  return NextResponse.json({ ok: true });
}
