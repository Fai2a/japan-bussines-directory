'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'listing', label: 'Edit listing' },
  { id: 'media', label: 'Photos, products & jobs' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'plan', label: 'Plan & billing' },
];

function useOwnedBusiness() {
  const [business, setBusiness] = useState<OwnedBusiness | null | undefined>(undefined); // undefined = loading
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    const res = await fetch('/api/owner/business');
    if (res.status === 404) { setBusiness(null); return; }
    if (!res.ok) { setError('Could not load your listing.'); return; }
    const data = (await res.json()) as { business: OwnedBusiness };
    setBusiness(data.business);
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  return { business, error, refetch };
}

export default function DashboardPage() {
  const { user, ready, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const { business, error, refetch } = useOwnedBusiness();

  if (!ready) return <div className="shell py-16"><div className="skeleton mx-auto h-64 max-w-md rounded-md" /></div>;
  if (!user) return (
    <div className="shell py-12">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Owner dashboard' }]} />
      <div className="mt-8"><SignInCard heading="Owner sign-in" intro="Manage your listing, reviews and analytics." defaultRole="owner" /></div>
    </div>
  );

  if (business === undefined) {
    return <div className="shell py-16 space-y-3"><div className="skeleton h-10 w-64 rounded-md" /><div className="skeleton h-40 rounded-md" /></div>;
  }

  if (business === null) {
    return (
      <div className="shell py-12">
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Owner dashboard' }]} />
        <div className="panel mx-auto mt-8 max-w-md p-6 text-center">
          <h1 className="font-display text-xl font-bold text-ink">No listing linked yet</h1>
          <p className="mt-1 text-ink-soft">{error || 'This account isn’t connected to a business listing.'}</p>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/get-listed" className="btn btn-primary">Create a new listing</Link>
            <Link href="/claim" className="btn btn-secondary">Claim an existing listing</Link>
            <button onClick={signOut} className="btn btn-ghost mt-1">Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Owner dashboard' }]} />
      <header className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-5">
        <div>
          <p className="eyebrow">Owner dashboard</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{business.name}</h1>
          <p className="text-sm text-meta">{business.category} · {business.city} · <span className="capitalize">{business.plan}</span> plan</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/company/${business.id}/${business.slug}`} className="btn btn-secondary">View public page</Link>
          <button onClick={signOut} className="btn btn-ghost">Sign out</button>
        </div>
      </header>

      {business.status === 'IN_REVIEW' && (
        <p className="mt-4 rounded-sm bg-warn/15 px-3 py-2 text-sm text-warn">
          Your listing is awaiting admin review — it isn’t visible in search yet. You can keep editing while you wait.
        </p>
      )}

      <nav className="mt-5 flex flex-wrap gap-1 border-b border-rule" aria-label="Dashboard sections">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${tab === t.id ? 'border-seal text-ink' : 'border-transparent text-meta hover:text-ink'}`}>
            {t.label}
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
    { label: 'Profile views', value: totals.views, d: delta(last.views, prev.views) },
    { label: 'Search impressions', value: totals.impressions, d: delta(last.impressions, prev.impressions) },
    { label: 'Website clicks', value: totals.clicks, d: delta(last.clicks, prev.clicks) },
    { label: 'Click-to-call', value: totals.calls, d: delta(last.calls, prev.calls) },
  ];

  const [leads, setLeads] = useState<Lead[] | null>(null);
  useEffect(() => {
    fetch('/api/leads').then((r) => r.ok ? r.json() : { leads: [] }).then((d: { leads: Lead[] }) => setLeads(d.leads)).catch(() => setLeads([]));
  }, []);

  return (
    <div className="space-y-6">
      <p className="text-xs text-meta">Traffic charts below are illustrative — full analytics tracking isn’t wired up yet. The lead inbox is real.</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="panel p-4">
            <p className="text-sm text-meta">{c.label}</p>
            <p className="tnum mt-1 font-mono text-2xl font-semibold text-ink">{c.value.toLocaleString('en-US')}</p>
            <p className={`tnum mt-0.5 text-xs font-semibold ${c.d >= 0 ? 'text-ok' : 'text-seal'}`}>{c.d >= 0 ? '▲' : '▼'} {Math.abs(c.d)}% vs last week</p>
          </div>
        ))}
      </div>

      <div className="panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display font-bold text-ink">Profile views · last 8 weeks</h2>
          <span className="text-xs text-meta">Updated {shortDate(new Date().toISOString())}</span>
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
        <h2 className="mb-2 font-display font-bold text-ink">Recent leads</h2>
        <p className="text-sm text-meta">Quote requests from your public listing land here.</p>
        {leads === null ? (
          <div className="mt-3 space-y-2">{[0, 1].map((i) => <div key={i} className="skeleton h-10 rounded-md" />)}</div>
        ) : leads.length === 0 ? (
          <p className="mt-3 text-sm text-meta">No leads yet.</p>
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
      setError(d?.error ?? 'Could not save changes.');
      return;
    }
    setSaved(true);
    onSaved();
    setTimeout(() => setSaved(false), 2000);
  }
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <form onSubmit={save} className="panel max-w-2xl space-y-4 p-5">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Description</span>
        <textarea value={form.blurb} onChange={(e) => set('blurb')(e.target.value)} rows={3} className="w-full rounded-md border border-rule bg-panel p-3 text-sm focus:outline-none focus-visible:border-indigo" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        {([['phone', 'Phone'], ['website', 'Website'], ['email', 'Email'], ['address', 'Address'], ['employees', 'Employees']] as [keyof typeof form, string][]).map(([k, label]) => (
          <label key={k} className="block">
            <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
            <input value={form[k]} onChange={(e) => set(k)(e.target.value)} className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" />
          </label>
        ))}
      </div>
      {error && <p className="rounded-sm bg-seal-wash px-3 py-2 text-sm text-seal-ink" role="alert">{error}</p>}
      <div className="flex items-center gap-3 border-t border-rule pt-4">
        <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
        {saved && <span className="text-sm font-medium text-ok">✓ Saved</span>}
      </div>
    </form>
  );
}

