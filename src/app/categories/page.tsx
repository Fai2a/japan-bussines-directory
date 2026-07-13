import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CategoryBrowser } from '@/components/browse/CategoryBrowser';
import { CATEGORIES, CATEGORY_GROUPS } from '@/lib/categories';

export const metadata: Metadata = {
  title: 'Browse all categories',
  description: 'Explore every business category on NihonPages — food, health, trades, professional services, retail, education, automotive, travel and more.',
};

export default function CategoriesPage({ searchParams }: { searchParams: { group?: string } }) {
  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Categories' }]} />
      <header className="mb-8 mt-4 max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Browse categories
        </h1>
        <p className="mt-2 text-ink-soft">
          Every category is colour-coded by group — the same tab colours you see across the site.
          Pick a group tab or search to narrow down.
        </p>
      </header>
      <CategoryBrowser groups={CATEGORY_GROUPS} categories={CATEGORIES} initialGroup={searchParams.group} />
    </div>
  );
}
