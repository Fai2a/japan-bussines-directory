import { monogram } from '@/lib/format';

/**
 * Typographic monogram tile in the category's hue — the deliberate replacement
 * for gray placeholder icons on photo-less listings (design spec, Part 3).
 */
export function Monogram({
  name,
  hue,
  size = 'md',
  rounded = 'md',
}: {
  name: string;
  hue: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'md' | 'lg';
}) {
  const px = { sm: 40, md: 56, lg: 80, xl: 140 }[size];
  const fs = { sm: 15, md: 20, lg: 28, xl: 48 }[size];
  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center font-display font-extrabold text-white ${
        rounded === 'lg' ? 'rounded-lg' : 'rounded-md'
      }`}
      style={{
        width: px,
        height: px,
        fontSize: fs,
        background: `linear-gradient(150deg, ${hue}, ${hue}D9)`,
        letterSpacing: '-0.03em',
      }}
    >
      {monogram(name)}
    </div>
  );
}
