'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SearchBar } from './SearchBar';
import { CATEGORY_GROUPS } from '@/lib/categories';

interface Props {
  nav: { href: string; label: string }[];
  categoryNames: string[];
  cityNames: string[];
}

export function MobileMenu({ nav, categoryNames, cityNames }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="btn btn-secondary px-2.5"
      >
        <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          {open ? (
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          ) : (
            <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open && (
        <div className="fixed inset-x-0 top-[57px] z-40 max-h-[calc(100vh-57px)] overflow-y-auto border-t border-rule bg-paper p-4 shadow-lift">
          <div className="mb-4 md:hidden">
            <SearchBar categories={categoryNames} cities={cityNames} variant="compact" />
          </div>
          <nav className="grid gap-1" aria-label="Mobile">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded px-3 py-2.5 text-base font-medium hover:bg-[#f1f0ea]"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 border-t border-rule pt-4">
            <p className="eyebrow mb-2">Category groups</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_GROUPS.map((g) => (
                <Link
                  key={g.key}
                  href={`/categories?group=${g.key}`}
                  onClick={() => setOpen(false)}
                  className="rounded-sm px-2 py-1 text-xs font-semibold"
                  style={{ color: g.hue, background: `${g.hue}14` }}
                >
                  {g.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-rule pt-4">
            <Link href="/account" onClick={() => setOpen(false)} className="btn btn-secondary">
              Sign in
            </Link>
            <Link href="/get-listed" onClick={() => setOpen(false)} className="btn btn-primary">
              Get Listed
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
