'use client';

import { useFavorites } from '@/lib/useFavorites';

/** Compact bookmark toggle overlaid on a BusinessCard (kept outside the card's <Link>). */
export function CardSaveButton({ id, name }: { id: number; name: string }) {
  const { has, toggle, ready } = useFavorites();
  const saved = ready && has(id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        toggle(id);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from favorites` : `Save ${name} to favorites`}
      title={saved ? 'Saved' : 'Save'}
      className={`absolute left-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-sm border backdrop-blur transition-colors ${
        saved
          ? 'border-seal bg-seal text-white'
          : 'border-rule bg-panel/85 text-ink-soft hover:text-seal'
      }`}
    >
      <svg viewBox="0 0 20 20" width="15" height="15" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M5 3h10v14l-5-3-5 3z" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
