'use client';

import { useState } from 'react';
import type { Business } from '@/lib/types';
import { BusinessCard } from '@/components/ui/BusinessCard';
import { Pagination } from '@/components/ui/Pagination';
import { MapView } from './MapView';

/**
 * List/Map toggle for category & city result grids (Phase 2 map discovery).
 * The list view keeps SSR pagination + featured pinning; the map view plots
 * every filtered result so you can explore geographically and draw-search.
 */
export function ResultsView({
  featured,
  standard,
  allForMap,
  page,
  pages,
  baseQuery,
}: {
  featured: Business[];
  standard: Business[];
  allForMap: Business[];
  page: number;
  pages: number;
  baseQuery: string;
}) {
  const [view, setView] = useState<'list' | 'map'>('list');

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-end">
        <div className="inline-flex overflow-hidden rounded-sm border border-rule text-sm font-medium">
          {(['list', 'map'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                view === v ? 'bg-ink text-paper' : 'bg-panel text-ink-soft hover:bg-[#f1f0ea]'
              }`}
            >
              {v === 'list' ? (
                <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" aria-hidden><path d="M3 4h14v2.5H3zM3 8.7h14v2.5H3zM3 13.5h14V16H3z" /></svg>
              ) : (
                <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M10 2c3 0 5 2.2 5 5 0 3.5-5 11-5 11S5 10.5 5 7c0-2.8 2-5 5-5z" /><circle cx="10" cy="7" r="1.6" /></svg>
              )}
              {v === 'list' ? 'List' : 'Map'}
            </button>
          ))}
        </div>
      </div>

      {view === 'map' ? (
        <MapView businesses={allForMap} />
      ) : (
        <>
          {featured.length > 0 && (
            <div className="mb-6">
              <p className="eyebrow mb-3">Featured · clearly labelled</p>
              <div className="grid gap-3">
                {featured.map((b) => <BusinessCard key={b.id} b={b} featured />)}
              </div>
            </div>
          )}
          <div className="grid gap-3">
            {standard.map((b) => <BusinessCard key={b.id} b={b} />)}
          </div>
          <Pagination page={page} pages={pages} baseQuery={baseQuery} />
        </>
      )}
    </div>
  );
}
