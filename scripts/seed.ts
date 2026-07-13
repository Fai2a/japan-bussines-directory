/**
 * Database seed. Loads the deterministic dataset (~220 businesses across 24
 * categories and 10 cities, with reviews/photos/products/jobs) into the
 * database via Prisma.
 *
 *   npm run seed          (safe to re-run: wipes and reloads)
 *
 * Also seeds three demo accounts:
 *   user@demo.jp / password123     (USER)
 *   owner@demo.jp / password123    (OWNER — owns the first Premium business)
 *   admin@demo.jp / password123    (ADMIN)
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { BUSINESSES } from '../src/lib/businesses';
import { CATEGORIES } from '../src/lib/categories';
import { CITIES, PREFECTURES } from '../src/lib/cities';

const db = new PrismaClient();

async function main() {
  console.log('Seeding database…');

  // Wipe in dependency order (SQLite: no TRUNCATE CASCADE).
  await db.auditLog.deleteMany();
  await db.apiKey.deleteMany();
  await db.adPlacement.deleteMany();
  await db.removalRequest.deleteMany();
  await db.editSuggestion.deleteMany();
  await db.leadMessage.deleteMany();
  await db.favorite.deleteMany();
  await db.answer.deleteMany();
  await db.question.deleteMany();
  await db.ownerReply.deleteMany();
  await db.review.deleteMany();
  await db.jobOffer.deleteMany();
  await db.product.deleteMany();
  await db.photo.deleteMany();
  await db.keyword.deleteMany();
  await db.businessCategory.deleteMany();
  await db.business.deleteMany();
  await db.category.deleteMany();
  await db.city.deleteMany();
  await db.prefecture.deleteMany();
  await db.user.deleteMany();

  // Prefectures & cities
  const prefIds: Record<string, string> = {};
  for (const p of PREFECTURES) {
    const row = await db.prefecture.create({ data: { slug: p.slug, name: p.name, nameJa: p.nameJa } });
    prefIds[p.slug] = row.id;
  }
  const cityIds: Record<string, string> = {};
  for (const c of CITIES) {
    const row = await db.city.create({
      data: { slug: c.slug, name: c.name, nameJa: c.nameJa, prefectureId: prefIds[c.prefecture] },
    });
    cityIds[c.slug] = row.id;
  }

  // Categories
  const catIds: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const row = await db.category.create({
      data: { slug: c.slug, name: c.name, nameJa: c.nameJa, group: c.group },
    });
    catIds[c.slug] = row.id;
  }

  // Demo users
  const hash = await bcrypt.hash('password123', 10);
  await db.user.create({ data: { email: 'user@demo.jp', name: 'Demo User', passwordHash: hash, role: 'USER' } });
  const owner = await db.user.create({ data: { email: 'owner@demo.jp', name: 'Demo Owner', passwordHash: hash, role: 'OWNER' } });
  await db.user.create({ data: { email: 'admin@demo.jp', name: 'Demo Admin', passwordHash: hash, role: 'ADMIN' } });

  const ownedId = BUSINESSES.find((b) => b.plan === 'premium')?.id;

  // Businesses + children
  let nReviews = 0;
  for (const b of BUSINESSES) {
    await db.business.create({
      data: {
        id: b.id,
        slug: b.slug,
        name: b.name,
        nameJa: b.nameJa,
        blurb: b.blurb,
        ownerId: b.id === ownedId ? owner.id : null,
        cityId: cityIds[b.citySlug],
        address: b.address,
        addressJa: b.addressJa,
        lat: b.lat,
        lng: b.lng,
        phone: b.phone,
        website: b.website ?? null,
        email: b.email,
        established: b.established,
        employees: b.employees,
        manager: b.manager,
        corporateNumber: b.corporateNumber,
        hours: JSON.stringify(b.hours),
        plan: b.plan.toUpperCase(),
        verify: b.verify.toUpperCase(),
        status: 'ACTIVE',
        rating: b.rating,
        reviewCount: b.reviewCount,
        updatedAt: new Date(b.updatedAt),
        categories: { create: b.categorySlugs.map((cs) => ({ categoryId: catIds[cs] })) },
        keywords: { create: b.keywords.map((value) => ({ value })) },
        photos: { create: b.photos.map((p) => ({ url: p.url, alt: p.alt, credit: p.credit ?? null })) },
        products: { create: b.products.map((p) => ({ name: p.name, price: p.price, blurb: p.blurb })) },
        jobs: { create: b.jobs.map((j) => ({ title: j.title, type: j.type, salaryMin: j.salaryMin, salaryMax: j.salaryMax })) },
        reviews: {
          create: b.reviews.map((r) => ({
            authorName: r.author,
            rating: r.rating,
            text: r.text,
            receiptVerified: !!r.receiptVerified,
            status: 'APPROVED', // seed reviews are pre-moderated
            createdAt: new Date(r.date),
            ownerReply: r.ownerReply ? { create: { text: r.ownerReply.text, createdAt: new Date(r.ownerReply.date) } } : undefined,
          })),
        },
      },
    });
    nReviews += b.reviews.length;
  }

  console.log(`Seeded: ${PREFECTURES.length} prefectures, ${CITIES.length} cities, ${CATEGORIES.length} categories, ${BUSINESSES.length} businesses, ${nReviews} reviews, 3 demo users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
