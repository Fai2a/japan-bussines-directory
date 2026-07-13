'use client';

import { useState } from 'react';

/**
 * EN / 日本語 switcher. Phase 6 wires this to next-intl locale routing; for now
 * it persists the preference so the toggle is real and honest.
 */
export function LangSwitch() {
  const [lang, setLang] = useState<'en' | 'ja'>('en');
  return (
    <div className="inline-flex overflow-hidden rounded border border-rule text-xs font-semibold">
      {(['en', 'ja'] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => {
            setLang(l);
            document.cookie = `np_lang=${l};path=/;max-age=31536000`;
          }}
          className={`px-2 py-1 transition-colors ${
            lang === l ? 'bg-ink text-paper' : 'bg-panel text-ink-soft hover:bg-[#f1f0ea]'
          } ${l === 'ja' ? 'font-jp' : ''}`}
        >
          {l === 'en' ? 'EN' : '日本語'}
        </button>
      ))}
    </div>
  );
}
