import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

/**
 * POST /api/leads — public "Request a quote" submission.
 * Body: { businessId, name, email, message, website? (honeypot) }
 */
export async function POST(req: Request) {
  let body: { businessId?: number; name?: string; email?: string; message?: string; website?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (body.website) return NextResponse.json({ ok: true }); // honeypot

  const businessId = Number(body.businessId);
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const message = body.message?.trim();

  if (!businessId) return NextResponse.json({ error: 'businessId required.' }, { status: 400 });
  if (!name) return NextResponse.json({ error: 'Your name is required.' }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Enter a valid email so the business can reply.' }, { status: 400 });
  if (!message || message.length < 10)
    return NextResponse.json({ error: 'Tell the business what you need (at least 10 characters).' }, { status: 400 });

  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });

  await db.leadMessage.create({ data: { businessId, name, email, message } });
  return NextResponse.json({ ok: true });
}

/** GET /api/leads — the signed-in owner's lead inbox (newest first). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const business = await db.business.findFirst({ where: { ownerId: session.user.id } });
  if (!business) return NextResponse.json({ leads: [] });

  const leads = await db.leadMessage.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({
    leads: leads.map((l) => ({ id: l.id, name: l.name, email: l.email, message: l.message, createdAt: l.createdAt.toISOString() })),
  });
}
