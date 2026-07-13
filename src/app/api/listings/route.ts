import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { PLAN_LIMITS } from '@/lib/plans';

interface SubmitBody {
  plan?: 'basic' | 'premium' | 'lifetime';
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
 * POST /api/listings — Get-Listed submission. Creates the business with
 * status IN_REVIEW; it appears in the admin listings queue and goes live on
 * approval. Per-plan limits are re-enforced server-side (never trust the UI).
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const plan = body.plan && ['basic', 'premium', 'lifetime'].includes(body.plan) ? body.plan : null;
  if (!plan) return NextResponse.json({ error: 'Unknown plan.' }, { status: 400 });
  const name = body.name?.trim();
  const description = body.description?.trim();
  if (!name) return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
  if (!description || description.length < 20)
    return NextResponse.json({ error: 'Description must be at least 20 characters.' }, { status: 400 });

  const city = await db.city.findUnique({ where: { slug: body.citySlug ?? '' } });
  if (!city) return NextResponse.json({ error: 'Choose a valid city.' }, { status: 400 });

  const lim = PLAN_LIMITS[plan];
  const catSlugs = (body.categories ?? []).slice(0, lim.categories);
  const cats = await db.category.findMany({ where: { slug: { in: catSlugs } } });
  if (cats.length === 0) return NextResponse.json({ error: 'Select at least one category.' }, { status: 400 });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'listing';

  const business = await db.business.create({
    data: {
      slug,
      name,
      nameJa: body.nameJa?.trim() || name,
      blurb: description,
      ownerId: session?.user?.id ?? null,
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

  if (session?.user && session.user.role === 'USER') {
    await db.user.update({ where: { id: session.user.id }, data: { role: 'OWNER' } });
  }

  return NextResponse.json({ ok: true, id: business.id, status: 'IN_REVIEW' });
}
