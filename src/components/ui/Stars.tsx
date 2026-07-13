import { ratingStars } from '@/lib/format';

// References the shared gradient defined once in the root layout (SvgDefs),
// so ids are stable between server and client (no hydration mismatch).
function Star({ fill }: { fill: 'full' | 'half' | 'empty' }) {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden className="inline-block shrink-0">
      <path
        d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8z"
        fill={fill === 'full' ? '#C0392B' : fill === 'half' ? 'url(#np-star-half)' : '#E4E3DB'}
      />
    </svg>
  );
}

export function Stars({ rating, count, showValue = true }: { rating: number; count?: number; showValue?: boolean }) {
  const { full, half, empty } = ratingStars(rating);
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`Rated ${rating} out of 5`}>
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f${i}`} fill="full" />
        ))}
        {half && <Star fill="half" />}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e${i}`} fill="empty" />
        ))}
      </span>
      {showValue && <span className="tnum text-sm font-semibold text-ink">{rating.toFixed(1)}</span>}
      {typeof count === 'number' && <span className="tnum text-sm text-meta">({count})</span>}
    </span>
  );
}
