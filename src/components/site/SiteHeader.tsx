import Link from 'next/link';
import { CATEGORY_GROUPS, CATEGORIES } from '@/lib/categories';
import { CITIES } from '@/lib/cities';
import { SearchBar } from './SearchBar';
import { MobileMenu } from './MobileMenu';
import { LangSwitch } from './LangSwitch';
import { Logo } from './Logo';

const NAV = [
  { href: '/categories', label: 'Browse' },
  { href: '/locations', label: 'Cities' },
  { href: '/saas', label: 'Data Hub' },
  { href: '/buzz', label: 'Articles' },
  { href: '/holidays', label: 'Holidays' },
];

export function SiteHeader() {
  const categoryNames = CATEGORIES.map((c) => c.name);
  const cityNames = CITIES.map((c) => c.name);

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
            Sign in
          </Link>
          <Link href="/get-listed" className="btn btn-primary hidden sm:inline-flex">
            Get Listed
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
                {g.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
