import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BUSINESSES } from '@/lib/businesses';
import { dbGetBusiness } from '@/lib/server/queries';
import { CATEGORY_BY_SLUG, GROUP_BY_KEY } from '@/lib/categories';
import { CITY_BY_SLUG, PREFECTURE_BY_SLUG } from '@/lib/cities';
import { businessHue, obfuscateEmail, yen } from '@/lib/format';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Stars } from '@/components/ui/Stars';
import { Monogram } from '@/components/ui/Monogram';
import { StatusBadge, VerifiedBadge } from '@/components/ui/Badges';
import { Gallery } from '@/components/company/Gallery';
import { HoursTable } from '@/components/company/HoursTable';
import { ReviewSection } from '@/components/company/ReviewSection';
import { ObfuscatedEmail, SaveButton, ShareButton } from '@/components/company/ContactActions';
import { QASection } from '@/components/company/QASection';
import { QuoteRequestForm } from '@/components/company/QuoteRequestForm';

export function generateStaticParams() {
  return BUSINESSES.map((b) => ({ id: String(b.id), slug: b.slug }));
}

// Company pages are statically generated from the seed ids and re-rendered
// from the database on revalidation (spec: regenerate on edit).
export const revalidate = 120;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const b = await dbGetBusiness(Number(params.id));
  if (!b) return {};
  const cat = CATEGORY_BY_SLUG[b.categorySlugs[0]];
  const city = CITY_BY_SLUG[b.citySlug];
  return {
    title: `${b.name} — ${cat?.name} in ${city?.name}`,
    description: `${b.blurb} Rated ${b.rating}/5 from ${b.reviewCount} reviews. Address, hours, phone, photos and reviews on NihonPages.`,
    alternates: { canonical: `/company/${b.id}/${b.slug}` },
  };
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-rule py-2.5 last:border-0">
      <dt className="shrink-0 text-sm text-meta">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

