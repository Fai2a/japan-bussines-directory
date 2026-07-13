import type { Metadata } from 'next';
import Image from 'next/image';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CITIES, PREFECTURES, citiesInPrefecture } from '@/lib/cities';

export const metadata: Metadata = {
  title: 'Browse all cities',
  description: 'Find local businesses by city and prefecture across Japan — Tokyo, Osaka, Kyoto, Nagoya, Yokohama, Fukuoka, Sapporo, Kobe and more.',
};

export default async function LocationsPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const locale = await getLocale();
  const ja = locale === 'ja';
  const t = await getTranslations('cities');
  const tc = await getTranslations('common');
  const tHome = await getTranslations('home');

  const withCities = PREFECTURES.map((p) => ({ p, cities: citiesInPrefecture(p.slug) })).filter((x) => x.cities.length);

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: tc('home') }, { label: t('title') }]} />
      <header className="mb-8 mt-4 max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-ink-soft">
          {t('subtitle', { cityCount: CITIES.length, prefCount: withCities.length })}
        </p>
      </header>

      <div className="space-y-10">
        {withCities.map(({ p, cities }) => (
          <section key={p.slug}>
            <div className="mb-4 flex items-baseline gap-2 border-b border-rule pb-2">
              <h2 className="font-display text-xl font-bold text-ink">{ja ? p.nameJa : p.name}</h2>
              {!ja && <span className="font-jp text-sm text-meta">{p.nameJa}</span>}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {cities.map((c) => (
                <Link key={c.slug} href={`/location/${c.slug}`} className="group relative isolate flex h-28 items-end overflow-hidden rounded-md border border-rule">
                  <Image src={c.image} alt="" fill sizes="280px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
                  <div className="relative z-10 p-3">
                    <span className="font-display text-base font-bold text-white">{c.name}</span>
                    <span className="font-jp block text-2xs text-white/70">{c.nameJa}</span>
                    <span className="tnum block text-xs text-white/75">{(c.count / 1000).toFixed(1)}k {tHome('listings')}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
