'use client';

import { useEffect, useState } from 'react';

/**
 * Cookie consent that DEFAULTS to declining non-essential cookies (privacy-first,
 * per platform policy). Only essential cookies run until the user opts in.
 */
export function CookieBanner() {
  const [show, setShow] = useState(false);

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
          We use only essential cookies by default. Optional analytics cookies help us improve the
          directory — they stay off unless you accept.{' '}
          <a href="/legal/cookies" className="link">
            Cookies Policy
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => choose(false)} className="btn btn-secondary">
            Decline optional
          </button>
          <button type="button" onClick={() => choose(true)} className="btn btn-primary">
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
