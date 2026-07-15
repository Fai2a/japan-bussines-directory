import 'server-only';
import { db } from './db';
import { sendEmail, emailShell } from './email';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_RESEND_GAP_MS = 6 * 24 * 60 * 60 * 1000; // guards against double-sends if the cron fires early

/**
 * For every user who wants the weekly digest, finds businesses added in the
 * last 7 days in the cities/categories of their favorited listings (a proxy
 * for "places you care about" — there's no separate saved-search concept),
 * and emails the ones they don't already have favorited.
 */
export async function runWeeklyDigest(): Promise<{ usersEligible: number; emailsSent: number }> {
  const cutoff = new Date(Date.now() - WEEK_MS);
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  const users = await db.user.findMany({
    where: { prefDigest: true, favorites: { some: {} } },
    select: {
      id: true,
      email: true,
      lastDigestAt: true,
      favorites: {
        select: {
          businessId: true,
          business: { select: { cityId: true, categories: { select: { categoryId: true } } } },
        },
      },
    },
  });

  let emailsSent = 0;
  let usersEligible = 0;

  for (const user of users) {
    if (user.lastDigestAt && Date.now() - user.lastDigestAt.getTime() < MIN_RESEND_GAP_MS) continue;
    usersEligible++;

    const favoritedIds = user.favorites.map((f) => f.businessId);
    const cityIds = [...new Set(user.favorites.map((f) => f.business.cityId))];
    const categoryIds = [...new Set(user.favorites.flatMap((f) => f.business.categories.map((c) => c.categoryId)))];

    const candidates = await db.business.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { gte: cutoff },
        id: { notIn: favoritedIds },
        OR: [
          cityIds.length ? { cityId: { in: cityIds } } : undefined,
          categoryIds.length ? { categories: { some: { categoryId: { in: categoryIds } } } } : undefined,
        ].filter(Boolean) as object[],
      },
      select: { id: true, slug: true, name: true, city: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    await db.user.update({ where: { id: user.id }, data: { lastDigestAt: new Date() } });

    if (candidates.length === 0) continue;

    const items = candidates
      .map(
        (b) =>
          `<li style="margin-bottom:8px;"><a href="${baseUrl}/company/${b.id}/${b.slug}" style="color:#3B4A6B;">${b.name}</a> — ${b.city.name}</li>`,
      )
      .join('');

    await sendEmail({
      to: user.email,
      subject: 'New on NihonPages this week',
      html: emailShell(
        'Your weekly digest',
        `<p>New businesses in your saved cities and categories:</p><ul style="padding-left:18px;">${items}</ul>`,
      ),
    });
    emailsSent++;
  }

  return { usersEligible, emailsSent };
}
