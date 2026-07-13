import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CategoryBrowser } from '@/components/browse/CategoryBrowser';
import { CATEGORIES, CATEGORY_GROUPS } from '@/lib/categories';

export const metadata: Metadata = {
  title: 'Browse all categories',
  description: 'Explore every business category on NihonPages — food, health, trades, professional services, retail, education, automotive, travel and more.',
};

export default async function CategoriesPage({ params, searchParams }: { params: { locale: string }; searchParams: { group?: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations('browse');
  const tc = await getTranslations('common');

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: tc('home') }, { label: t('title') }]} />
      <header className="mb-8 mt-4 max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-2 text-ink-soft">
          {t('subtitle')}
        </p>
      </header>
      <CategoryBrowser groups={CATEGORY_GROUPS} categories={CATEGORIES} initialGroup={searchParams.group} />
    </div>
  );
}
