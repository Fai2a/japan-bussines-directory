import { NextResponse } from 'next/server';
import { LISTING_PLANS } from '@/lib/plans';

/**
 * POST /api/checkout — create a payment for a listing plan.
 * Body: { plan: "basic" | "premium" | "lifetime", email }
 *
 * With STRIPE_SECRET_KEY set (sk_test_...), creates a real Stripe Checkout
 * Session: one-time payment for Basic/Lifetime, yearly subscription for
 * Premium, and returns its URL for redirect. Without a key, returns
 * { simulated: true } and the wizard completes with its built-in test flow.
 */
export async function POST(req: Request) {
  let body: { plan?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const plan = LISTING_PLANS.find((p) => p.id === body.plan);
  if (!plan) return NextResponse.json({ error: 'Unknown plan.' }, { status: 400 });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ simulated: true, plan: plan.id, amount: plan.price * 100 });
  }

  const { default: Stripe } = await import('stripe');
  const stripe = new Stripe(key);
  const origin = req.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const recurring = plan.cadence === 'per year';

  const session = await stripe.checkout.sessions.create({
    mode: recurring ? 'subscription' : 'payment',
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
    success_url: `${origin}/get-listed?paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/get-listed?canceled=1`,
  });

  return NextResponse.json({ url: session.url });
}
