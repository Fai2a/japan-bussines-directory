'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface Props {
  cities?: { slug: string; name: string }[];
  total: number;
  hideCity?: boolean;
}

const SORTS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top rated' },
  { value: 'alpha', label: 'A–Z' },
];

export function FilterBar({ cities = [], total, hideCity }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
      next.delete('page'); // reset pagination on any filter change
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const toggle = (key: string) => setParam(key, params.get(key) ? null : '1');
  const active = (key: string) => Boolean(params.get(key));
  const hasFilters = ['city', 'rating', 'verified', 'photos', 'open'].some((k) => params.get(k));

  const chip = (on: boolean) =>
    `rounded-sm border px-2.5 py-1.5 text-sm font-medium transition-colors ${
      on ? 'border-indigo bg-indigo-wash text-indigo' : 'border-rule bg-panel text-ink-soft hover:border-[#c9c8bf]'
    }`;

  return (
    <div className="flex flex-col gap-3 border-b border-rule pb-4">
      <div className="flex flex-wrap items-center gap-2">
        {!hideCity && cities.length > 0 && (
          <select
            aria-label="Filter by city"
            value={params.get('city') ?? ''}
            onChange={(e) => setParam('city', e.target.value || null)}
            className="rounded-sm border border-rule bg-panel px-2.5 py-1.5 text-sm text-ink"
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        )}

        <select
          aria-label="Minimum rating"
          value={params.get('rating') ?? ''}
          onChange={(e) => setParam('rating', e.target.value || null)}
          className="rounded-sm border border-rule bg-panel px-2.5 py-1.5 text-sm text-ink"
        >
          <option value="">Any rating</option>
          <option value="4.5">4.5+ stars</option>
          <option value="4">4.0+ stars</option>
          <option value="3.5">3.5+ stars</option>
        </select>

        <button type="button" onClick={() => toggle('verified')} className={chip(active('verified'))} aria-pressed={active('verified')}>
          Verified
        </button>
        <button type="button" onClick={() => toggle('photos')} className={chip(active('photos'))} aria-pressed={active('photos')}>
          Has photos
        </button>
        <button type="button" onClick={() => toggle('open')} className={chip(active('open'))} aria-pressed={active('open')}>
          Open now
        </button>

        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push(pathname, { scroll: false })}
            className="text-sm font-medium text-meta underline-offset-2 hover:text-ink hover:underline"
          >
            Clear
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="tnum hidden text-sm text-meta sm:inline">{total.toLocaleString('en-US')} results</span>
          <label className="sr-only" htmlFor="sort">Sort</label>
          <select
            id="sort"
            value={params.get('sort') ?? 'relevance'}
            onChange={(e) => setParam('sort', e.target.value === 'relevance' ? null : e.target.value)}
            className="rounded-sm border border-rule bg-panel px-2.5 py-1.5 text-sm text-ink"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>Sort: {s.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
