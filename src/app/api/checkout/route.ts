import { NextResponse } from 'next/server';
import { LISTING_PLANS } from '@/lib/plans';
import { db } from '@/lib/server/db';
import { createListingFromDraft } from '@/lib/server/createListingFromDraft';

/**
 * POST /api/checkout — pay for a pending Get-Listed draft.
 * Body: { plan: "basic" | "premium" | "lifetime", email, draftId }
 *
 * With STRIPE_SECRET_KEY set (sk_test_...), creates a real Stripe Checkout
 * Session — one-time payment for Basic/Lifetime, yearly subscription for
 * Premium — with client_reference_id = draftId, and returns its URL for
 * redirect. The listing is only created once the `checkout.session.completed`
 * webhook fires (see /api/webhooks/stripe), never from this route directly,
 * so a user who never finishes paying never gets a listing.
 *
 * Without a key, there's nothing to redirect to, so the draft is converted
 * immediately and { simulated: true, id } is returned.
 */
export async function POST(req: Request) {
  let body: { plan?: string; email?: string; draftId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const plan = LISTING_PLANS.find((p) => p.id === body.plan);
  if (!plan) return NextResponse.json({ error: 'Unknown plan.' }, { status: 400 });
  if (!body.draftId) return NextResponse.json({ error: 'draftId required.' }, { status: 400 });

  const draft = await db.pendingListing.findUnique({ where: { id: body.draftId } });
  if (!draft) return NextResponse.json({ error: 'Draft not found — go back and try again.' }, { status: 404 });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    const result = await createListingFromDraft(body.draftId);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ simulated: true, id: result.businessId });
  }

  const { default: Stripe } = await import('stripe');
  const stripe = new Stripe(key);
  const origin = req.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const recurring = plan.cadence === 'per year';

  const session = await stripe.checkout.sessions.create({
    mode: recurring ? 'subscription' : 'payment',
    client_reference_id: body.draftId,
    customer_email: body.email || undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: plan.price * 100,
          product_data: {
            name: `NihonPages ${plan.name} listing`,
            description: plan.tagline,
          },
          ...(recurring ? { recurring: { interval: 'year' as const } } : {}),
        },
      },
    ],
    success_url: `${origin}/get-listed?paid=1&ref=${body.draftId}`,
    cancel_url: `${origin}/get-listed?canceled=1`,
  });

  await db.pendingListing.update({ where: { id: body.draftId }, data: { stripeSessionId: session.id } });

  return NextResponse.json({ url: session.url });
}
