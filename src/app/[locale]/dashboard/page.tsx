'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SignInCard } from '@/components/account/SignInCard';
import { useAuth } from '@/lib/useAuth';
import { PLAN_LIMITS, LISTING_PLANS } from '@/lib/plans';
import { shortDate, usd, yen } from '@/lib/format';
import { Stars } from '@/components/ui/Stars';

// ---------------------------------------------------------------------------
// Owner dashboard — reads and writes the real listing via /api/owner/*.
// Weekly analytics stay illustrative (no page-view tracking pipeline exists
// yet) but everything else — listing fields, review replies, plan usage,
// the lead inbox — is live database state.
// ---------------------------------------------------------------------------

interface OwnedReview {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  status: string;
  createdAt: string;
  ownerReply: { text: string; createdAt: string } | null;
}
interface OwnedBusiness {
  id: number; slug: string; name: string; nameJa: string; blurb: string;
  phone: string; website: string; email: string; address: string; employees: number;
  plan: 'basic' | 'premium' | 'lifetime' | 'none';
  status: string; city: string; category: string;
  categoryCount: number; keywordCount: number;
  photos: { url: string; alt: string }[];
  productCount: number; jobCount: number;
  reviews: OwnedReview[];
}

type Tab = 'overview' | 'listing' | 'media' | 'reviews' | 'plan';

function useOwnedBusiness() {
  const [business, setBusiness] = useState<OwnedBusiness | null | undefined>(undefined); // undefined = loading
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    const res = await fetch('/api/owner/business');
    if (res.status === 404) { setBusiness(null); return; }
    if (!res.ok) { setError('load-error'); return; }
    const data = (await res.json()) as { business: OwnedBusiness };
    setBusiness(data.business);
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  return { business, error, refetch };
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  const { user, ready, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const { business, error, refetch } = useOwnedBusiness();

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: t('tabs.overview') },
    { id: 'listing', label: t('tabs.listing') },
    { id: 'media', label: t('tabs.media') },
    { id: 'reviews', label: t('tabs.reviews') },
    { id: 'plan', label: t('tabs.plan') },
  ];

  if (!ready) return <div className="shell py-16"><div className="skeleton mx-auto h-64 max-w-md rounded-md" /></div>;
  if (!user) return (
    <div className="shell py-12">
      <Breadcrumbs items={[{ href: '/', label: tc('home') }, { label: t('crumb') }]} />
      <div className="mt-8"><SignInCard heading={t('signInHeading')} intro={t('signInIntro')} defaultRole="owner" /></div>
    </div>
  );

  if (business === undefined) {
    return <div className="shell py-16 space-y-3"><div className="skeleton h-10 w-64 rounded-md" /><div className="skeleton h-40 rounded-md" /></div>;
  }

  if (business === null) {
    return (
      <div className="shell py-12">
        <Breadcrumbs items={[{ href: '/', label: tc('home') }, { label: t('crumb') }]} />
        <div className="panel mx-auto mt-8 max-w-md p-6 text-center">
          <h1 className="font-display text-xl font-bold text-ink">{t('noListingTitle')}</h1>
          <p className="mt-1 text-ink-soft">{error ? t('loadError') : t('noListingBody')}</p>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/get-listed" className="btn btn-primary">{t('createListing')}</Link>
            <Link href="/claim" className="btn btn-secondary">{t('claimListing')}</Link>
            <button onClick={signOut} className="btn btn-ghost mt-1">{tc('signOut')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: tc('home') }, { label: t('crumb') }]} />
      <header className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-5">
        <div>
          <p className="eyebrow">{t('crumb')}</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{business.name}</h1>
          <p className="text-sm text-meta">{business.category} · {business.city} · <span className="capitalize">{business.plan}</span> {t('planSuffix')}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/company/${business.id}/${business.slug}`} className="btn btn-secondary">{t('viewPublicPage')}</Link>
          <button onClick={signOut} className="btn btn-ghost">{tc('signOut')}</button>
        </div>
      </header>

      {business.status === 'IN_REVIEW' && (
        <p className="mt-4 rounded-sm bg-warn/15 px-3 py-2 text-sm text-warn">{t('inReviewNotice')}</p>
      )}

      <nav className="mt-5 flex flex-wrap gap-1 border-b border-rule" aria-label="Dashboard sections">
        {TABS.map((tItem) => (
          <button key={tItem.id} onClick={() => setTab(tItem.id)} aria-current={tab === tItem.id}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${tab === tItem.id ? 'border-seal text-ink' : 'border-transparent text-meta hover:text-ink'}`}>
            {tItem.label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === 'overview' && <Overview business={business} />}
        {tab === 'listing' && <ListingEditor business={business} onSaved={refetch} />}
        {tab === 'media' && <MediaTab business={business} />}
        {tab === 'reviews' && <ReviewsTab business={business} onReplied={refetch} />}
        {tab === 'plan' && <PlanTab business={business} />}
      </div>
    </div>
  );
}

