'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Monogram } from '@/components/ui/Monogram';

interface Result {
  id: number; slug: string; name: string; nameJa: string; address: string;
  verify: 'none' | 'community' | 'admin'; claimed: boolean; city: string; category: string; group: string;
}

const REASONS = ['wrong-info', 'closed', 'spam', 'abuse', 'other'] as const;

export function ReportClient() {
  const params = useSearchParams();
  const preId = Number(params.get('id'));
  const t = useTranslations('report');
  const tc = useTranslations('common');

  const [business, setBusiness] = useState<Result | null>(null);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<Result[]>([]);
  const [reason, setReason] = useState<(typeof REASONS)[number]>('wrong-info');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!preId) return;
    (async () => {
      const res = await fetch(`/api/businesses/${preId}`);
      if (res.ok) setBusiness(await res.json());
    })();
  }, [preId]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setMatches([]); return; }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/businesses/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setMatches((await res.json()).results as Result[]);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!business) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: business.id, reason, details, email: email || undefined }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(d?.error ?? t('couldNotSubmit'));
      return;
    }
    setSent(true);
  }

  const reasonLabel = (r: string) =>
    r === 'wrong-info' ? t('reasonWrongInfo')
    : r === 'closed' ? t('reasonClosed')
    : r === 'spam' ? t('reasonSpam')
    : r === 'abuse' ? t('reasonAbuse')
    : t('reasonOther');

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: tc('home') }, { label: t('title') }]} />
      <div className="mx-auto mt-4 max-w-xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-ink-soft">{t('subtitle')}</p>

        {sent && business ? (
          <div className="panel mt-6 p-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok/10">
              <svg viewBox="0 0 24 24" width="30" height="30" className="text-ok" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h2 className="mt-4 font-display text-xl font-extrabold text-ink">{t('sentTitle')}</h2>
            <p className="mt-1 text-ink-soft">{t('sentBody', { name: business.name })}</p>
            <Link href={`/company/${business.id}/${business.slug}`} className="btn btn-primary mt-5">{t('backToListing')}</Link>
          </div>
        ) : !business ? (
          <div className="panel mt-6 p-5">
            <label className="mb-1 block text-sm font-medium text-ink">{t('findBusiness')}</label>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('searchPlaceholder')} className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" autoFocus />
            <ul className="mt-2 divide-y divide-rule">
              {matches.map((b) => (
                <li key={b.id}>
                  <button onClick={() => setBusiness(b)} className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-[#f6f5f0]">
                    <Monogram name={b.name} hue="#8A8B85" size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{b.name}</span>
                      <span className="block truncate text-xs text-meta">{b.category} · {b.city}</span>
                    </span>
                  </button>
                </li>
              ))}
              {query.trim().length >= 2 && matches.length === 0 && (
                <li className="py-3 text-sm text-meta">{t('noMatch')}</li>
              )}
            </ul>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="panel flex items-center gap-3 p-4">
              <Monogram name={business.name} hue="#8A8B85" size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-ink">{business.name}</p>
                <p className="truncate text-xs text-meta">{business.address}</p>
              </div>
              <button type="button" onClick={() => setBusiness(null)} className="text-xs font-medium text-indigo hover:underline">{t('change')}</button>
            </div>

            <div className="panel space-y-4 p-5">
              <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden onChange={() => {}} />
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">{t('reasonLabel')}</label>
                <div className="space-y-2">
                  {REASONS.map((r) => (
                    <button key={r} type="button" onClick={() => setReason(r)} className={`flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors ${reason === r ? 'border-seal ring-1 ring-seal/25' : 'border-rule hover:border-[#c9c8bf]'}`}>
                      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${reason === r ? 'border-seal' : 'border-rule'}`}>
                        {reason === r && <span className="h-2 w-2 rounded-full bg-seal" />}
                      </span>
                      {reasonLabel(r)}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">{t('detailsLabel')}</span>
                <textarea required rows={4} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t('detailsPlaceholder')} className="w-full rounded-md border border-rule bg-panel p-3 text-sm focus:outline-none focus-visible:border-indigo" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">{t('emailLabel')}</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.jp" className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" />
                <span className="mt-1 block text-xs text-meta">{t('emailHint')}</span>
              </label>
              {error && <p className="rounded-sm bg-seal-wash px-3 py-2 text-sm text-seal-ink" role="alert">{error}</p>}
              <button type="submit" disabled={busy || details.trim().length < 10} className="btn btn-primary w-full disabled:opacity-60">{busy ? t('submitting') : t('submit')}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
