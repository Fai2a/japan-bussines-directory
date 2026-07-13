'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';

/**
 * EN / 日本語 switcher — swaps the active locale while staying on the same page.
 *
 * Deliberately avoids next/navigation's useSearchParams(): that hook forces
 * every page that renders it into dynamic/CSR-bailout rendering unless wrapped
 * in Suspense, and since this component sits in the header on every route via
 * SiteHeader, it would break static generation site-wide. The query string is
 * only needed at click time, so we read window.location.search there instead.
 */
export function LangSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="inline-flex overflow-hidden rounded border border-rule text-xs font-semibold">
      {(['en', 'ja'] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={locale === l}
          onClick={() => {
            const qs = typeof window !== 'undefined' ? window.location.search : '';
            router.replace(`${pathname}${qs}`, { locale: l });
          }}
          className={`px-2 py-1 transition-colors ${
            locale === l ? 'bg-ink text-paper' : 'bg-panel text-ink-soft hover:bg-[#f1f0ea]'
          } ${l === 'ja' ? 'font-jp' : ''}`}
        >
          {l === 'en' ? 'EN' : '日本語'}
        </button>
      ))}
    </div>
  );
}
