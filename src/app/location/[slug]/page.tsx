import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CITY_BY_SLUG, CITIES, PREFECTURE_BY_SLUG } from '@/lib/cities';
import { CATEGORY_BY_SLUG, GROUP_BY_KEY } from '@/lib/categories';
import { applyFilters, sortBusinesses, paginate, isFeatured, type SortKey } from '@/lib/queries';
import { dbByCity } from '@/lib/server/queries';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FilterBar } from '@/components/listing/FilterBar';
import { ResultsView } from '@/components/listing/ResultsView';

export function generateStaticParams() {
  return CITIES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const city = CITY_BY_SLUG[params.slug];
  if (!city) return {};
  return {
    title: `Businesses in ${city.name}`,
    description: `Discover ${city.count.toLocaleString('en-US')} local businesses in ${city.name}, Japan — restaurants, clinics, shops and services with reviews and opening hours.`,
  };
}

interface SP { rating?: string; verified?: string; photos?: string; open?: string; sort?: string; page?: string }

export default async function LocationPage({ params, searchParams }: { params: { slug: string }; searchParams: SP }) {
  const city = CITY_BY_SLUG[params.slug];
  if (!city) notFound();
  const pref = PREFECTURE_BY_SLUG[city.prefecture];

  const all = await dbByCity(city.slug);
  const filtered = applyFilters(all, {
    minRating: searchParams.rating ? Number(searchParams.rating) : undefined,
    verifiedOnly: !!searchParams.verified,
    hasPhotos: !!searchParams.photos,
    openNow: !!searchParams.open,
  });
  const sorted = sortBusinesses(filtered, (searchParams.sort as SortKey) ?? 'relevance');
  const { items, page, pages } = paginate(sorted, Number(searchParams.page) || 1, 12);
  const queryString = new URLSearchParams(searchParams as Record<string, string>).toString();
  const featured = items.filter(isFeatured);
  const standard = items.filter((b) => !isFeatured(b));

  // Category breakdown within this city.
  const catCounts = new Map<string, number>();
  all.forEach((b) => b.categorySlugs.forEach((cs) => catCounts.set(cs, (catCounts.get(cs) ?? 0) + 1)));
  const breakdown = [...catCounts.entries()]
    .map(([slug, n]) => ({ cat: CATEGORY_BY_SLUG[slug], n }))
    .filter((x) => x.cat)
    .sort((a, b) => b.n - a.n)
    .slice(0, 10);

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/locations', label: 'Cities' }, { label: city.name }]} />

      <header className="relative isolate mt-4 overflow-hidden rounded-lg border border-rule">
        <Image src={city.image} alt="" fill sizes="1200px" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 to-ink/40" />
        <div className="p-6 sm:p-8">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {city.name} <span className="font-jp text-2xl font-medium text-white/75">{city.nameJa}</span>
          </h1>
          <p className="mt-2 max-w-xl text-white/85">
            {city.count.toLocaleString('en-US')} businesses listed in {city.name}, {pref?.name}. Filter by
            category, rating or opening hours to find exactly what you need.
          </p>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_260px]">
        <div>
          <FilterBar total={sorted.length} hideCity />
          <ResultsView
            featured={featured}
            standard={standard}
            allForMap={sorted}
            page={page}
            pages={pages}
            baseQuery={queryString}
          />
          {sorted.length === 0 && (
            <div className="panel mt-6 p-10 text-center">
              <h2 className="font-display text-lg font-bold text-ink">No matches with these filters</h2>
              <p className="mt-1 text-ink-soft">Try removing a filter to see more of {city.name}.</p>
              <Link href={`/location/${city.slug}`} className="btn btn-secondary mt-4">Clear filters</Link>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="panel p-4">
            <h2 className="eyebrow mb-3">Categories in {city.name}</h2>
            <ul className="space-y-1.5">
              {breakdown.map(({ cat, n }) => (
                <li key={cat.slug}>
                  <Link href={`/category/${cat.slug}?city=${city.slug}`} className="flex items-center justify-between gap-2 text-sm text-ink-soft hover:text-indigo">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: GROUP_BY_KEY[cat.group].hue }} />
                      {cat.name}
                    </span>
                    <span className="tnum text-xs text-meta">{n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
