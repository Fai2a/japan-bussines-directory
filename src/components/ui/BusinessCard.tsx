'use client';

import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Business } from '@/lib/types';
import { CATEGORY_BY_SLUG } from '@/lib/categories';
import { CITY_BY_SLUG } from '@/lib/cities';
import { businessHue } from '@/lib/format';
import { isFeatured } from '@/lib/queries';
import { useOpenStatusLabel } from '@/lib/useOpenStatusLabel';
import { Stars } from './Stars';
import { Monogram } from './Monogram';
import { StatusBadge, FeaturedBadge, VerifiedBadge } from './Badges';
import { CardSaveButton } from './CardSaveButton';

export function companyHref(b: Business) {
  return `/company/${b.id}/${b.slug}`;
}

export function BusinessCard({ b, featured }: { b: Business; featured?: boolean }) {
  const locale = useLocale();
  const ja = locale === 'ja';
  const hue = businessHue(b);
  const cat = CATEGORY_BY_SLUG[b.categorySlugs[0]];
  const city = CITY_BY_SLUG[b.citySlug];
  const status = useOpenStatusLabel(b);
  const showFeatured = featured ?? isFeatured(b);

  return (
    <div className="relative">
    <CardSaveButton id={b.id} name={b.name} />
    <Link
      href={companyHref(b)}
      className="group panel flex overflow-hidden transition-colors hover:border-[#c9c8bf] focus-visible:border-indigo"
      style={showFeatured ? { boxShadow: `inset 3px 0 0 ${hue}` } : undefined}
    >
      <div className="relative h-[104px] w-[104px] shrink-0 bg-[#f1f0ea] sm:h-[124px] sm:w-[124px]">
        {b.photos.length > 0 ? (
          <Image
            src={b.photos[0].url}
            alt={b.photos[0].alt}
            fill
            sizes="124px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Monogram name={b.name} hue={hue} size="lg" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-display text-[0.98rem] font-bold leading-tight text-ink group-hover:text-indigo">
              {b.name}
            </h3>
            <p className="truncate font-jp text-xs text-meta">{b.nameJa}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <StatusBadge status={b.status} />
            {showFeatured && <FeaturedBadge />}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Stars rating={b.rating} count={b.reviewCount} />
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-soft">
          <span
            className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-medium"
            style={{ color: hue, background: `${hue}14` }}
          >
            {ja ? cat?.nameJa : cat?.name}
          </span>
          <span className="text-meta">·</span>
          <span className="truncate">{ja ? city?.nameJa : city?.name}</span>
          <span className="text-meta">·</span>
          <span className={status.open ? 'font-semibold text-ok' : 'text-meta'}>{status.label}</span>
          <VerifiedBadge tier={b.verify} />
        </div>
      </div>
    </Link>
    </div>
  );
}