// ---- Analytics (illustrative — no tracking pipeline yet) -------------------
function useWeeklyData(seedId: number) {
  return useMemo(() => {
    let seed = seedId;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    return Array.from({ length: 8 }, (_, i) => {
      const base = 60 + i * 6;
      const views = Math.round(base + rnd() * 40);
      return {
        week: `W${i + 1}`,
        impressions: Math.round(views * (6 + rnd() * 3)),
        views,
        calls: Math.round(views * (0.08 + rnd() * 0.06)),
        clicks: Math.round(views * (0.12 + rnd() * 0.08)),
      };
    });
  }, [seedId]);
}

interface Lead { id: string; name: string; email: string; message: string; createdAt: string }

function Overview({ business }: { business: OwnedBusiness }) {
  const t = useTranslations('dashboard');
  const data = useWeeklyData(business.id);
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const totals = {
    impressions: data.reduce((a, d) => a + d.impressions, 0),
    views: data.reduce((a, d) => a + d.views, 0),
    calls: data.reduce((a, d) => a + d.calls, 0),
    clicks: data.reduce((a, d) => a + d.clicks, 0),
  };
  const delta = (a: number, b: number) => (b === 0 ? 0 : Math.round(((a - b) / b) * 100));
  const max = Math.max(...data.map((d) => d.views));

  const cards = [
    { label: t('overview.cardViews'), value: totals.views, d: delta(last.views, prev.views) },
    { label: t('overview.cardImpressions'), value: totals.impressions, d: delta(last.impressions, prev.impressions) },
    { label: t('overview.cardClicks'), value: totals.clicks, d: delta(last.clicks, prev.clicks) },
    { label: t('overview.cardCalls'), value: totals.calls, d: delta(last.calls, prev.calls) },
  ];

  const [leads, setLeads] = useState<Lead[] | null>(null);
  useEffect(() => {
    fetch('/api/leads').then((r) => r.ok ? r.json() : { leads: [] }).then((d: { leads: Lead[] }) => setLeads(d.leads)).catch(() => setLeads([]));
  }, []);

  return (
    <div className="space-y-6">
      <p className="text-xs text-meta">{t('overview.illustrativeNotice')}</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="panel p-4">
            <p className="text-sm text-meta">{c.label}</p>
            <p className="tnum mt-1 font-mono text-2xl font-semibold text-ink">{c.value.toLocaleString('en-US')}</p>
            <p className={`tnum mt-0.5 text-xs font-semibold ${c.d >= 0 ? 'text-ok' : 'text-seal'}`}>{c.d >= 0 ? '▲' : '▼'} {Math.abs(c.d)}% {t('overview.vsLastWeek')}</p>
          </div>
        ))}
      </div>

      <div className="panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display font-bold text-ink">{t('overview.chartTitle')}</h2>
          <span className="text-xs text-meta">{t('overview.updated', { date: shortDate(new Date().toISOString()) })}</span>
        </div>
        <div className="flex h-44 items-end gap-2">
          {data.map((d) => (
            <div key={d.week} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <div className="relative flex w-full flex-1 items-end justify-center">
                <span className="tnum absolute -top-5 text-2xs font-semibold text-ink opacity-0 transition-opacity group-hover:opacity-100">{d.views}</span>
                <div className="w-full max-w-[36px] rounded-t bg-indigo transition-colors group-hover:bg-indigo-soft" style={{ height: `${Math.max(4, (d.views / max) * 150)}px` }} />
              </div>
              <span className="text-2xs text-meta">{d.week}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-5">
        <h2 className="mb-2 font-display font-bold text-ink">{t('overview.recentLeads')}</h2>
        <p className="text-sm text-meta">{t('overview.leadsIntro')}</p>
        {leads === null ? (
          <div className="mt-3 space-y-2">{[0, 1].map((i) => <div key={i} className="skeleton h-10 rounded-md" />)}</div>
        ) : leads.length === 0 ? (
          <p className="mt-3 text-sm text-meta">{t('overview.noLeads')}</p>
        ) : (
          <ul className="mt-3 divide-y divide-rule text-sm">
            {leads.map((l) => (
              <li key={l.id} className="py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-ink">{l.name}</span>
                  <span className="shrink-0 text-xs text-meta">{shortDate(l.createdAt)}</span>
                </div>
                <p className="text-ink-soft">{l.message}</p>
                <a href={`mailto:${l.email}`} className="link text-xs">{l.email}</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---- Listing editor --------------------------------------------------------
function ListingEditor({ business, onSaved }: { business: OwnedBusiness; onSaved: () => void }) {
  const t = useTranslations('dashboard');
  const [form, setForm] = useState({
    blurb: business.blurb, phone: business.phone, website: business.website, email: business.email,
    address: business.address, employees: String(business.employees),
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch('/api/owner/business', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const d = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(d?.error ?? t('listing.saveError'));
      return;
    }
    setSaved(true);
    onSaved();
    setTimeout(() => setSaved(false), 2000);
  }
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const fields: [keyof typeof form, string][] = [
    ['phone', t('listing.fieldPhone')],
    ['website', t('listing.fieldWebsite')],
    ['email', t('listing.fieldEmail')],
    ['address', t('listing.fieldAddress')],
    ['employees', t('listing.fieldEmployees')],
  ];
  return (
    <form onSubmit={save} className="panel max-w-2xl space-y-4 p-5">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">{t('listing.description')}</span>
        <textarea value={form.blurb} onChange={(e) => set('blurb')(e.target.value)} rows={3} className="w-full rounded-md border border-rule bg-panel p-3 text-sm focus:outline-none focus-visible:border-indigo" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(([k, label]) => (
          <label key={k} className="block">
            <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
            <input value={form[k]} onChange={(e) => set(k)(e.target.value)} className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" />
          </label>
        ))}
      </div>
      {error && <p className="rounded-sm bg-seal-wash px-3 py-2 text-sm text-seal-ink" role="alert">{error}</p>}
      <div className="flex items-center gap-3 border-t border-rule pt-4">
        <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-60">{saving ? t('listing.saving') : t('listing.saveChanges')}</button>
        {saved && <span className="text-sm font-medium text-ok">{t('listing.saved')}</span>}
      </div>
    </form>
  );
}

// ---- Media (photos/products/jobs) ------------------------------------------
function MediaTab({ business }: { business: OwnedBusiness }) {
  const t = useTranslations('dashboard');
  const lim = PLAN_LIMITS[business.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.basic;
  const usage = [
    { label: t('media.usagePhotos'), used: business.photos.length, limit: lim.photos },
    { label: t('media.usageProducts'), used: business.productCount, limit: lim.products },
    { label: t('media.usageJobs'), used: business.jobCount, limit: lim.jobs },
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {usage.map((u) => (
          <div key={u.label} className="panel p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink">{u.label}</span>
              <span className="tnum text-xs text-meta">{u.used} / {u.limit}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ecebe4]">
              <div className="h-full rounded-full bg-indigo" style={{ width: `${Math.min(100, (u.used / u.limit) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="panel p-5">
        <h2 className="mb-3 font-display font-bold text-ink">{t('media.usagePhotos')}</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {business.photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p.url} alt={p.alt} className="aspect-square w-full rounded-md border border-rule object-cover" />
          ))}
          <button disabled title={t('media.uploadDisabledTitle')} className="grid aspect-square cursor-not-allowed place-items-center rounded-md border border-dashed border-rule text-2xl text-meta opacity-50">+</button>
        </div>
        <p className="mt-3 text-xs text-meta">{t('media.uploadNotice')}</p>
      </div>
    </div>
  );
}

// ---- Reviews (respond) -----------------------------------------------------
function ReviewsTab({ business, onReplied }: { business: OwnedBusiness; onReplied: () => void }) {
  const t = useTranslations('dashboard');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function saveReply(reviewId: string) {
    const text = (drafts[reviewId] || '').trim();
    if (!text) return;
    setBusyId(reviewId);
    setError('');
    const res = await fetch('/api/owner/replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, text }),
    });
    setBusyId(null);
    if (!res.ok) {
      const d = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(d?.error ?? t('reviews.replyError'));
      return;
    }
    setDrafts((d) => ({ ...d, [reviewId]: '' }));
    onReplied();
  }

  const visible = business.reviews.filter((r) => r.status !== 'REJECTED');

  return (
    <div className="space-y-3">
      {error && <p className="rounded-sm bg-seal-wash px-3 py-2 text-sm text-seal-ink" role="alert">{error}</p>}
      {visible.length === 0 && <div className="panel p-8 text-center text-ink-soft">{t('reviews.noReviews')}</div>}
      {visible.map((r) => (
        <div key={r.id} className="panel p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-ink">{r.authorName}</span>
            <div className="flex items-center gap-2">
              {r.status === 'PENDING' && <span className="rounded-sm bg-warn/15 px-1.5 py-0.5 text-2xs font-semibold uppercase text-warn">{t('reviews.pendingModeration')}</span>}
              <Stars rating={r.rating} showValue={false} />
            </div>
          </div>
          <p className="mt-1 text-sm text-ink-soft">{r.text}</p>
          {r.ownerReply ? (
            <div className="mt-3 rounded-md border-l-2 border-indigo bg-indigo-wash/50 p-3">
              <p className="text-xs font-semibold text-indigo">{t('reviews.yourResponse')}</p>
              <p className="mt-1 text-sm text-ink-soft">{r.ownerReply.text}</p>
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <input
                value={drafts[r.id] || ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                placeholder={t('reviews.replyPlaceholder')}
                className="flex-1 rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo"
              />
              <button onClick={() => saveReply(r.id)} disabled={busyId === r.id} className="btn btn-secondary disabled:opacity-60">
                {busyId === r.id ? t('reviews.posting') : t('reviews.reply')}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---- Plan & billing --------------------------------------------------------
function PlanTab({ business }: { business: OwnedBusiness }) {
  const t = useTranslations('dashboard');
  const plan = LISTING_PLANS.find((p) => p.id === business.plan) ?? LISTING_PLANS[0];
  const lim = PLAN_LIMITS[business.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.basic;
  const rows: [string, number, number][] = [
    [t('plan.labelCategories'), business.categoryCount, lim.categories],
    [t('plan.labelKeywords'), business.keywordCount, lim.keywords],
    [t('plan.labelPhotos'), business.photos.length, lim.photos],
    [t('plan.labelProducts'), business.productCount, lim.products],
    [t('plan.labelJobs'), business.jobCount, lim.jobs],
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="panel p-5">
        <h2 className="font-display font-bold text-ink">{t('plan.usageHeading')}</h2>
        <ul className="mt-3 space-y-3">
          {rows.map(([label, used, limit]) => (
            <li key={label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-ink-soft">{label}</span>
                <span className="tnum text-meta">{used} / {limit}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#ecebe4]">
                <div className="h-full rounded-full bg-indigo" style={{ width: `${Math.min(100, (used / limit) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="panel p-5">
        <p className="eyebrow mb-2">{t('plan.currentPlan')}</p>
        <div className="flex items-baseline justify-between">
          <span className="font-display text-lg font-bold text-ink">{plan.name}</span>
          <span className="tnum font-display text-xl font-extrabold text-ink">{usd(plan.price)}</span>
        </div>
        <p className="text-xs text-meta">{plan.cadence}</p>
        <div className="mt-4 grid gap-2">
          <Link href="/get-listed?plan=lifetime" className="btn btn-primary">{t('plan.upgrade')}</Link>
          <button disabled title={t('plan.manageBillingDisabledTitle')} className="btn btn-secondary cursor-not-allowed opacity-50">{t('plan.manageBilling')}</button>
        </div>
        <p className="mt-3 text-2xs text-meta">{t('plan.nextInvoice', { amount: yen(plan.price * 150) })}</p>
      </div>
    </div>
  );
}
