import Link from 'next/link';
import { Logo } from './Logo';
import { TOTAL_COMPANIES } from '@/lib/categories';

const RESOURCES = [
  { href: '/network', label: 'Global Network' },
  { href: '/holidays', label: 'Public Holidays in Japan' },
  { href: '/saas', label: 'Data Hub' },
  { href: '/buzz', label: 'Articles' },
];
const USERS = [
  { href: '/get-listed', label: 'Get Listed' },
  { href: '/remove-company', label: 'Remove Company' },
  { href: '/account', label: 'Sign In' },
  { href: '/contact', label: 'Support & Contact' },
];
const LEGAL = [
  { href: '/legal/terms-of-use', label: 'Terms of Use' },
  { href: '/legal/cookies', label: 'Cookies Policy' },
  { href: '/legal/privacy', label: 'Privacy Policy' },
  { href: '/legal/terms-of-service', label: 'Terms of Service' },
];

const STATS = [
  { label: 'Companies', value: TOTAL_COMPANIES.toLocaleString('en-US') },
  { label: 'Reviews', value: '486,203' },
  { label: 'Photos', value: '1,240,880' },
  { label: 'Products', value: '312,540' },
];

function Col({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="eyebrow mb-3">{title}</h3>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-ink-soft transition-colors hover:text-ink">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-rule bg-[#f4f3ee]">
      <div className="shell py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-ink-soft">
              Japan’s local business directory. Discover, review, and connect with businesses across
              every prefecture — in English and 日本語.
            </p>
            <div className="mt-4 flex gap-2">
              <a
                href="https://facebook.com"
                aria-label="Facebook"
                className="grid h-9 w-9 place-items-center rounded border border-rule bg-panel text-ink-soft transition-colors hover:text-indigo"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                  <path d="M14 8.5V7c0-.8.2-1.2 1.4-1.2H17V3h-2.6C11.6 3 11 4.5 11 6.6v1.9H9V11h2v9h3v-9h2.2l.3-2.5H14z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                aria-label="LinkedIn"
                className="grid h-9 w-9 place-items-center rounded border border-rule bg-panel text-ink-soft transition-colors hover:text-indigo"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                  <path d="M6.9 8H4V20h2.9V8zM5.4 3.5A1.7 1.7 0 105.4 7a1.7 1.7 0 000-3.4zM20 20h-2.9v-5.9c0-1.5-.5-2.4-1.8-2.4-1 0-1.5.7-1.8 1.3-.1.2-.1.6-.1.9V20H10.5V8h2.8v1.6c.4-.6 1.1-1.5 2.7-1.5 2 0 3.9 1.3 3.9 4.1V20z" />
                </svg>
              </a>
            </div>
          </div>

          <Col title="Resources" links={RESOURCES} />
          <Col title="For Users" links={USERS} />
          <Col title="Legal" links={LEGAL} />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 border-t border-rule pt-6 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="tnum font-mono text-lg font-semibold text-ink">{s.value}</div>
              <div className="text-xs text-meta">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col justify-between gap-2 border-t border-rule pt-6 text-xs text-meta sm:flex-row">
          <p>© {new Date().getFullYear()} NihonPages. Independent directory. Not affiliated with any government body.</p>
          <p>Made in Japan · データは参考情報です</p>
        </div>
      </div>
    </footer>
  );
}
