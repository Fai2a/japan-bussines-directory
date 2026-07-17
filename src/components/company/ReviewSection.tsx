'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Review } from '@/lib/types';
import { Stars } from '@/components/ui/Stars';
import { shortDate } from '@/lib/format';

function Histogram({ rating, count }: { rating: number; count: number }) {
  const t = useTranslations('stars');
  // Derive a plausible distribution from the average when we only have samples.
  const dist = [5, 4, 3, 2, 1].map((star) => {
    const base = Math.max(0, 1 - Math.abs(star - rating) / 2.2);
    return { star, pct: base };
  });
  const sum = dist.reduce((a, d) => a + d.pct, 0) || 1;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="text-center">
        <div className="tnum font-display text-5xl font-extrabold text-ink">{rating.toFixed(1)}</div>
        <Stars rating={rating} showValue={false} />
        <div className="mt-1 text-xs text-meta">{count.toLocaleString('en-US')} {t('reviews')}</div>
      </div>
      <div className="flex-1 space-y-1.5">
        {dist.map((d) => (
          <div key={d.star} className="flex items-center gap-2">
            <span className="tnum w-3 text-xs text-meta">{d.star}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#ecebe4]">
              <div className="h-full rounded-full bg-seal/70" style={{ width: `${(d.pct / sum) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewForm({ onDone, businessId }: { onDone: () => void; businessId: number }) {
  const t = useTranslations('company');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsSignIn, setNeedsSignIn] = useState(false);

  async function submitToApi(): Promise<boolean> {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, rating, text: text.trim() }),
    });
    if (res.status === 401) {
      setError(t('signInToReview'));
      setNeedsSignIn(true);
      return false;
    }
    if (!res.ok) {
      setError(t('somethingWrong'));
      setNeedsSignIn(false);
      return false;
    }
    return true;
  }

  if (sent) {
    return (
      <div className="panel border-ok/40 bg-ok/5 p-4 text-sm">
        <p className="font-semibold text-ok">{t('thanksTitle')}</p>
        <p className="mt-1 text-ink-soft">{t('thanksBody')}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!rating || text.trim().length < 10 || busy) return;
        setError('');
        setBusy(true);
        const ok = await submitToApi();
        setBusy(false);
        if (ok) setSent(true);
      }}
      className="panel space-y-3 p-4"
    >
      {/* Honeypot field for basic spam protection (hidden from real users). */}
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">{t('yourRating')}</label>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              className="text-2xl leading-none"
              style={{ color: (hover || rating) >= n ? '#C0392B' : '#E4E3DB' }}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="rv" className="mb-1 block text-sm font-medium text-ink">{t('yourReview')}</label>
        <textarea
          id="rv"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={t('reviewPlaceholder')}
          className="w-full rounded-md border border-rule bg-panel p-3 text-sm focus:outline-none focus-visible:border-indigo"
        />
        <p className="mt-1 text-xs text-meta">{t('minChars')}</p>
      </div>
      {error && (
        <p className="rounded-sm bg-seal-wash px-3 py-2 text-sm text-seal-ink" role="alert">
          {error}{needsSignIn && <> <a href="/account" className="font-semibold underline">Sign in</a></>}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={!rating || text.trim().length < 10 || busy} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? t('submitting') : t('submitReview')}
        </button>
        <button type="button" onClick={onDone} className="btn btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

export function ReviewSection({ reviews, rating, count, businessId }: { reviews: Review[]; rating: number; count: number; businessId: number }) {
  const [writing, setWriting] = useState(false);
  const t = useTranslations('company');

  return (
    <section id="reviews" className="scroll-mt-24">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-ink">{t('reviews')}</h2>
        <button onClick={() => setWriting((w) => !w)} className="btn btn-secondary">{t('writeReview')}</button>
      </div>

      <div className="panel mb-5 p-5">
        <Histogram rating={rating} count={count} />
      </div>

      {writing && (
        <div className="mb-5">
          <ReviewForm onDone={() => setWriting(false)} businessId={businessId} />
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((r, i) => (
          <article key={i} className="border-b border-rule pb-4 last:border-0">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-indigo-wash text-xs font-bold text-indigo">
                {r.author.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">{r.author}</span>
                  {r.receiptVerified && (
                    <span className="inline-flex items-center gap-1 rounded-sm bg-ok/10 px-1.5 py-0.5 text-2xs font-semibold text-ok" title={t('receiptVerifiedTip')}>
                      {t('receiptVerified')}
                    </span>
                  )}
                </div>
                <span className="text-xs text-meta">{shortDate(r.date)}</span>
              </div>
              <div className="ml-auto"><Stars rating={r.rating} showValue={false} /></div>
            </div>
            <p className="mt-2 text-sm text-ink-soft">{r.text}</p>
            {r.ownerReply && (
              <div className="mt-3 rounded-md border-l-2 border-indigo bg-indigo-wash/50 p-3">
                <p className="text-xs font-semibold text-indigo">{t('responseFromOwner', { date: shortDate(r.ownerReply.date) })}</p>
                <p className="mt-1 text-sm text-ink-soft">{r.ownerReply.text}</p>
              </div>
            )}
          </article>
        ))}
        {reviews.length === 0 && (
          <div className="panel p-8 text-center">
            <p className="text-ink-soft">{t('noReviewsYet')}</p>
            <button onClick={() => setWriting(true)} className="btn btn-primary mt-3">{t('beFirstToReview')}</button>
          </div>
        )}
      </div>
    </section>
  );
}
