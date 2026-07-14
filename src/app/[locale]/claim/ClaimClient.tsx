'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SignInCard } from '@/components/account/SignInCard';
import { GROUP_BY_KEY } from '@/lib/categories';
import { Monogram } from '@/components/ui/Monogram';
import { VerifiedBadge } from '@/components/ui/Badges';

type Method = 'email' | 'phone' | 'docs';

interface Result {
  id: number; slug: string; name: string; nameJa: string; address: string;
  verify: 'none' | 'community' | 'admin'; claimed: boolean; city: string; category: string; group: string;
}

export function ClaimClient() {
  const params = useSearchParams();
  const { data: session, status: authStatus, update: refreshSession } = useSession();
  const preId = Number(params.get('id'));
  const t = useTranslations('claim');
  const tc = useTranslations('common');

  const METHODS: { id: Method; label: string; desc: string; icon: string }[] = [
    { id: 'email', label: t('methodEmailLabel'), desc: t('methodEmailDesc'), icon: '✉︎' },
    { id: 'phone', label: t('methodPhoneLabel'), desc: t('methodPhoneDesc'), icon: '☎' },
    { id: 'docs', label: t('methodDocsLabel'), desc: t('methodDocsDesc'), icon: '🏛' },
  ];

  const [business, setBusiness] = useState<Result | null>(null);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [method, setMethod] = useState<Method>('email');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<Result[]>([]);

  // Preload from ?id= (e.g. the "Claim this listing" link on a company page).
  useEffect(() => {
    if (!preId) return;
    (async () => {
      const res = await fetch(`/api/businesses/${preId}`);
      if (!res.ok) return;
      const b = (await res.json()) as Result;
      if (!b.claimed) { setBusiness(b); setStep(1); }
    })();
  }, [preId]);

  // Debounced live search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setMatches([]); return; }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/businesses/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setMatches((await res.json()).results as Result[]);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  function pick(b: Result) {
    setBusiness(b);
    setStep(1);
    setError('');
  }

  async function startVerification() {
    if (!business) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: business.id, method }),
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; queued?: boolean; error?: string } | null;
    setBusy(false);
    if (!res.ok || !data?.ok) { setError(data?.error ?? t('couldNotStart')); return; }
    setStep(2);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!business) return;
    if (!/^\d{6}$/.test(code.trim())) { setError(t('enterCodeHint')); return; }
    setBusy(true);
    setError('');
    const res = await fetch('/api/claim', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: business.id, code: code.trim() }),
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    setBusy(false);
    if (!res.ok || !data?.ok) { setError(data?.error ?? t('verificationFailed')); return; }
    await refreshSession(); // pick up USER -> OWNER role promotion immediately
    setStep(3);
  }

  if (authStatus === 'loading') {
    return <div className="shell py-16"><div className="skeleton mx-auto h-64 max-w-xl rounded-md" /></div>;
  }

  if (!session?.user) {
    return (
      <div className="shell py-8">
        <Breadcrumbs items={[{ href: '/', label: tc('home') }, { label: t('crumb') }]} />
        <div className="mt-8">
          <SignInCard heading={t('signInHeading')} intro={t('signInIntro')} defaultRole="owner" />
        </div>
      </div>
    );
  }

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: tc('home') }, { label: t('crumb') }]} />
      <div className="mx-auto mt-4 max-w-xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
        <p className="mt-2 text-ink-soft">{t('subtitle')}</p>

        {step === 0 && (
          <div className="panel mt-6 p-5">
            <label className="mb-1 block text-sm font-medium text-ink">{t('findBusiness')}</label>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('searchPlaceholder')} className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" autoFocus />
            <ul className="mt-2 divide-y divide-rule">
              {matches.map((b) => (
                <li key={b.id}>
                  <button onClick={() => pick(b)} disabled={b.claimed} className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-[#f6f5f0] disabled:cursor-not-allowed disabled:opacity-50">
                    <Monogram name={b.name} hue={GROUP_BY_KEY[b.group as keyof typeof GROUP_BY_KEY]?.hue ?? '#8A8B85'} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{b.name}</span>
                      <span className="block truncate text-xs text-meta">{b.category} · {b.city}{b.claimed ? t('alreadyClaimed') : ''}</span>
                    </span>
                  </button>
                </li>
              ))}
              {query.trim().length >= 2 && matches.length === 0 && (
                <li className="py-3 text-sm text-meta">{t('noMatch')} <Link href="/get-listed" className="link">{t('createNewListing')}</Link> {t('instead')}</li>
              )}
            </ul>
          </div>
        )}

        {step === 1 && business && (
          <div className="mt-6 space-y-4">
            <div className="panel flex items-center gap-3 p-4">
              <Monogram name={business.name} hue={GROUP_BY_KEY[business.group as keyof typeof GROUP_BY_KEY]?.hue ?? '#8A8B85'} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-ink">{business.name}</p>
                <p className="truncate text-xs text-meta">{business.address}</p>
              </div>
              <VerifiedBadge tier={business.verify} />
              <button onClick={() => { setBusiness(null); setStep(0); setError(''); }} className="text-xs font-medium text-indigo hover:underline">{t('change')}</button>
            </div>

            <div className="panel p-5">
              <p className="eyebrow mb-3">{t('chooseMethod')}</p>
              <div className="space-y-2">
                {METHODS.map((m) => (
                  <button key={m.id} onClick={() => setMethod(m.id)} className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors ${method === m.id ? 'border-seal ring-1 ring-seal/25' : 'border-rule hover:border-[#c9c8bf]'}`}>
                    <span aria-hidden className="text-lg">{m.icon}</span>
                    <span>
                      <span className="block font-medium text-ink">{m.label}</span>
                      <span className="block text-sm text-meta">{m.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
              {error && <p className="mt-3 text-sm text-seal">{error}</p>}
              <button onClick={startVerification} disabled={busy} className="btn btn-primary mt-4 w-full disabled:opacity-60">{busy ? t('sending') : t('sendVerification')}</button>
            </div>
          </div>
        )}

        {step === 2 && business && (
          method === 'docs' ? (
            <div className="panel mt-6 p-5">
              <h2 className="font-display font-bold text-ink">{t('docsSubmittedTitle')}</h2>
              <p className="mt-1 text-sm text-ink-soft">{t('docsSubmittedBody')}</p>
              <Link href="/account" className="btn btn-primary mt-4 w-full">{t('done')}</Link>
            </div>
          ) : (
            <form onSubmit={verify} className="panel mt-6 p-5">
              <h2 className="font-display font-bold text-ink">{t('enterCodeTitle')}</h2>
              <p className="mt-1 text-sm text-ink-soft">
                {method === 'email' ? t('enterCodeEmail') : t('enterCodePhone')}
              </p>
              <input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" className="tnum mt-4 w-full rounded-md border border-rule bg-panel px-3 py-3 text-center font-mono text-2xl tracking-[0.4em] focus:outline-none focus-visible:border-indigo" autoFocus />
              {error && <p className="mt-2 text-sm text-seal">{error}</p>}
              <p className="mt-2 text-xs text-meta">{method === 'phone' ? t('demoHint') : t('emailRealHint')}</p>
              <button type="submit" disabled={busy} className="btn btn-primary mt-4 w-full disabled:opacity-60">{busy ? t('verifying') : t('verifyAndClaim')}</button>
            </form>
          )
        )}

        {step === 3 && business && (
          <div className="panel mt-6 p-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok/10">
              <svg viewBox="0 0 24 24" width="30" height="30" className="text-ok" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h2 className="mt-4 font-display text-xl font-extrabold text-ink">{t('claimedTitle')}</h2>
            <p className="mt-1 text-ink-soft">{t('claimedBody', { name: business.name })}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href="/dashboard" className="btn btn-primary">{t('goToDashboard')}</Link>
              <Link href={`/company/${business.id}/${business.slug}`} className="btn btn-secondary">{t('viewListing')}</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
