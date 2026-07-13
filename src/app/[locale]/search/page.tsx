import type { Metadata } from 'next';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { sortBusinesses } from '@/lib/queries';
import { dbSearch } from '@/lib/server/queries';
import { CATEGORIES, CATEGORY_BY_SLUG, GROUP_BY_KEY } from '@/lib/categories';
import { CITIES } from '@/lib/cities';
import { BusinessCard } from '@/components/ui/BusinessCard';
import { companyHref } from '@/components/ui/BusinessCard';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { yen } from '@/lib/format';

export const metadata: Metadata = { title: 'Search', robots: { index: false } };

type Tab = 'companies' | 'categories' | 'products' | 'jobs';

export default async function SearchPage({ params, searchParams }: { params: { locale: string }; searchParams: { q?: string; where?: string; tab?: string } }) {
  setRequestLocale(params.locale);
  const locale = await getLocale();
  const ja = locale === 'ja';
  const t = await getTranslations('search');
  const tc = await getTranslations('common');

  const q = searchParams.q ?? '';
  const where = searchParams.where ?? '';
  const tab = (searchParams.tab as Tab) ?? 'companies';
  const companies = sortBusinesses(await dbSearch(q, where), 'relevance');

  // Which category / keyword produced the match (shown under the heading).
  const ql = q.trim().toLowerCase();
  const matchedCategory = ql
    ? CATEGORIES.find((c) => c.name.toLowerCase().includes(ql) || c.slug.includes(ql) || c.nameJa.includes(q))?.slug
    : undefined;
  const matchedKeyword = ql
    ? companies.flatMap((b) => b.keywords).find((k) => k.toLowerCase().includes(ql))
    : undefined;

  const catMatches = CATEGORIES.filter(
    (c) => q && (c.name.toLowerCase().includes(q.toLowerCase()) || c.nameJa.includes(q)),
  );
  const products = companies.flatMap((b) => b.products.map((p) => ({ p, b }))).slice(0, 24);
  const jobs = companies.flatMap((b) => b.jobs.map((j) => ({ j, b }))).slice(0, 24);

  const counts: Record<Tab, number> = {
    companies: companies.length,
    categories: catMatches.length,
    products: products.length,
    jobs: jobs.length,
  };

  const mkTab = (tab: Tab) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (where) p.set('where', where);
    if (tab !== 'companies') p.set('tab', tab);
    return `/search?${p.toString()}`;
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'companies', label: t('tabCompanies') },
    { key: 'categories', label: t('tabCategories') },
    { key: 'products', label: t('tabProducts') },
    { key: 'jobs', label: t('tabJobs') },
  ];

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: tc('home') }, { label: t('resultsGeneric') }]} />
      <header className="mb-6 mt-4">
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
          {q ? t('resultsFor', { query: q }) : t('resultsGeneric')}
          {where && <span className="text-meta"> {t('in', { place: where })}</span>}
        </h1>
        {(matchedCategory || matchedKeyword) && (
          <p className="mt-1 text-sm text-ink-soft">
            {matchedCategory && (
              <>{t('matchedCategory')}: <Link href={`/category/${matchedCategory}`} className="link font-medium">{ja ? CATEGORY_BY_SLUG[matchedCategory]?.nameJa : CATEGORY_BY_SLUG[matchedCategory]?.name}</Link>. </>
            )}
            {matchedKeyword && <>{t('matchedKeyword')}: <span className="font-medium text-ink">“{matchedKeyword}”</span>.</>}
          </p>
        )}
      </header>

      {/* Tabs — the index-tab motif reused for result types. */}
      <div className="flex items-end gap-0.5 overflow-x-auto border-b border-rule">
        {TABS.map((tb) => (
          <Link key={tb.key} href={mkTab(tb.key)} data-active={tab === tb.key} className="idx-tab whitespace-nowrap" style={{ ['--tab-hue' as string]: '#3B4A6B' }}>
            {tb.label} <span className="tnum text-xs text-meta">({counts[tb.key]})</span>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {companies.length === 0 && catMatches.length === 0 ? (
          <EmptyState q={q} />
        ) : tab === 'companies' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {companies.slice(0, 24).map((b) => <BusinessCard key={b.id} b={b} />)}
          </div>
        ) : tab === 'categories' ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {catMatches.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className="panel flex items-center justify-between p-3.5 hover:border-[#c9c8bf]">
                <span className="flex items-center gap-2 font-medium text-ink">
                  <span className="h-2 w-2 rounded-full" style={{ background: GROUP_BY_KEY[c.group].hue }} />{ja ? c.nameJa : c.name}
                </span>
                <span className="tnum text-xs text-meta">{(c.count / 1000).toFixed(1)}k</span>
              </Link>
            ))}
          </div>
        ) : tab === 'products' ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {products.map(({ p, b }, i) => (
              <Link key={i} href={companyHref(b)} className="panel flex items-center justify-between gap-3 p-3.5 hover:border-[#c9c8bf]">
                <div><div className="font-medium text-ink">{p.name}</div><div className="text-xs text-meta">{b.name}</div></div>
                <span className="tnum font-mono font-semibold text-ink">{yen(p.price)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {jobs.map(({ j, b }, i) => (
              <Link key={i} href={companyHref(b)} className="panel flex items-center justify-between gap-3 p-3.5 hover:border-[#c9c8bf]">
                <div><div className="font-medium text-ink">{j.title}</div><div className="text-xs text-meta">{b.name} · {j.type}</div></div>
                <span className="tnum text-sm text-ink-soft">¥{j.salaryMin.toLocaleString()}+</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

async function EmptyState({ q }: { q: string }) {
  const t = await getTranslations('search');
  return (
    <div className="panel p-8 text-center sm:p-12">
      <h2 className="font-display text-xl font-bold text-ink">{t('noResultsTitle', { query: q })}</h2>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">
        {t('noResultsBody')}
      </p>
      <div className="mx-auto mt-5 flex max-w-lg flex-wrap justify-center gap-2">
        {CATEGORIES.slice(0, 8).map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`} className="rounded-sm border border-rule bg-panel px-2.5 py-1.5 text-sm text-ink-soft hover:border-[#c9c8bf] hover:text-ink">
            {c.name}
          </Link>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {CITIES.slice(0, 6).map((c) => (
          <Link key={c.slug} href={`/location/${c.slug}`} className="text-sm font-medium text-indigo hover:underline">
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
