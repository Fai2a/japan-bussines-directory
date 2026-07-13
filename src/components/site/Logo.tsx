/**
 * Wordmark + hanko-inspired seal mark. The seal red (#C0392B) appears here and
 * on primary CTAs only — never as a background wash (design spec, Part 3).
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden className="shrink-0">
        <rect x="1.5" y="1.5" width="37" height="37" rx="6" fill="#C0392B" />
        <rect x="1.5" y="1.5" width="37" height="37" rx="6" fill="none" stroke="#9C2A1F" strokeWidth="1.5" />
        {/* Stylised 日 (nichi / "Japan / day") carved as a seal */}
        <g fill="#FAFAF7">
          <rect x="12" y="9" width="16" height="22" rx="1.5" fill="none" stroke="#FAFAF7" strokeWidth="2.4" />
          <rect x="14" y="18.8" width="12" height="2.4" />
        </g>
      </svg>
      {!compact && (
        <span className="font-display text-lg font-extrabold tracking-tight text-ink">
          Nihon<span className="text-seal">Pages</span>
        </span>
      )}
    </span>
  );
}
