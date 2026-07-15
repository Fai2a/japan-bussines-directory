import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ARTICLES, ARTICLE_BY_SLUG } from '@/lib/articles';
import { shortDate } from '@/lib/format';

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const a = ARTICLE_BY_SLUG[params.slug];
  if (!a) return {};
  return {
    title: a.title,
    description: a.excerpt,
    alternates: { canonical: `/buzz/${a.slug}` },
    openGraph: { title: a.title, description: a.excerpt, type: 'article', images: [a.cover] },
  };
}

/** Minimal inline renderer for **bold** within a paragraph. */
function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default async function ArticlePage({ params }: { params: { slug: string; locale: string } }) {
  const a = ARTICLE_BY_SLUG[params.slug];
  if (!a) notFound();
  setRequestLocale(params.locale);
  const t = await getTranslations('buzz');
  const tc = await getTranslations('common');
  const more = ARTICLES.filter((x) => x.slug !== a.slug).slice(0, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.excerpt,
    image: a.cover,
    datePublished: a.date,
    author: { '@type': 'Organization', name: a.author },
    publisher: { '@type': 'Organization', name: 'NihonPages' },
  };

  return (
    <div className="shell py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={[{ href: '/', label: tc('home') }, { href: '/buzz', label: t('crumb') }, { label: a.title }]} />

      <article className="mx-auto mt-4 max-w-prose">
        <span className="text-xs font-semibold uppercase tracking-wide text-seal">{a.category}</span>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">{a.title}</h1>
        <p className="mt-3 text-xs text-meta">{a.author} · {shortDate(a.date)} · {t('readMins', { count: a.readMins })}</p>

        <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-lg border border-rule">
          <Image src={a.cover} alt="" fill priority sizes="(max-width: 768px) 100vw, 680px" className="object-cover" />
        </div>

        <div className="mt-6 space-y-4 text-[1.02rem] leading-[1.75] text-ink-soft">
          {a.body.map((p, i) => (
            <p key={i}>{renderInline(p)}</p>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-rule pt-5">
          <Link href="/buzz" className="link text-sm font-semibold">{t('allArticles')}</Link>
          <Link href="/get-listed" className="btn btn-primary">{t('getListedCta')}</Link>
        </div>
      </article>

      <section className="mx-auto mt-12 max-w-4xl">
        <h2 className="mb-4 font-display text-xl font-bold text-ink">{t('moreFromBuzz')}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {more.map((m) => (
            <Link key={m.slug} href={`/buzz/${m.slug}`} className="group flex flex-col overflow-hidden rounded-md border border-rule">
              <div className="relative aspect-[16/10]">
                <Image src={m.cover} alt="" fill sizes="240px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="flex-1 bg-panel p-3">
                <h3 className="font-display text-sm font-bold leading-tight text-ink group-hover:text-indigo">{m.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
