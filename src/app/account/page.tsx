'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SignInCard } from '@/components/account/SignInCard';
import { BusinessCard } from '@/components/ui/BusinessCard';
import { useAuth } from '@/lib/useAuth';
import { useFavorites } from '@/lib/useFavorites';
import { BUSINESS_BY_ID } from '@/lib/businesses';
import { shortDate } from '@/lib/format';

type Tab = 'favorites' | 'reviews' | 'edits' | 'notifications';

interface StoredReview { businessId: number; businessName: string; rating: number; text: string; date: string; status: 'pending' | 'published' }
interface StoredEdit { businessId: number; businessName: string; summary: string; date: string; status: 'pending' | 'applied' }

function readJson<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(key) || '[]') as T[]; } catch { return []; }
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'favorites', label: 'Favorites' },
  { id: 'reviews', label: 'My reviews' },
  { id: 'edits', label: 'Suggested edits' },
  { id: 'notifications', label: 'Notifications' },
];

export default function AccountPage() {
  const { user, ready, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('favorites');

  if (!ready) return <div className="shell py-16"><div className="skeleton mx-auto h-64 max-w-md rounded-md" /></div>;

  if (!user) {
    return (
      <div className="shell py-12">
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Account' }]} />
        <div className="mt-8">
          <SignInCard />
        </div>
      </div>
    );
  }

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Account' }]} />
      <header className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-6">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-indigo text-lg font-bold text-white">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{user.name}</h1>
            <p className="text-sm text-meta">{user.email} · <span className="capitalize">{user.role}</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          {user.role === 'owner' && <Link href="/dashboard" className="btn btn-secondary">Owner dashboard</Link>}
          {user.role === 'admin' && <Link href="/admin" className="btn btn-secondary">Admin panel</Link>}
          <button onClick={signOut} className="btn btn-ghost">Sign out</button>
        </div>
      </header>

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-rule" aria-label="Account sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? 'border-seal text-ink' : 'border-transparent text-meta hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === 'favorites' && <FavoritesTab />}
        {tab === 'reviews' && <ReviewsTab />}
        {tab === 'edits' && <EditsTab />}
        {tab === 'notifications' && <NotificationsTab />}
      </div>
    </div>
  );
}

function EmptyState({ title, body, cta }: { title: string; body: string; cta?: { href: string; label: string } }) {
  return (
    <div className="panel p-10 text-center">
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-ink-soft">{body}</p>
      {cta && <Link href={cta.href} className="btn btn-primary mt-4">{cta.label}</Link>}
    </div>
  );
}

function FavoritesTab() {
  const { ids, ready } = useFavorites();
  if (!ready) return <div className="grid gap-3 sm:grid-cols-2">{[0, 1].map((i) => <div key={i} className="skeleton h-32 rounded-md" />)}</div>;
  const businesses = ids.map((id) => BUSINESS_BY_ID[id]).filter(Boolean);
  if (businesses.length === 0)
    return <EmptyState title="No favorites yet" body="Tap the bookmark on any listing to save it here for quick access — even offline once installed." cta={{ href: '/categories', label: 'Browse the directory' }} />;
  return (
    <div>
      <p className="mb-3 text-sm text-meta">{businesses.length} saved {businesses.length === 1 ? 'business' : 'businesses'}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {businesses.map((b) => <BusinessCard key={b.id} b={b} />)}
      </div>
    </div>
  );
}

function ReviewsTab() {
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  useEffect(() => { setReviews(readJson<StoredReview>('np_my_reviews')); }, []);
  if (reviews.length === 0)
    return <EmptyState title="No reviews yet" body="Reviews you write appear here. Each one is checked by a human before it goes live." cta={{ href: '/categories', label: 'Find a business to review' }} />;
  return (
    <ul className="space-y-3">
      {reviews.map((r, i) => (
        <li key={i} className="panel p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-display font-bold text-ink">{r.businessName}</span>
            <span className={`rounded-sm px-1.5 py-0.5 text-2xs font-semibold uppercase ${r.status === 'published' ? 'bg-ok/10 text-ok' : 'bg-warn/15 text-warn'}`}>{r.status}</span>
          </div>
          <p className="tnum mt-1 text-sm text-seal">{'★'.repeat(r.rating)}<span className="text-rule">{'★'.repeat(5 - r.rating)}</span></p>
          <p className="mt-1 text-sm text-ink-soft">{r.text}</p>
          <p className="mt-1 text-xs text-meta">{shortDate(r.date)}</p>
        </li>
      ))}
    </ul>
  );
}

function EditsTab() {
  const [edits, setEdits] = useState<StoredEdit[]>([]);
  useEffect(() => { setEdits(readJson<StoredEdit>('np_my_edits')); }, []);
  if (edits.length === 0)
    return <EmptyState title="No suggested edits" body="Spotted wrong hours or a changed phone number? Use “Suggest an edit” on any profile — your suggestions show up here." />;
  return (
    <ul className="space-y-3">
      {edits.map((e, i) => (
        <li key={i} className="panel flex items-center justify-between gap-3 p-4">
          <div>
            <p className="font-medium text-ink">{e.businessName}</p>
            <p className="text-sm text-ink-soft">{e.summary}</p>
            <p className="text-xs text-meta">{shortDate(e.date)}</p>
          </div>
          <span className={`rounded-sm px-1.5 py-0.5 text-2xs font-semibold uppercase ${e.status === 'applied' ? 'bg-ok/10 text-ok' : 'bg-warn/15 text-warn'}`}>{e.status}</span>
        </li>
      ))}
    </ul>
  );
}

const PREF_KEY = 'np_notif_prefs';
const PREFS = [
  { id: 'digest', label: 'Weekly digest', help: 'New businesses in your saved cities and categories.' },
  { id: 'replies', label: 'Review replies', help: 'When an owner responds to a review you wrote.' },
  { id: 'answers', label: 'Q&A answers', help: 'When a question you asked gets answered.' },
  { id: 'product', label: 'Product news', help: 'Occasional updates about NihonPages features.' },
];

function NotificationsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ digest: true, replies: true, answers: true, product: false });
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(PREF_KEY); if (raw) setPrefs(JSON.parse(raw)); } catch {}
  }, []);
  function toggle(id: string) {
    const next = { ...prefs, [id]: !prefs[id] };
    setPrefs(next);
    try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }
  return (
    <div className="panel max-w-xl divide-y divide-rule">
      {PREFS.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="font-medium text-ink">{p.label}</p>
            <p className="text-sm text-meta">{p.help}</p>
          </div>
          <button
            role="switch"
            aria-checked={prefs[p.id]}
            onClick={() => toggle(p.id)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${prefs[p.id] ? 'bg-ok' : 'bg-[#d8d7cf]'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${prefs[p.id] ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
      ))}
      {saved && <p className="p-3 text-center text-xs text-ok">Preferences saved</p>}
    </div>
  );
}
