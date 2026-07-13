'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * Cookie consent that DEFAULTS to declining non-essential cookies (privacy-first,
 * per platform policy). Only essential cookies run until the user opts in.
 */
export function CookieBanner() {
  const [show, setShow] = useState(false);
  const t = useTranslations('cookie');

  useEffect(() => {
    try {
      if (!localStorage.getItem('np_cookie_choice')) setShow(true);
    } catch {
      /* storage unavailable — stay quiet */
    }
  }, []);

  function choose(analytics: boolean) {
    try {
      localStorage.setItem('np_cookie_choice', JSON.stringify({ analytics, ts: Date.now() }));
    } catch {}
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-panel shadow-lift animate-fade-in">
      <div className="shell flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-ink-soft">
          {t('text')}{' '}
          <Link href="/legal/cookies" className="link">
            {t('policyLink')}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => choose(false)} className="btn btn-secondary">
            {t('declineOptional')}
          </button>
          <button type="button" onClick={() => choose(true)} className="btn btn-primary">
            {t('acceptAll')}
          </button>
        </div>
      </div>
    </div>
  );
}