// ---- Media (photos/products/jobs) ------------------------------------------
function MediaTab({ business }: { business: OwnedBusiness }) {
  const lim = PLAN_LIMITS[business.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.basic;
  const usage = [
    { label: 'Photos', used: business.photos.length, limit: lim.photos },
    { label: 'Products', used: business.productCount, limit: lim.products },
    { label: 'Job offers', used: business.jobCount, limit: lim.jobs },
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
        <h2 className="mb-3 font-display font-bold text-ink">Photos</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {business.photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p.url} alt={p.alt} className="aspect-square w-full rounded-md border border-rule object-cover" />
          ))}
          <button disabled title="Photo uploads need S3 configured (not wired in this build)" className="grid aspect-square cursor-not-allowed place-items-center rounded-md border border-dashed border-rule text-2xl text-meta opacity-50">+</button>
        </div>
        <p className="mt-3 text-xs text-meta">Uploads use secure signed URLs in production (S3) — not yet wired in this build.</p>
      </div>
    </div>
  );
}

// ---- Reviews (respond) -----------------------------------------------------
function ReviewsTab({ business, onReplied }: { business: OwnedBusiness; onReplied: () => void }) {
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
      setError(d?.error ?? 'Could not post the reply.');
      return;
    }
    setDrafts((d) => ({ ...d, [reviewId]: '' }));
    onReplied();
  }

  const visible = business.reviews.filter((r) => r.status !== 'REJECTED');

  return (
    <div className="space-y-3">
      {error && <p className="rounded-sm bg-seal-wash px-3 py-2 text-sm text-seal-ink" role="alert">{error}</p>}
      {visible.length === 0 && <div className="panel p-8 text-center text-ink-soft">No reviews yet.</div>}
      {visible.map((r) => (
        <div key={r.id} className="panel p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-ink">{r.authorName}</span>
            <div className="flex items-center gap-2">
              {r.status === 'PENDING' && <span className="rounded-sm bg-warn/15 px-1.5 py-0.5 text-2xs font-semibold uppercase text-warn">Pending moderation</span>}
              <Stars rating={r.rating} showValue={false} />
            </div>
          </div>
          <p className="mt-1 text-sm text-ink-soft">{r.text}</p>
          {r.ownerReply ? (
            <div className="mt-3 rounded-md border-l-2 border-indigo bg-indigo-wash/50 p-3">
              <p className="text-xs font-semibold text-indigo">Your response</p>
              <p className="mt-1 text-sm text-ink-soft">{r.ownerReply.text}</p>
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <input
                value={drafts[r.id] || ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                placeholder="Write a public reply…"
                className="flex-1 rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo"
              />
              <button onClick={() => saveReply(r.id)} disabled={busyId === r.id} className="btn btn-secondary disabled:opacity-60">
                {busyId === r.id ? 'Posting…' : 'Reply'}
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
  const plan = LISTING_PLANS.find((p) => p.id === business.plan) ?? LISTING_PLANS[0];
  const lim = PLAN_LIMITS[business.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.basic;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="panel p-5">
        <h2 className="font-display font-bold text-ink">Plan usage</h2>
        <ul className="mt-3 space-y-3">
          {([['Category slots', business.categoryCount, lim.categories], ['Keywords', business.keywordCount, lim.keywords], ['Photos', business.photos.length, lim.photos], ['Products', business.productCount, lim.products], ['Job offers', business.jobCount, lim.jobs]] as [string, number, number][]).map(([label, used, limit]) => (
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
        <p className="eyebrow mb-2">Current plan</p>
        <div className="flex items-baseline justify-between">
          <span className="font-display text-lg font-bold text-ink">{plan.name}</span>
          <span className="tnum font-display text-xl font-extrabold text-ink">{usd(plan.price)}</span>
        </div>
        <p className="text-xs text-meta">{plan.cadence}</p>
        <div className="mt-4 grid gap-2">
          <Link href="/get-listed?plan=lifetime" className="btn btn-primary">Upgrade to Lifetime</Link>
          <button disabled title="Stripe customer portal isn’t wired in this build" className="btn btn-secondary cursor-not-allowed opacity-50">Manage billing</button>
        </div>
        <p className="mt-3 text-2xs text-meta">Billing runs through Stripe (test mode). Next invoice: {yen(plan.price * 150)} (approx).</p>
      </div>
    </div>
  );
}
