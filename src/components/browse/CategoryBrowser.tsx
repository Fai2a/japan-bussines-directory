'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import type { Category, CategoryGroup } from '@/lib/types';

interface Props {
  groups: CategoryGroup[];
  categories: Category[];
  initialGroup?: string;
}

export function CategoryBrowser({ groups, categories, initialGroup }: Props) {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState(initialGroup ?? 'all');
  const locale = useLocale();
  const ja = locale === 'ja';
  const t = useTranslations('browse');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return categories.filter((c) => {
      if (group !== 'all' && c.group !== group) return false;
      if (query && !c.name.toLowerCase().includes(query) && !c.nameJa.includes(q) && !c.blurb.toLowerCase().includes(query))
        return false;
      return true;
    });
  }, [categories, q, group, initialGroup]);

  const byGroup = groups
    .map((g) => ({ g, items: filtered.filter((c) => c.group === g.key) }))
    .filter((x) => x.items.length > 0);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-md border border-rule bg-panel px-4 py-2.5 text-sm text-ink placeholder:text-meta focus:outline-none focus-visible:border-indigo"
            aria-label={t('searchPlaceholder')}
          />
        </div>
        {/* Index tabs as the group filter — the signature motif reused. */}
        <div className="flex items-end gap-0.5 overflow-x-auto">
          <button
            onClick={() => setGroup('all')}
            data-active={group === 'all'}
            className="idx-tab whitespace-nowrap"
            style={{ ['--tab-hue' as string]: '#8A8B85' }}
          >
            {t('all')}
          </button>
          {groups.map((g) => (
            <button
              key={g.key}
              onClick={() => setGroup(g.key)}
              data-active={group === g.key}
              className="idx-tab whitespace-nowrap"
              style={{ ['--tab-hue' as string]: g.hue }}
            >
              {ja ? g.nameJa : g.name}
            </button>
          ))}
        </div>
      </div>

      {byGroup.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="text-ink-soft">{t('noMatch', { query: q })}</p>
          <button onClick={() => { setQ(''); setGroup('all'); }} className="link mt-2 text-sm font-semibold">
            {t('reset')}
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {byGroup.map(({ g, items }) => (
            <section key={g.key} id={g.key}>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-4 w-1.5 rounded-full" style={{ background: g.hue }} />
                <h2 className="font-display text-xl font-bold text-ink">{ja ? g.nameJa : g.name}</h2>
                {!ja && <span className="font-jp text-sm text-meta">{g.nameJa}</span>}
                <span className="tnum ml-auto text-sm text-meta">{t('categoriesCount', { count: items.length })}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/category/${c.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-md border border-rule bg-panel p-3.5 transition-colors hover:border-[#c9c8bf]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-ink group-hover:text-indigo">{c.name}</span>
                        <span className="truncate font-jp text-xs text-meta">{c.nameJa}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-meta">{c.blurb}</p>
                    </div>
                    <span
                      className="tnum shrink-0 rounded-sm px-1.5 py-0.5 text-xs font-semibold"
                      style={{ color: g.hue, background: `${g.hue}14` }}
                    >
                      {(c.count / 1000).toFixed(1)}k
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
