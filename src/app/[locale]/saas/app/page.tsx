'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BUSINESSES } from '@/lib/businesses';
import { CATEGORY_BY_SLUG, CATEGORIES } from '@/lib/categories';
import { CITY_BY_SLUG, CITIES, PREFECTURES } from '@/lib/cities';
import { DATAHUB_PLANS } from '@/lib/plans';
import type { Business } from '@/lib/types';

type SortCol = 'name' | 'city' | 'category' | 'established' | 'employees';
interface Filters {
  q: string;
  category: string;
  prefecture: string;
  hasEmail: boolean;
  hasPhone: boolean;
  empMin: string;
  empMax: string;
  yearMin: string;
  yearMax: string;
}
const EMPTY: Filters = { q: '', category: '', prefecture: '', hasEmail: false, hasPhone: false, empMin: '', empMax: '', yearMin: '', yearMax: '' };

const PLAN_KEY = 'np_datahub_plan';
const QUOTA_KEY = 'np_datahub_exported'; // rows exported this cycle
const SAVED_KEY = 'np_datahub_saved';

function quotaFor(planId: string) {
  const map: Record<string, number> = { starter: 1000, pro: 15000, enterprise: 200000 };
  return map[planId] ?? 1000;
}

export default function DataHubApp() {
  const [planId, setPlanId] = useState('pro');
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [sort, setSort] = useState<{ col: SortCol; dir: 1 | -1 }>({ col: 'name', dir: 1 });
  const [exported, setExported] = useState(0);
  const [saved, setSaved] = useState<{ name: string; filters: Filters }[]>([]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    try {
      setPlanId(localStorage.getItem(PLAN_KEY) || 'pro');
      setExported(Number(localStorage.getItem(QUOTA_KEY) || 0));
      setSaved(JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'));
    } catch {}
  }, []);

  const quota = quotaFor(planId);
  const remaining = Math.max(0, quota - exported);

  const rows = useMemo(() => {
    const f = filters;
    const q = f.q.trim().toLowerCase();
    let out = BUSINESSES.filter((b) => {
      if (q && !(b.name.toLowerCase().includes(q) || b.nameJa.includes(f.q) || b.address.toLowerCase().includes(q))) return false;
      if (f.category && !b.categorySlugs.includes(f.category)) return false;
      if (f.prefecture && b.prefecture !== f.prefecture) return false;
      if (f.hasEmail && !b.email) return false;
      if (f.hasPhone && !b.phone) return false;
      if (f.empMin && b.employees < Number(f.empMin)) return false;
      if (f.empMax && b.employees > Number(f.empMax)) return false;
      if (f.yearMin && b.established < Number(f.yearMin)) return false;
      if (f.yearMax && b.established > Number(f.yearMax)) return false;
      return true;
    });
    const { col, dir } = sort;
    out = [...out].sort((a, b) => {
      const av = colVal(a, col), bv = colVal(b, col);
      return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
    });
    return out;
  }, [filters, sort]);

  function setPlan(id: string) { setPlanId(id); try { localStorage.setItem(PLAN_KEY, id); } catch {} }
  function toggleSort(col: SortCol) { setSort((s) => (s.col === col ? { col, dir: (s.dir * -1) as 1 | -1 } : { col, dir: 1 })); }

  function exportCsv() {
    if (rows.length > remaining) {
      setToast(`Export exceeds your remaining quota (${remaining.toLocaleString()} rows). Narrow the filters or upgrade.`);
      setTimeout(() => setToast(''), 4000);
      return;
    }
    const header = ['Name', 'Name (JA)', 'City', 'Prefecture', 'Category', 'Phone', 'Email', 'Website', 'Established', 'Employees'];
    const body = rows.map((b) => [b.name, b.nameJa, CITY_BY_SLUG[b.citySlug]?.name, b.prefecture, CATEGORY_BY_SLUG[b.categorySlugs[0]]?.name, b.phone, b.email, b.website ?? '', b.established, b.employees]
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [header.join(','), ...body].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `nihonpages-datahub-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    const used = exported + rows.length;
    setExported(used);
    try { localStorage.setItem(QUOTA_KEY, String(used)); } catch {}
    setToast(`Exported ${rows.length.toLocaleString()} rows.`);
    setTimeout(() => setToast(''), 3000);
  }

  function saveSearch() {
    const name = prompt('Name this saved search:');
    if (!name) return;
    const next = [...saved, { name, filters }];
    setSaved(next);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch {}
  }
  function removeSaved(i: number) {
    const next = saved.filter((_, x) => x !== i);
    setSaved(next);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch {}
  }

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <div className="shell py-6">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/saas', label: 'Data Hub' }, { label: 'App' }]} />

      {/* Subscription bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-rule bg-panel p-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-sm bg-ink px-1.5 py-0.5 text-2xs font-bold uppercase text-paper">No ads</span>
          <span className="text-meta">Plan</span>
          <select value={planId} onChange={(e) => setPlan(e.target.value)} className="rounded-sm border border-rule bg-panel px-2 py-1 text-sm font-medium">
            {DATAHUB_PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="tnum text-meta">Export quota: <span className="font-semibold text-ink">{remaining.toLocaleString()}</span> / {quota.toLocaleString()} rows left</span>
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[#ecebe4]"><div className="h-full rounded-full bg-ok" style={{ width: `${(remaining / quota) * 100}%` }} /></div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr]">
        {/* Filters */}
        <aside className="space-y-3">
          <div className="panel p-3">
            <p className="eyebrow mb-2">Filters</p>
            <input value={filters.q} onChange={(e) => set('q', e.target.value)} placeholder="Search name or address" className="mb-2 w-full rounded-sm border border-rule bg-panel px-2 py-1.5 text-sm focus:outline-none focus-visible:border-indigo" />
            <select value={filters.category} onChange={(e) => set('category', e.target.value)} className="mb-2 w-full rounded-sm border border-rule bg-panel px-2 py-1.5 text-sm">
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
            <select value={filters.prefecture} onChange={(e) => set('prefecture', e.target.value)} className="mb-2 w-full rounded-sm border border-rule bg-panel px-2 py-1.5 text-sm">
              <option value="">All prefectures</option>
              {PREFECTURES.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
            <label className="mb-1 flex items-center gap-2 text-sm text-ink-soft"><input type="checkbox" checked={filters.hasEmail} onChange={(e) => set('hasEmail', e.target.checked)} /> Has email</label>
            <label className="mb-2 flex items-center gap-2 text-sm text-ink-soft"><input type="checkbox" checked={filters.hasPhone} onChange={(e) => set('hasPhone', e.target.checked)} /> Has phone</label>
            <p className="mb-1 mt-2 text-xs font-medium text-meta">Employees</p>
            <div className="mb-2 flex gap-2">
              <input value={filters.empMin} onChange={(e) => set('empMin', e.target.value.replace(/\D/g, ''))} placeholder="min" className="tnum w-full rounded-sm border border-rule bg-panel px-2 py-1 text-sm" />
              <input value={filters.empMax} onChange={(e) => set('empMax', e.target.value.replace(/\D/g, ''))} placeholder="max" className="tnum w-full rounded-sm border border-rule bg-panel px-2 py-1 text-sm" />
            </div>
            <p className="mb-1 text-xs font-medium text-meta">Established</p>
            <div className="mb-2 flex gap-2">
              <input value={filters.yearMin} onChange={(e) => set('yearMin', e.target.value.replace(/\D/g, ''))} placeholder="from" className="tnum w-full rounded-sm border border-rule bg-panel px-2 py-1 text-sm" />
              <input value={filters.yearMax} onChange={(e) => set('yearMax', e.target.value.replace(/\D/g, ''))} placeholder="to" className="tnum w-full rounded-sm border border-rule bg-panel px-2 py-1 text-sm" />
            </div>
            <button onClick={() => setFilters(EMPTY)} className="w-full text-xs font-medium text-meta hover:text-ink">Clear all</button>
          </div>

          <div className="panel p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="eyebrow">Saved searches</p>
              <button onClick={saveSearch} className="text-xs font-semibold text-indigo hover:underline">Save current</button>
            </div>
            {saved.length === 0 ? <p className="text-xs text-meta">Save a filter set to reuse it later.</p> : (
              <ul className="space-y-1">
                {saved.map((s, i) => (
                  <li key={i} className="flex items-center justify-between gap-2">
                    <button onClick={() => setFilters(s.filters)} className="truncate text-sm text-ink-soft hover:text-indigo">{s.name}</button>
                    <button onClick={() => removeSaved(i)} className="text-meta hover:text-seal" aria-label="Delete saved search">✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Table */}
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="tnum text-sm text-meta"><span className="font-semibold text-ink">{rows.length.toLocaleString()}</span> companies match</p>
            <div className="flex gap-2">
              <button onClick={saveSearch} className="btn btn-secondary py-1.5 text-sm">Save search</button>
              <button onClick={exportCsv} className="btn btn-primary py-1.5 text-sm">Export CSV</button>
            </div>
          </div>

          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-rule bg-[#f4f3ee] text-left">
                  {([['name', 'Company'], ['city', 'City'], ['category', 'Category'], ['established', 'Est.'], ['employees', 'Emp.']] as [SortCol, string][]).map(([col, label]) => (
                    <th key={col} className="whitespace-nowrap px-3 py-2 font-mono text-2xs font-semibold uppercase tracking-wide text-meta">
                      <button onClick={() => toggleSort(col)} className="inline-flex items-center gap-1 hover:text-ink">
                        {label}{sort.col === col && <span>{sort.dir === 1 ? '▲' : '▼'}</span>}
                      </button>
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-3 py-2 font-mono text-2xs font-semibold uppercase tracking-wide text-meta">Phone</th>
                  <th className="whitespace-nowrap px-3 py-2 font-mono text-2xs font-semibold uppercase tracking-wide text-meta">Email</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((b) => (
                  <tr key={b.id} className="border-b border-rule/70 last:border-0 hover:bg-[#f8f7f2]">
                    <td className="px-3 py-1.5">
                      <Link href={`/company/${b.id}/${b.slug}`} className="font-medium text-ink hover:text-indigo">{b.name}</Link>
                    </td>
                    <td className="px-3 py-1.5 text-ink-soft">{CITY_BY_SLUG[b.citySlug]?.name}</td>
                    <td className="px-3 py-1.5 text-ink-soft">{CATEGORY_BY_SLUG[b.categorySlugs[0]]?.name}</td>
                    <td className="tnum px-3 py-1.5 text-ink-soft">{b.established}</td>
                    <td className="tnum px-3 py-1.5 text-ink-soft">{b.employees}</td>
                    <td className="tnum whitespace-nowrap px-3 py-1.5 font-mono text-xs text-ink-soft">{b.phone}</td>
                    <td className="px-3 py-1.5 font-mono text-xs text-indigo">{b.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 200 && <p className="mt-2 text-xs text-meta">Showing first 200 of {rows.length.toLocaleString()} — export to CSV for the full set.</p>}
        </div>
      </div>

      {toast && <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md bg-ink px-4 py-2 text-sm text-paper shadow-lift">{toast}</div>}
    </div>
  );
}

function colVal(b: Business, col: SortCol): string | number {
  switch (col) {
    case 'name': return b.name.toLowerCase();
    case 'city': return CITY_BY_SLUG[b.citySlug]?.name ?? '';
    case 'category': return CATEGORY_BY_SLUG[b.categorySlugs[0]]?.name ?? '';
    case 'established': return b.established;
    case 'employees': return b.employees;
  }
}
