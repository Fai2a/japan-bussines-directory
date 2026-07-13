import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CATEGORY_BY_SLUG, CATEGORIES, GROUP_BY_KEY, categoriesInGroup } from '@/lib/categories';
import { CITIES, CITY_BY_SLUG } from '@/lib/cities';
import { applyFilters, sortBusinesses, paginate, isFeatured, type SortKey } from '@/lib/queries';
import { dbByCategory } from '@/lib/server/queries';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FilterBar } from '@/components/listing/FilterBar';
import { ResultsView } from '@/components/listing/ResultsView';

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const cat = CATEGORY_BY_SLUG[params.slug];
  if (!cat) return {};
  return {
    title: `${cat.name} in Japan — ${cat.count.toLocaleString('en-US')} listings`,
    description: `${cat.blurb} Browse, filter and review ${cat.name.toLowerCase()} across every prefecture in Japan on NihonPages.`,
  };
}

interface SP {
  city?: string; rating?: string; verified?: string; photos?: string; open?: string; sort?: string; page?: string;
}

export default async function CategoryPage({ params, searchParams }: { params: { slug: string; locale: string }; searchParams: SP }) {
  setRequestLocale(params.locale);
  const cat = CATEGORY_BY_SLUG[params.slug];
  if (!cat) notFound();
  const group = GROUP_BY_KEY[cat.group];
  const locale = await getLocale();
  const ja = locale === 'ja';
  const t = await getTranslations('category');
  const tc = await getTranslations('common');

  const all = await dbByCategory(cat.slug);
  const filtered = applyFilters(all, {
    city: searchParams.city,
    minRating: searchParams.rating ? Number(searchParams.rating) : undefined,
    verifiedOnly: !!searchParams.verified,
    hasPhotos: !!searchParams.photos,
    openNow: !!searchParams.open,
  });
  const sorted = sortBusinesses(filtered, (searchParams.sort as SortKey) ?? 'relevance');
  const { items, page, pages, total } = paginate(sorted, Number(searchParams.page) || 1, 12);

  const citiesWithListings = CITIES.filter((c) => all.some((b) => b.citySlug === c.slug));
  const related = categoriesInGroup(cat.group).filter((c) => c.slug !== cat.slug);
  const queryString = new URLSearchParams(searchParams as Record<string, string>).toString();

  const featured = items.filter(isFeatured);
  const standard = items.filter((b) => !isFeatured(b));
  const catName = ja ? cat.nameJa : cat.name;
  const groupName = ja ? group.nameJa : group.name;

  return (
    <div className="shell py-8">
      <Breadcrumbs
        items={[
          { href: '/', label: tc('home') },
          { href: '/categories', label: tc('browseDirectory') },
          { href: `/categories?group=${group.key}`, label: groupName },
          { label: catName },
        ]}
      />

      <header className="relative isolate mt-4 overflow-hidden rounded-lg border border-rule">
        <Image src={cat.image} alt="" fill sizes="1200px" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 to-ink/45" />
        <div className="p-6 sm:p-8">
          <span className="mb-2 inline-flex items-center gap-2 rounded-sm bg-white/15 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
            <span className="h-2 w-2 rounded-full" style={{ background: group.hue }} />
            {groupName}
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {cat.name} {ja && <span className="font-jp text-2xl font-medium text-white/75">{cat.nameJa}</span>}
          </h1>
          <p className="mt-2 max-w-xl text-white/85">{cat.blurb}</p>
          <p className="tnum mt-3 text-sm text-white/70">{t('listingsNationwide', { count: cat.count.toLocaleString('en-US') })}</p>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_260px]">
        <div>
          <FilterBar cities={citiesWithListings.map((c) => ({ slug: c.slug, name: ja ? c.nameJa : c.name }))} total={sorted.length} />

          {total === 0 ? (
            <div className="panel mt-6 p-10 text-center">
              <h2 className="font-display text-lg font-bold text-ink">{t('noMatchesTitle')}</h2>
              <p className="mt-1 text-ink-soft">{t('noMatchesBody')}</p>
              <Link href={`/category/${cat.slug}`} className="btn btn-secondary mt-4">{t('clearFilters')}</Link>
            </div>
          ) : (
            <ResultsView
              featured={featured}
              standard={standard}
              allForMap={sorted}
              page={page}
              pages={pages}
              baseQuery={queryString}
            />
          )}
        </div>

        <aside className="space-y-6">
          <div className="panel p-4">
            <h2 className="eyebrow mb-3">{t('relatedCategories')}</h2>
            <ul className="space-y-1.5">
              {related.map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="flex items-center justify-between gap-2 text-sm text-ink-soft hover:text-indigo">
                    <span>{ja ? c.nameJa : c.name}</span>
                    <span className="tnum text-xs text-meta">{(c.count / 1000).toFixed(1)}k</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel p-4">
            <h2 className="eyebrow mb-3">{t('popularCities')}</h2>
            <ul className="space-y-1.5">
              {citiesWithListings.slice(0, 8).map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${cat.slug}?city=${c.slug}`} className="flex items-center justify-between gap-2 text-sm text-ink-soft hover:text-indigo">
                    <span>{ja ? c.nameJa : c.name}</span>
                    <span className="tnum text-xs text-meta">{all.filter((b) => b.citySlug === c.slug).length}</span>
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
