'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFavorites } from '@/lib/useFavorites';

/** Email is passed pre-split so the full address never appears in static HTML. */
export function ObfuscatedEmail({ user, domain }: { user: string; domain: string }) {
  const [revealed, setRevealed] = useState(false);
  const t = useTranslations('company');
  if (!revealed) {
    return (
      <button onClick={() => setRevealed(true)} className="link text-sm font-medium" aria-label="Reveal email address">
        {t('showEmail')}
      </button>
    );
  }
  return (
    <a className="link break-all text-sm" href={`mailto:${user}@${domain}`}>
      {user}@{domain}
    </a>
  );
}

export function SaveButton({ id }: { id: number; name?: string }) {
  const { has, toggle, ready } = useFavorites();
  const saved = ready && has(id);
  const t = useTranslations('common');
  return (
    <button
      onClick={() => toggle(id)}
      aria-pressed={saved}
      className={`btn ${saved ? 'btn-primary' : 'btn-secondary'}`}
    >
      <svg viewBox="0 0 20 20" width="16" height="16" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M5 3h10v14l-5-3-5 3z" strokeLinejoin="round" />
      </svg>
      {saved ? t('saved') : t('save')}
    </button>
  );
}

export function ShareButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations('common');
  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try { await navigator.share({ title: name, url }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }
  return (
    <button onClick={share} className="btn btn-secondary">
      <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <circle cx="15" cy="5" r="2" /><circle cx="5" cy="10" r="2" /><circle cx="15" cy="15" r="2" />
        <path d="M7 9l6-3M7 11l6 3" />
      </svg>
      {copied ? t('linkCopied') : t('share')}
    </button>
  );
}
