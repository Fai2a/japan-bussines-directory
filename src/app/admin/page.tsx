'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SignInCard } from '@/components/account/SignInCard';
import { useAuth } from '@/lib/useAuth';
import { shortDate, usd } from '@/lib/format';
import { Monogram } from '@/components/ui/Monogram';
import { Stars } from '@/components/ui/Stars';

type Tab = 'dashboard' | 'listings' | 'reviews' | 'removals';

export default function AdminPage() {
  const { user, ready, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');

  if (!ready) return <div className="shell py-16"><div className="skeleton mx-auto h-64 max-w-md rounded-md" /></div>;
  if (!user || user.role !== 'admin') {
    return (
      <div className="shell py-12">
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Admin' }]} />
        <div className="mt-8">
          {user && user.role !== 'admin' ? (
            <div className="panel mx-auto max-w-md p-6 text-center">
              <h1 className="font-display text-xl font-bold text-ink">Admins only</h1>
              <p className="mt-1 text-ink-soft">You’re signed in as <span className="font-medium">{user.role}</span>. Sign in with an admin session to continue.</p>
              <button onClick={signOut} className="btn btn-secondary mt-4">Switch account</button>
            </div>
          ) : (
            <SignInCard heading="Admin sign-in" intro="Moderate listings, reviews and removal requests." defaultRole="admin" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Admin' }]} />
      <header className="mt-4 flex items-center justify-between border-b border-rule pb-5">
        <div>
          <p className="eyebrow">Admin panel</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Moderation & operations</h1>
        </div>
        <button onClick={signOut} className="btn btn-ghost">Sign out</button>
      </header>

      <nav className="mt-5 flex flex-wrap gap-1 border-b border-rule" aria-label="Admin sections">
        {(['dashboard', 'listings', 'reviews', 'removals'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} aria-current={tab === t}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium capitalize transition-colors ${tab === t ? 'border-seal text-ink' : 'border-transparent text-meta hover:text-ink'}`}>
            {t}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'listings' && <ListingsQueue />}
        {tab === 'reviews' && <ReviewsQueue />}
        {tab === 'removals' && <RemovalsQueue />}
      </div>
    </div>
  );
}

function Dashboard() {
  const stats = [
    { label: 'Companies', value: '222,410', d: '+312 this week' },
    { label: 'Pending listings', value: '18', d: '4 over 24h' },
    { label: 'Pending reviews', value: '43', d: '12 flagged' },
    { label: 'MRR', value: usd(48920), d: '+6.4% MoM' },
  ];
  const revenue = [21, 24, 23, 28, 31, 30, 34, 38, 41, 44, 46, 49];
  const max = Math.max(...revenue);
  const streams = [
    { label: 'Listing plans', value: 62, color: '#C0392B' },
    { label: 'Data Hub', value: 28, color: '#3B4A6B' },
    { label: 'Featured ads', value: 10, color: '#B5642B' },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="panel p-4">
            <p className="text-sm text-meta">{s.label}</p>
            <p className="tnum mt-1 font-mono text-2xl font-semibold text-ink">{s.value}</p>
            <p className="text-xs text-ok">{s.d}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="panel p-5">
          <h2 className="mb-4 font-display font-bold text-ink">Revenue · trailing 12 months (¥M)</h2>
          <div className="flex h-40 items-end gap-1.5">
            {revenue.map((v, i) => (
              <div key={i} className="flex-1 rounded-t bg-indigo/85 transition-colors hover:bg-indigo" style={{ height: `${(v / max) * 100}%` }} title={`¥${v}M`} />
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="mb-4 font-display font-bold text-ink">Revenue mix</h2>
          <div className="flex h-4 overflow-hidden rounded-full">
            {streams.map((s) => <div key={s.label} style={{ width: `${s.value}%`, background: s.color }} />)}
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {streams.map((s) => (
              <li key={s.label} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-ink-soft"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.label}</span>
                <span className="tnum font-medium text-ink">{s.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

type Decision = 'pending' | 'approved' | 'rejected';

function DecisionRow({ status, onApprove, onReject, approveLabel = 'Approve', rejectLabel = 'Reject' }: { status: Decision; onApprove: () => void; onReject: () => void; approveLabel?: string; rejectLabel?: string }) {
  if (status !== 'pending')
    return <span className={`rounded-sm px-2 py-1 text-2xs font-bold uppercase ${status === 'approved' ? 'bg-ok/10 text-ok' : 'bg-seal-wash text-seal-ink'}`}>{status}</span>;
  return (
    <div className="flex shrink-0 gap-2">
      <button onClick={onReject} className="btn btn-secondary px-3 py-1.5 text-sm">{rejectLabel}</button>
      <button onClick={onApprove} className="btn btn-primary px-3 py-1.5 text-sm">{approveLabel}</button>
    </div>
  );
}

interface PendingListing {
  id: number; slug: string; name: string; plan: string; city: string; category: string; owner: string | null; createdAt: string;
}

function ListingsQueue() {
  const [listings, setListings] = useState<PendingListing[] | null>(null);
  const [decided, setDecided] = useState<Record<number, Decision>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/listings')
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Failed to load queue.');
        return res.json();
      })
      .then((data: { listings: PendingListing[] }) => setListings(data.listings))
      .catch((e: Error) => setError(e.message));
  }, []);

  async function decide(id: number, action: 'approve' | 'reject') {
    const res = await fetch('/api/admin/listings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    if (res.ok) setDecided((d) => ({ ...d, [id]: action === 'approve' ? 'approved' : 'rejected' }));
  }

  if (error) return <div className="panel p-6 text-sm text-seal-ink">{error}</div>;
  if (!listings) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-md" />)}</div>;

  const pendingCount = listings.filter((l) => !decided[l.id]).length;

  return (
    <div>
      <p className="mb-3 text-sm text-meta">{pendingCount} listing{pendingCount === 1 ? '' : 's'} awaiting review · approve to publish, reject to suspend.</p>
      {listings.length === 0 && <div className="panel p-8 text-center text-ink-soft">Queue is clear — nothing pending.</div>}
      <div className="space-y-2">
        {listings.map((l) => (
          <div key={l.id} className="panel flex items-center gap-3 p-3">
            <Monogram name={l.name} hue="#8A8B85" size="sm" />
            <div className="min-w-0 flex-1">
              <Link href={`/company/${l.id}/${l.slug}`} className="font-medium text-ink hover:text-indigo">{l.name}</Link>
              <p className="truncate text-xs text-meta">
                {l.category || 'Uncategorized'} · {l.city} · <span className="capitalize">{l.plan}</span> · submitted {shortDate(l.createdAt)}
                {l.owner && <> · by {l.owner}</>}
              </p>
            </div>
            <DecisionRow status={decided[l.id] ?? 'pending'} onApprove={() => decide(l.id, 'approve')} onReject={() => decide(l.id, 'reject')} approveLabel="Publish" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface PendingReview {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  business: { id: number; slug: string; name: string };
}

function ReviewsQueue() {
  const [reviews, setReviews] = useState<PendingReview[] | null>(null);
  const [decided, setDecided] = useState<Record<string, Decision>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/reviews')
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Failed to load queue.');
        return res.json();
      })
      .then((data: { reviews: PendingReview[] }) => setReviews(data.reviews))
      .catch((e: Error) => setError(e.message));
  }, []);

  async function decide(id: string, action: 'approve' | 'reject') {
    const res = await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    if (res.ok) setDecided((d) => ({ ...d, [id]: action === 'approve' ? 'approved' : 'rejected' }));
  }

  if (error) return <div className="panel p-6 text-sm text-seal-ink">{error}</div>;
  if (!reviews) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-md" />)}</div>;

  const pendingCount = reviews.filter((r) => !decided[r.id]).length;

  return (
    <div>
      <p className="mb-3 text-sm text-meta">{pendingCount} review{pendingCount === 1 ? '' : 's'} in the moderation queue · human-approved before publishing. Approvals update the business rating live.</p>
      {reviews.length === 0 && <div className="panel p-8 text-center text-ink-soft">Queue is clear — nothing pending.</div>}
      <div className="space-y-2">
        {reviews.map((r) => (
          <div key={r.id} className="panel p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">{r.authorName}</span>
                  <span className="text-xs text-meta">on</span>
                  <Link href={`/company/${r.business.id}/${r.business.slug}`} className="truncate text-sm text-indigo hover:underline">{r.business.name}</Link>
                  <Stars rating={r.rating} showValue={false} />
                </div>
                <p className="mt-1 text-sm text-ink-soft">{r.text}</p>
              </div>
              <DecisionRow status={decided[r.id] ?? 'pending'} onApprove={() => decide(r.id, 'approve')} onReject={() => decide(r.id, 'reject')} approveLabel="Publish" rejectLabel="Remove" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PendingRemoval {
  id: string; email: string; reason: string; business: { id: number; slug: string; name: string }; createdAt: string;
}

function RemovalsQueue() {
  const [removals, setRemovals] = useState<PendingRemoval[] | null>(null);
  const [decided, setDecided] = useState<Record<string, Decision>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/removals')
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Failed to load queue.');
        return res.json();
      })
      .then((data: { removals: PendingRemoval[] }) => setRemovals(data.removals))
      .catch((e: Error) => setError(e.message));
  }, []);

  async function decide(id: string, action: 'approve' | 'decline') {
    const res = await fetch('/api/admin/removals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    if (res.ok) setDecided((d) => ({ ...d, [id]: action === 'approve' ? 'approved' : 'rejected' }));
  }

  if (error) return <div className="panel p-6 text-sm text-seal-ink">{error}</div>;
  if (!removals) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-md" />)}</div>;

  const pendingCount = removals.filter((r) => !decided[r.id]).length;

  return (
    <div>
      <p className="mb-3 text-sm text-meta">{pendingCount} removal request{pendingCount === 1 ? '' : 's'} · verify the requester before removing.</p>
      {removals.length === 0 && <div className="panel p-8 text-center text-ink-soft">Queue is clear — nothing pending.</div>}
      <div className="space-y-2">
        {removals.map((r) => (
          <div key={r.id} className="panel flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <Link href={`/company/${r.business.id}/${r.business.slug}`} className="font-medium text-ink hover:text-indigo">{r.business.name}</Link>
              <p className="text-xs text-meta">Reason: {r.reason} · from {r.email}</p>
            </div>
            <DecisionRow status={decided[r.id] ?? 'pending'} onApprove={() => decide(r.id, 'approve')} onReject={() => decide(r.id, 'decline')} approveLabel="Remove" rejectLabel="Decline" />
          </div>
        ))}
      </div>
    </div>
  );
}
