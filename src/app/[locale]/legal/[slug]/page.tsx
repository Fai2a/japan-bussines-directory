import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const SLUGS = ['terms-of-use', 'terms-of-service', 'privacy', 'cookies'] as const;
type Slug = (typeof SLUGS)[number];

const UPDATED_AT: Record<Slug, string> = {
  'terms-of-use': '2026-07-01',
  'terms-of-service': '2026-07-01',
  privacy: '2026-07-01',
  cookies: '2026-07-01',
};

const SECTION_COUNT: Record<Slug, number> = {
  'terms-of-use': 4,
  'terms-of-service': 4,
  privacy: 4,
  cookies: 3,
};

function isSlug(v: string): v is Slug {
  return (SLUGS as readonly string[]).includes(v);
}

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string; locale: string } }): Promise<Metadata> {
  if (!isSlug(params.slug)) return {};
  const t = await getTranslations({ locale: params.locale, namespace: 'legal' });
  return { title: t(`docs.${params.slug}.title`) };
}

export default async function LegalPage({ params }: { params: { slug: string; locale: string } }) {
  if (!isSlug(params.slug)) notFound();
  setRequestLocale(params.locale);
  const slug = params.slug;

  const t = await getTranslations('legal');
  const tc = await getTranslations('common');
  const title = t(`docs.${slug}.title`);
  const updated = new Intl.DateTimeFormat(params.locale === 'ja' ? 'ja-JP' : 'en-US', { dateStyle: 'long' }).format(
    new Date(UPDATED_AT[slug]),
  );

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: tc('home') }, { label: title }]} />
      <article className="mx-auto mt-6 max-w-prose">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
        <p className="mt-1 text-sm text-meta">{t('lastUpdated', { date: updated })}</p>
        <div className="mt-8 space-y-7">
          {Array.from({ length: SECTION_COUNT[slug] }).map((_, i) => (
            <section key={i}>
              <h2 className="font-display text-lg font-bold text-ink">{t(`docs.${slug}.sections.${i}.h`)}</h2>
              <p className="mt-1.5 text-ink-soft">{t(`docs.${slug}.sections.${i}.p`)}</p>
            </section>
          ))}
        </div>
        <p className="mt-10 rounded-md border border-rule bg-[#f4f3ee] p-4 text-sm text-meta">{t('templateNotice')}</p>
      </article>
    </div>
  );
}
