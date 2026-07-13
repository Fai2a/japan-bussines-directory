'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';

interface Props {
  categories: string[];
  cities: string[];
  variant?: 'hero' | 'compact';
  defaultQ?: string;
  defaultWhere?: string;
}

function useAutocomplete(pool: string[]) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return pool.filter((p) => p.toLowerCase().includes(q)).slice(0, 6);
  }, [value, pool]);
  return { value, setValue, open, setOpen, active, setActive, matches };
}

export function SearchBar({ categories, cities, variant = 'hero', defaultQ = '', defaultWhere = '' }: Props) {
  const router = useRouter();
  const t = useTranslations('search');
  const what = useAutocomplete(categories);
  const where = useAutocomplete(cities);
  const formRef = useRef<HTMLFormElement>(null);

  // Seed defaults once.
  useMemo(() => {
    if (defaultQ) what.setValue(defaultQ);
    if (defaultWhere) where.setValue(defaultWhere);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (what.value.trim()) params.set('q', what.value.trim());
    if (where.value.trim()) params.set('where', where.value.trim());
    router.push(`/search?${params.toString()}`);
  }

  const hero = variant === 'hero';

  function Field({
    ac,
    name,
    placeholder,
    label,
  }: {
    ac: ReturnType<typeof useAutocomplete>;
    name: string;
    placeholder: string;
    label: string;
  }) {
    return (
      <div className="relative flex-1">
        <label className="sr-only" htmlFor={name}>
          {label}
        </label>
        <input
          id={name}
          name={name}
          autoComplete="off"
          value={ac.value}
          placeholder={placeholder}
          onChange={(e) => {
            ac.setValue(e.target.value);
            ac.setOpen(true);
            ac.setActive(-1);
          }}
          onFocus={() => ac.setOpen(true)}
          onBlur={() => setTimeout(() => ac.setOpen(false), 120)}
          onKeyDown={(e) => {
            if (!ac.matches.length) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              ac.setActive((a) => Math.min(a + 1, ac.matches.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              ac.setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter' && ac.active >= 0) {
              e.preventDefault();
              ac.setValue(ac.matches[ac.active]);
              ac.setOpen(false);
            }
          }}
          className={`w-full border-0 bg-transparent text-ink placeholder:text-meta focus:outline-none ${
            hero ? 'px-4 py-3.5 text-base' : 'px-3 py-2 text-sm'
          }`}
        />
        {ac.open && ac.matches.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-md border border-rule bg-panel shadow-lift">
            {ac.matches.map((m, i) => (
              <li key={m}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    ac.setValue(m);
                    ac.setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                    i === ac.active ? 'bg-indigo-wash text-indigo' : 'hover:bg-[#f6f5f0]'
                  }`}
                >
                  <span className="text-meta">↳</span>
                  {m}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      className={`flex items-stretch overflow-visible ${
        hero
          ? 'flex-col gap-2 rounded-md border border-rule bg-panel p-2 shadow-lift sm:flex-row sm:items-center sm:gap-0 sm:p-1.5'
          : 'gap-0 rounded border border-rule bg-panel'
      }`}
    >
      <Field ac={what} name="q" placeholder={t('whatPlaceholder')} label={t('whatPlaceholder')} />
      <div className={hero ? 'hidden w-px self-stretch bg-rule sm:block' : 'w-px self-stretch bg-rule'} />
      <Field ac={where} name="where" placeholder={t('wherePlaceholder')} label={t('wherePlaceholder')} />
      <button type="submit" className={`btn btn-primary shrink-0 ${hero ? 'sm:ml-1.5' : 'rounded-none'}`}>
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="9" cy="9" r="6" />
          <path d="M14 14l4 4" strokeLinecap="round" />
        </svg>
        {t('searchButton')}
      </button>
    </form>
  );
}
