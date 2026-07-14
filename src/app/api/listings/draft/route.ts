import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import type { DraftPayload } from '@/lib/server/createListingFromDraft';

interface DraftBody extends DraftPayload {
  plan?: 'basic' | 'premium' | 'lifetime';
}

/**
 * POST /api/listings/draft — stash the wizard's company-details form before
 * sending the user to pay. Captures ownerId from the session now, because
 * the Stripe webhook that later converts this draft has no user session.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  let body: DraftBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const plan = body.plan && ['basic', 'premium', 'lifetime'].includes(body.plan) ? body.plan : null;
  if (!plan) return NextResponse.json({ error: 'Unknown plan.' }, { status: 400 });
  if (!body.name?.trim()) return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
  if (!body.description || body.description.trim().length < 20)
    return NextResponse.json({ error: 'Description must be at least 20 characters.' }, { status: 400 });

  const { plan: _plan, ...payload } = body;
  const draft = await db.pendingListing.create({
    data: {
      ownerId: session?.user?.id ?? null,
      plan,
      payload: JSON.stringify(payload),
    },
  });

  return NextResponse.json({ ok: true, draftId: draft.id });
}

/** GET /api/listings/draft?id= — poll status after returning from Stripe checkout. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 });

  const draft = await db.pendingListing.findUnique({ where: { id } });
  if (!draft) return NextResponse.json({ error: 'Draft not found.' }, { status: 404 });

  const payload = JSON.parse(draft.payload) as DraftPayload;
  return NextResponse.json({
    status: draft.status,
    businessId: draft.businessId,
    name: payload.name,
    email: payload.email,
  });
}