export default async function CompanyPage({ params }: { params: { id: string; slug: string; locale: string } }) {
  setRequestLocale(params.locale);
  const b = await dbGetBusiness(Number(params.id));
  if (!b) notFound();

  const locale = await getLocale();
  const ja = locale === 'ja';
  const t = await getTranslations('company');
  const tc = await getTranslations('common');

  const hue = businessHue(b);
  const city = CITY_BY_SLUG[b.citySlug];
  const pref = PREFECTURE_BY_SLUG[b.prefecture];
  const cats = b.categorySlugs.map((s) => CATEGORY_BY_SLUG[s]).filter(Boolean);
  const email = obfuscateEmail(b.email);
  const isService = ['pro', 'trades', 'auto'].includes(cats[0]?.group);
  const cityName = ja ? city?.nameJa : city?.name;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: b.name,
    image: b.photos[0]?.url,
    telephone: b.phone,
    email: b.email,
    url: b.website,
    address: {
      '@type': 'PostalAddress',
      streetAddress: b.address,
      addressLocality: city?.name,
      addressRegion: pref?.name,
      addressCountry: 'JP',
    },
    geo: { '@type': 'GeoCoordinates', latitude: b.lat, longitude: b.lng },
    aggregateRating: b.reviewCount
      ? { '@type': 'AggregateRating', ratingValue: b.rating, reviewCount: b.reviewCount }
      : undefined,
    foundingDate: String(b.established),
  };

  return (
    <div className="shell py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs
        items={[
          { href: '/', label: tc('home') },
          { href: `/category/${cats[0]?.slug}`, label: ja ? cats[0]?.nameJa ?? '' : cats[0]?.name ?? '' },
          { href: `/location/${b.citySlug}`, label: cityName ?? '' },
          { label: b.name },
        ]}
      />

      {/* ---- Header ------------------------------------------------------------ */}
      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="shrink-0">
          {b.photos.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.photos[0].url} alt={b.name} className="h-20 w-20 rounded-md border border-rule object-cover" />
          ) : (
            <Monogram name={b.name} hue={hue} size="lg" rounded="lg" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {cats.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className="rounded-sm px-2 py-0.5 text-xs font-semibold" style={{ color: GROUP_BY_KEY[c.group].hue, background: `${GROUP_BY_KEY[c.group].hue}14` }}>
                {ja ? c.nameJa : c.name}
              </Link>
            ))}
            <StatusBadge status={b.status} />
          </div>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">{b.name}</h1>
          <p className="font-jp text-lg text-meta">{b.nameJa}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Stars rating={b.rating} count={b.reviewCount} />
            <VerifiedBadge tier={b.verify} size="lg" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <SaveButton id={b.id} name={b.name} />
          <ShareButton name={b.name} />
        </div>
      </header>

      {/* ---- Body -------------------------------------------------------------- */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          {b.photos.length > 0 && (
            <section>
              <Gallery photos={b.photos} name={b.name} />
            </section>
          )}

          <section>
            <h2 className="mb-2 font-display text-xl font-bold text-ink">{t('about')}</h2>
            <p className="max-w-prose text-ink-soft">{b.blurb}</p>
          </section>

          {b.products.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl font-bold text-ink">{t('productsServices')}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {b.products.map((p, i) => (
                  <div key={i} className="panel flex items-center justify-between gap-3 p-3.5">
                    <div className="min-w-0">
                      <div className="font-medium text-ink">{p.name}</div>
                      <p className="truncate text-xs text-meta">{p.blurb}</p>
                    </div>
                    <span className="tnum shrink-0 font-mono font-semibold text-ink">{yen(p.price)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {b.jobs.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl font-bold text-ink">{t('jobOffers')}</h2>
              <div className="space-y-2">
                {b.jobs.map((j, i) => (
                  <div key={i} className="panel flex flex-wrap items-center justify-between gap-3 p-3.5">
                    <div>
                      <span className="font-medium text-ink">{j.title}</span>
                      <span className="ml-2 rounded-sm bg-[#f1f0ea] px-1.5 py-0.5 text-2xs font-medium text-ink-soft">{j.type}</span>
                    </div>
                    <span className="tnum text-sm text-ink-soft">¥{j.salaryMin.toLocaleString()}–{j.salaryMax.toLocaleString()} {t('perHour')}</span>
                    <button className="btn btn-secondary py-1.5 text-sm">{t('apply')}</button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <ReviewSection reviews={b.reviews} rating={b.rating} count={b.reviewCount} businessId={b.id} businessName={b.name} />

          <QASection businessId={b.id} businessName={b.name} />
        </div>

        {/* ---- Sidebar --------------------------------------------------------- */}
        <aside className="space-y-5">
          <div className="panel overflow-hidden">
            <iframe
              title={`Map showing ${b.name}`}
              src={`https://maps.google.com/maps?q=${b.lat},${b.lng}&z=15&output=embed`}
              className="h-48 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="p-4">
              <dl>
                <DetailRow label={t('address')}>
                  <span className="block">{b.address}</span>
                  <span className="font-jp block text-xs text-meta">{b.addressJa}</span>
                </DetailRow>
                <DetailRow label={t('phone')}><a href={`tel:${b.phone.replace(/-/g, '')}`} className="tnum link">{b.phone}</a></DetailRow>
                <DetailRow label={t('email')}><ObfuscatedEmail user={email.user} domain={email.domain} /></DetailRow>
                {b.website && <DetailRow label={t('website')}><a href={b.website} target="_blank" rel="noopener noreferrer nofollow" className="link">{b.website.replace('https://', '')}</a></DetailRow>}
                <DetailRow label={t('corporateNumber')}><span className="tnum">{b.corporateNumber}</span></DetailRow>
                <DetailRow label={t('established')}><span className="tnum">{b.established}</span></DetailRow>
                <DetailRow label={t('employees')}><span className="tnum">{b.employees}</span></DetailRow>
                <DetailRow label={t('manager')}>{b.manager}</DetailRow>
              </dl>
            </div>
          </div>

          <div className="panel p-4">
            <h2 className="eyebrow mb-3">{t('openingHours')}</h2>
            <HoursTable b={b} />
          </div>

          {isService && <QuoteRequestForm businessId={b.id} businessName={b.name} />}

          <div className="panel p-4 text-sm">
            <h2 className="eyebrow mb-3">{t('manageThisListing')}</h2>
            <div className="grid gap-2">
              <Link href={`/claim?id=${b.id}`} className="btn btn-secondary w-full">{t('claimThisListing')}</Link>
              <Link href={`/company/${b.id}/${b.slug}/suggest-edit`} className="btn btn-ghost w-full">{t('suggestEdit')}</Link>
              <Link href={`/report?id=${b.id}`} className="text-center text-xs text-meta hover:text-ink">{t('reportProblem')}</Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
