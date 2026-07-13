import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CATEGORY_GROUPS, CATEGORIES } from '@/lib/categories';
import { CITIES } from '@/lib/cities';
import { SearchBar } from './SearchBar';
import { MobileMenu } from './MobileMenu';
import { LangSwitch } from './LangSwitch';
import { Logo } from './Logo';

export async function SiteHeader() {
  const locale = await getLocale();
  const t = await getTranslations('nav');
  const tc = await getTranslations('common');
  const ja = locale === 'ja';

  const NAV = [
    { href: '/categories', label: t('browse') },
    { href: '/locations', label: t('cities') },
    { href: '/saas', label: t('dataHub') },
    { href: '/buzz', label: t('articles') },
    { href: '/holidays', label: t('holidays') },
  ];

  const categoryNames = CATEGORIES.map((c) => (ja ? c.nameJa : c.name));
  const cityNames = CITIES.map((c) => (ja ? c.nameJa : c.name));

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <div className="shell flex items-center gap-4 py-3">
        <Link href="/" aria-label="NihonPages home" className="shrink-0">
          <Logo />
        </Link>

        <div className="hidden flex-1 md:block">
          <SearchBar categories={categoryNames} cities={cityNames} variant="compact" />
        </div>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded px-2.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-[#f1f0ea] hover:text-ink"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <LangSwitch />
          <Link href="/account" className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:inline-block">
            {tc('signIn')}
          </Link>
          <Link href="/get-listed" className="btn btn-primary hidden sm:inline-flex">
            {tc('getListed')}
          </Link>
          <MobileMenu nav={NAV} categoryNames={categoryNames} cityNames={cityNames} />
        </div>
      </div>

      {/* ---- Signature: color-coded index tabs for the category groups ------- */}
      <div className="border-t border-rule bg-[#f1f0ea]">
        <div className="shell">
          <nav aria-label="Category groups" className="flex items-end gap-0.5 overflow-x-auto pt-1.5">
            {CATEGORY_GROUPS.map((g) => (
              <Link
                key={g.key}
                href={`/categories?group=${g.key}`}
                className="idx-tab whitespace-nowrap"
                style={{ ['--tab-hue' as string]: g.hue }}
              >
                {ja ? g.nameJa : g.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
