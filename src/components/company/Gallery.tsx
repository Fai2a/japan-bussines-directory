'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { Photo } from '@/lib/types';

export function Gallery({ photos, name }: { photos: Photo[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? null : (i + 1) % photos.length));
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, photos.length]);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {photos.map((p, i) => (
          <button
            key={i}
            onClick={() => setOpen(i)}
            className={`relative overflow-hidden rounded-md border border-rule ${i === 0 ? 'col-span-2 row-span-2 aspect-[4/3] sm:aspect-auto' : 'aspect-square'}`}
            aria-label={`Open photo ${i + 1} of ${photos.length}`}
          >
            <Image src={p.url} alt={p.alt} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover transition-transform duration-300 hover:scale-105" />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4 animate-fade-in"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${name} photo viewer`}
        >
          <button className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={() => setOpen(null)} aria-label="Close">
            ✕
          </button>
          <div className="relative h-[80vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Image src={photos[open].url} alt={photos[open].alt} fill sizes="90vw" className="object-contain" />
            {photos[open].credit && (
              <span className="absolute bottom-2 right-2 rounded bg-ink/60 px-2 py-1 text-2xs text-white/80">
                Photo: {photos[open].credit}
              </span>
            )}
          </div>
          <div className="tnum absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
            {open + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
