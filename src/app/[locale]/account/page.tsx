'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SignInCard } from '@/components/account/SignInCard';
import { BusinessCard } from '@/components/ui/BusinessCard';
import { useAuth } from '@/lib/useAuth';
import { useFavorites } from '@/lib/useFavorites';
import { BUSINESS_BY_ID } from '@/lib/businesses';
import { shortDate } from '@/lib/format';

type Tab = 'favorites' | 'reviews' | 'edits' | 'notifications';

interface MyReview {
  id: string; businessId: number; businessSlug: string; businessName: string;
  rating: number; text: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; createdAt: string;
  ownerReply: { text: string; createdAt: string } | null;
}
interface MySuggestion {
  id: string; businessId: number; businessSlug: string; businessName: string;
  summary: string; status: string; createdAt: string;
}

export default function AccountPage() {
  const { user, ready, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('favorites');
  const t = useTranslations('account');
  const tc = useTranslations('common');

  const TABS: { id: Tab; label: string }[] = [
    { id: 'favorites', label: t('tabFavorites') },
    { id: 'reviews', label: t('tabReviews') },
    { id: 'edits', label: t('tabEdits') },
    { id: 'notifications', label: t('tabNotifications') },
  ];

  if (!ready) return <div className="shell py-16"><div className="skeleton mx-auto h-64 max-w-md rounded-md" /></div>;

  if (!user) {
    return (
      <div className="shell py-12">
        <Breadcrumbs items={[{ href: '/', label: tc('home') }, { label: t('crumb') }]} />
        <div className="mt-8">
          <SignInCard />
        </div>
      </div>
    );
  }

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: tc('home') }, { label: t('crumb') }]} />
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
          {user.role === 'owner' && <Link href="/dashboard" className="btn btn-secondary">{t('ownerDashboard')}</Link>}
          {user.role === 'admin' && <Link href="/admin" className="btn btn-secondary">{t('adminPanel')}</Link>}
          <button onClick={signOut} className="btn btn-ghost">{tc('signOut')}</button>
        </div>
      </header>

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-rule" aria-label="Account sections">
        {TABS.map((tItem) => (
          <button
            key={tItem.id}
            onClick={() => setTab(tItem.id)}
            aria-current={tab === tItem.id}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === tItem.id ? 'border-seal text-ink' : 'border-transparent text-meta hover:text-ink'
            }`}
          >
            {tItem.label}
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
  const t = useTranslations('account');
  const tc = useTranslations('common');
  if (!ready) return <div className="grid gap-3 sm:grid-cols-2">{[0, 1].map((i) => <div key={i} className="skeleton h-32 rounded-md" />)}</div>;
  const businesses = ids.map((id) => BUSINESS_BY_ID[id]).filter(Boolean);
  if (businesses.length === 0)
    return <EmptyState title={t('noFavoritesTitle')} body={t('noFavoritesBody')} cta={{ href: '/categories', label: tc('browseDirectory') }} />;
  return (
    <div>
      <p className="mb-3 text-sm text-meta">{t('savedCount', { count: businesses.length })}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {businesses.map((b) => <BusinessCard key={b.id} b={b} />)}
      </div>
    </div>
  );
}

function ReviewsTab() {
  const [reviews, setReviews] = useState<MyReview[] | null>(null);
  const t = useTranslations('account');
  useEffect(() => {
    fetch('/api/account/reviews')
      .then((r) => (r.ok ? r.json() : { reviews: [] }))
      .then((d: { reviews: MyReview[] }) => setReviews(d.reviews))
      .catch(() => setReviews([]));
  }, []);
  if (reviews === null) return <div className="space-y-2">{[0, 1].map((i) => <div key={i} className="skeleton h-24 rounded-md" />)}</div>;
  if (reviews.length === 0)
    return <EmptyState title={t('noReviewsTitle')} body={t('noReviewsBody')} cta={{ href: '/categories', label: t('findBusinessToReview') }} />;
  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="panel p-4">
          <div className="flex items-center justify-between gap-3">
            <Link href={`/company/${r.businessId}/${r.businessSlug}`} className="font-display font-bold text-ink hover:text-indigo">{r.businessName}</Link>
            <span className={`rounded-sm px-1.5 py-0.5 text-2xs font-semibold uppercase ${r.status === 'APPROVED' ? 'bg-ok/10 text-ok' : r.status === 'REJECTED' ? 'bg-seal-wash text-seal-ink' : 'bg-warn/15 text-warn'}`}>
              {r.status === 'APPROVED' ? t('statusPublished') : r.status === 'REJECTED' ? t('statusRejected') : t('statusPending')}
            </span>
          </div>
          <p className="tnum mt-1 text-sm text-seal">{'★'.repeat(r.rating)}<span className="text-rule">{'★'.repeat(5 - r.rating)}</span></p>
          <p className="mt-1 text-sm text-ink-soft">{r.text}</p>
          <p className="mt-1 text-xs text-meta">{shortDate(r.createdAt)}</p>
          {r.ownerReply && (
            <div className="mt-3 rounded-md border-l-2 border-indigo bg-indigo-wash/50 p-3">
              <p className="text-xs font-semibold text-indigo">{t('ownerReplyLabel')}</p>
              <p className="mt-1 text-sm text-ink-soft">{r.ownerReply.text}</p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function EditsTab() {
  const [edits, setEdits] = useState<MySuggestion[] | null>(null);
  const t = useTranslations('account');
  useEffect(() => {
    fetch('/api/account/suggestions')
      .then((r) => (r.ok ? r.json() : { suggestions: [] }))
      .then((d: { suggestions: MySuggestion[] }) => setEdits(d.suggestions))
      .catch(() => setEdits([]));
  }, []);
  if (edits === null) return <div className="space-y-2">{[0, 1].map((i) => <div key={i} className="skeleton h-16 rounded-md" />)}</div>;
  if (edits.length === 0)
    return <EmptyState title={t('noEditsTitle')} body={t('noEditsBody')} />;
  return (
    <ul className="space-y-3">
      {edits.map((e) => (
        <li key={e.id} className="panel flex items-center justify-between gap-3 p-4">
          <div>
            <Link href={`/company/${e.businessId}/${e.businessSlug}`} className="font-medium text-ink hover:text-indigo">{e.businessName}</Link>
            <p className="text-sm text-ink-soft">{e.summary}</p>
            <p className="text-xs text-meta">{shortDate(e.createdAt)}</p>
          </div>
          <span className={`rounded-sm px-1.5 py-0.5 text-2xs font-semibold uppercase ${e.status === 'APPLIED' ? 'bg-ok/10 text-ok' : e.status === 'REJECTED' ? 'bg-seal-wash text-seal-ink' : 'bg-warn/15 text-warn'}`}>
            {e.status === 'APPLIED' ? t('statusApplied') : e.status === 'REJECTED' ? t('statusRejected') : t('statusPending')}
          </span>
        </li>
      ))}
    </ul>
  );
}

function NotificationsTab() {
  const t = useTranslations('account');
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ digest: true, replies: true, answers: true, product: false });
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    fetch('/api/account/preferences')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setPrefs(data); })
      .finally(() => setReady(true));
  }, []);

  const PREFS = [
    { id: 'digest', label: t('digestTitle'), help: t('digestHelp') },
    { id: 'replies', label: t('repliesTitle'), help: t('repliesHelp') },
    { id: 'answers', label: t('answersTitle'), help: t('answersHelp') },
    { id: 'product', label: t('productTitle'), help: t('productHelp') },
  ];

  async function toggle(id: string) {
    const value = !prefs[id];
    setPrefs((p) => ({ ...p, [id]: value }));
    try {
      const res = await fetch('/api/account/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, value }),
      });
      if (!res.ok) throw new Error('save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } catch {
      setPrefs((p) => ({ ...p, [id]: !value }));
    }
  }
  return (
    <div className={`panel max-w-xl divide-y divide-rule ${ready ? '' : 'opacity-60'}`}>
      {PREFS.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="font-medium text-ink">{p.label}</p>
            <p className="text-sm text-meta">{p.help}</p>
          </div>
          <button
            role="switch"
            aria-checked={prefs[p.id]}
            disabled={!ready}
            onClick={() => toggle(p.id)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${prefs[p.id] ? 'bg-ok' : 'bg-[#d8d7cf]'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${prefs[p.id] ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
      ))}
      {saved && <p className="p-3 text-center text-xs text-ok">{t('preferencesSaved')}</p>}
    </div>
  );
}
