import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { createListingFromDraft } from '@/lib/server/createListingFromDraft';

/**
 * POST /api/webhooks/stripe — the source of truth for payment state.
 *
 * checkout.session.completed  → convert the paid-for PendingListing into a
 *                                real Business (status IN_REVIEW).
 * customer.subscription.deleted → a Premium subscription lapsed; suspend the
 *                                listing rather than leaving it live unpaid.
 * invoice.payment_failed        → audit-logged only (Stripe retries automatically
 *                                before the subscription is actually canceled).
 *
 * Verifies the Stripe-Signature header against STRIPE_WEBHOOK_SECRET. If that
 * secret isn't configured (e.g. testing locally without the Stripe CLI), the
 * payload is trusted as-is — fine for a dev sandbox, never for production.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get('stripe-signature');

  let event: any;

  if (secret) {
    if (!signature) return NextResponse.json({ error: 'Missing Stripe-Signature header.' }, { status: 400 });
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');
    try {
      event = stripe.webhooks.constructEvent(raw, signature, secret);
    } catch (err) {
      return NextResponse.json({ error: `Signature verification failed: ${(err as Error).message}` }, { status: 400 });
    }
  } else {
    // Dev fallback — no webhook secret configured, trust the payload.
    try {
      event = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const draftId = session.client_reference_id as string | null;
      if (!draftId) break;
      const result = await createListingFromDraft(draftId, {
        sessionId: session.id,
        customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
        subscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
      });
      await db.auditLog.create({
        data: {
          actorId: 'stripe-webhook',
          action: 'checkout.completed',
          target: draftId,
          meta: JSON.stringify('error' in result ? { error: result.error } : { businessId: result.businessId }),
        },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const business = await db.business.findUnique({ where: { stripeSubscriptionId: sub.id } });
      if (business) {
        await db.business.update({ where: { id: business.id }, data: { status: 'SUSPENDED' } });
        await db.auditLog.create({
          data: { actorId: 'stripe-webhook', action: 'subscription.canceled', target: String(business.id) },
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
      if (subId) {
        const business = await db.business.findUnique({ where: { stripeSubscriptionId: subId } });
        if (business) {
          await db.auditLog.create({
            data: { actorId: 'stripe-webhook', action: 'invoice.payment_failed', target: String(business.id) },
          });
        }
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
