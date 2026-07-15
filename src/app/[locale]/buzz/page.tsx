import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ARTICLES } from '@/lib/articles';
import { shortDate } from '@/lib/format';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'buzz' });
  return { title: t('metaTitle'), description: t('metaDescription') };
}

export default async function BuzzPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations('buzz');
  const tc = await getTranslations('common');
  const [lead, ...rest] = ARTICLES;
  const categories = Array.from(new Set(ARTICLES.map((a) => a.category)));

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: tc('home') }, { label: t('crumb') }]} />
      <header className="mt-4">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight text-ink">{t('crumb')}</h1>
        <p className="mt-2 max-w-xl text-ink-soft">{t('intro')}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <span key={c} className="rounded-sm border border-rule bg-panel px-2 py-1 text-xs font-medium text-ink-soft">{c}</span>
          ))}
        </div>
      </header>

      {/* Lead article */}
      <Link href={`/buzz/${lead.slug}`} className="group mt-8 grid overflow-hidden rounded-lg border border-rule md:grid-cols-2">
        <div className="relative aspect-[16/10] md:aspect-auto">
          <Image src={lead.cover} alt="" fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
        </div>
        <div className="flex flex-col justify-center bg-panel p-6 sm:p-8">
          <span className="text-xs font-semibold uppercase tracking-wide text-seal">{lead.category}</span>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink group-hover:text-indigo sm:text-3xl">{lead.title}</h2>
          <p className="mt-2 text-ink-soft">{lead.excerpt}</p>
          <p className="mt-3 text-xs text-meta">{lead.author} · {shortDate(lead.date)} · {t('readMins', { count: lead.readMins })}</p>
        </div>
      </Link>

      {/* Grid */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((a) => (
          <Link key={a.slug} href={`/buzz/${a.slug}`} className="group flex flex-col overflow-hidden rounded-md border border-rule">
            <div className="relative aspect-[16/10]">
              <Image src={a.cover} alt="" fill sizes="(max-width: 640px) 100vw, 380px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
            <div className="flex flex-1 flex-col bg-panel p-4">
              <span className="text-2xs font-semibold uppercase tracking-wide text-seal">{a.category}</span>
              <h3 className="mt-1 font-display text-lg font-bold leading-tight text-ink group-hover:text-indigo">{a.title}</h3>
              <p className="mt-1 flex-1 text-sm text-ink-soft">{a.excerpt}</p>
              <p className="mt-3 text-xs text-meta">{shortDate(a.date)} · {t('readMins', { count: a.readMins })}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
