import 'server-only';
import { db } from './db';
import { PLAN_LIMITS } from '@/lib/plans';
import { sendEmail, emailShell } from './email';

export interface DraftPayload {
  name?: string;
  nameJa?: string;
  email?: string;
  phone?: string;
  citySlug?: string;
  address?: string;
  addressJa?: string;
  website?: string;
  description?: string;
  established?: string;
  employees?: string;
  categories?: string[];
  keywords?: string[];
  hours?: Record<string, unknown>;
  products?: { name: string; price: string; blurb: string }[];
  jobs?: { title: string; type: string; salaryMin: string; salaryMax: string }[];
}

/**
 * Converts a paid-for PendingListing into a real Business row (status
 * IN_REVIEW, so it still goes through the normal admin moderation queue).
 * Called from two places: the checkout route's simulated (no Stripe key)
 * path, and the Stripe webhook's `checkout.session.completed` handler.
 * Idempotent — if the draft was already converted, returns the existing id.
 */
export async function createListingFromDraft(
  draftId: string,
  stripeInfo?: { sessionId?: string; customerId?: string; subscriptionId?: string },
): Promise<{ businessId: number } | { error: string }> {
  const draft = await db.pendingListing.findUnique({ where: { id: draftId } });
  if (!draft) return { error: 'Draft not found.' };
  if (draft.status === 'COMPLETED' && draft.businessId) return { businessId: draft.businessId };

  const plan = draft.plan as 'basic' | 'premium' | 'lifetime';
  const body: DraftPayload = JSON.parse(draft.payload);

  const name = body.name?.trim();
  const description = body.description?.trim();
  if (!name || !description) return { error: 'Draft is missing required fields.' };

  const city = await db.city.findUnique({ where: { slug: body.citySlug ?? '' } });
  if (!city) return { error: 'Draft has an invalid city.' };

  const lim = PLAN_LIMITS[plan];
  const catSlugs = (body.categories ?? []).slice(0, lim.categories);
  const cats = await db.category.findMany({ where: { slug: { in: catSlugs } } });
  if (cats.length === 0) return { error: 'Draft has no valid categories.' };

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'listing';

  const business = await db.business.create({
    data: {
      slug,
      name,
      nameJa: body.nameJa?.trim() || name,
      blurb: description,
      ownerId: draft.ownerId,
      cityId: city.id,
      address: body.address?.trim() ?? '',
      addressJa: body.addressJa?.trim() ?? '',
      lat: 0,
      lng: 0,
      phone: body.phone?.trim() ?? '',
      website: body.website?.trim() || null,
      email: body.email?.trim() ?? '',
      established: Number(body.established) || new Date().getFullYear(),
      employees: Number(body.employees) || 1,
      manager: '',
      hours: JSON.stringify(body.hours ?? {}),
      plan: plan.toUpperCase(),
      status: 'IN_REVIEW',
      stripeCustomerId: stripeInfo?.customerId ?? null,
      stripeSubscriptionId: stripeInfo?.subscriptionId ?? null,
      categories: { create: cats.map((c) => ({ categoryId: c.id })) },
      keywords: { create: (body.keywords ?? []).slice(0, lim.keywords).map((value) => ({ value: String(value) })) },
      products: {
        create: (body.products ?? []).slice(0, lim.products).map((p) => ({
          name: String(p.name), price: Number(p.price) || 0, blurb: String(p.blurb ?? ''),
        })),
      },
      jobs: {
        create: (body.jobs ?? []).slice(0, lim.jobs).map((j) => ({
          title: String(j.title), type: String(j.type), salaryMin: Number(j.salaryMin) || 0, salaryMax: Number(j.salaryMax) || 0,
        })),
      },
    },
  });

  if (draft.ownerId) {
    const owner = await db.user.findUnique({ where: { id: draft.ownerId } });
    if (owner?.role === 'USER') await db.user.update({ where: { id: draft.ownerId }, data: { role: 'OWNER' } });
  }

  const ownerEmail = body.email?.trim();
  if (ownerEmail) {
    await sendEmail({
      to: ownerEmail,
      subject: `${name} is in for review — NihonPages`,
      html: emailShell(
        'Your listing was submitted',
        `<p><strong>${name}</strong> is in our moderation queue. We'll email you again as soon as it's live — usually within a day.</p>
         <p style="margin-top:16px;color:#8A8B85;font-size:12px;">Reference: NP-${business.id}</p>`,
      ),
    });
  }

  await db.pendingListing.update({
    where: { id: draftId },
    data: { status: 'COMPLETED', businessId: business.id, stripeSessionId: stripeInfo?.sessionId ?? draft.stripeSessionId },
  });

  return { businessId: business.id };
}
