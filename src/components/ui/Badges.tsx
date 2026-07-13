import type { Business, VerifyTier } from '@/lib/types';

export function StatusBadge({ status }: { status: Business['status'] }) {
  if (status === 'active') return null;
  const isNew = status === 'new';
  return (
    <span
      className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wide ${
        isNew ? 'bg-seal-wash text-seal-ink' : 'bg-indigo-wash text-indigo'
      }`}
    >
      {isNew ? 'New' : 'Updated'}
    </span>
  );
}

export function FeaturedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-rule bg-panel px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-ink-soft">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-warn" />
      Featured
    </span>
  );
}

export function SponsoredTag() {
  return (
    <span className="inline-flex items-center rounded-sm border border-rule px-1.5 py-0.5 text-2xs font-medium uppercase tracking-wide text-meta">
      Sponsored
    </span>
  );
}

const VERIFY_COPY: Record<Exclude<VerifyTier, 'none'>, { label: string; tip: string }> = {
  admin: { label: 'Admin verified', tip: 'Ownership documents checked by our team.' },
  community: { label: 'Community verified', tip: 'Confirmed by contributor reports and open data.' },
};

export function VerifiedBadge({ tier, size = 'sm' }: { tier: VerifyTier; size?: 'sm' | 'lg' }) {
  if (tier === 'none') return null;
  const c = VERIFY_COPY[tier];
  const admin = tier === 'admin';
  return (
    <span
      title={c.tip}
      className={`inline-flex items-center gap-1 rounded-sm font-semibold ${
        size === 'lg' ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-2xs'
      } ${admin ? 'bg-ok/10 text-ok' : 'text-indigo'}`}
    >
      <svg viewBox="0 0 20 20" width="13" height="13" aria-hidden fill="currentColor">
        <path d="M10 1l2.4 1.7 2.9-.2 1 2.8 2.4 1.7-1 2.8 1 2.8-2.4 1.7-1 2.8-2.9-.2L10 19l-2.4-1.7-2.9.2-1-2.8L1.3 13l1-2.8-1-2.8 2.4-1.7 1-2.8 2.9.2z" />
        <path d="M8.6 12.3L6.4 10l-.9.9 3.1 3.1 5.3-5.3-.9-.9z" fill="#fff" />
      </svg>
      {c.label}
    </span>
  );
}
