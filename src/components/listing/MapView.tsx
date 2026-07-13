'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Business } from '@/lib/types';
import { CATEGORY_BY_SLUG, GROUP_BY_KEY } from '@/lib/categories';
import { CITY_BY_SLUG } from '@/lib/cities';
import { companyHref } from '@/components/ui/BusinessCard';
import { Stars } from '@/components/ui/Stars';

const W = 720;
const H = 460;
const PAD = 40;

function hueOf(b: Business) {
  const cat = CATEGORY_BY_SLUG[b.categorySlugs[0]];
  return cat ? GROUP_BY_KEY[cat.group].hue : '#8A8B85';
}

export function MapView({ businesses }: { businesses: Business[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [rect, setRect] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  // Auto-fit projection to the data's bounding box (tight for one city, wide for many).
  const proj = useMemo(() => {
    if (businesses.length === 0) return null;
    const lats = businesses.map((b) => b.lat);
    const lngs = businesses.map((b) => b.lng);
    let minLat = Math.min(...lats), maxLat = Math.max(...lats);
    let minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const padLat = (maxLat - minLat) * 0.15 || 0.02;
    const padLng = (maxLng - minLng) * 0.15 || 0.02;
    minLat -= padLat; maxLat += padLat; minLng -= padLng; maxLng += padLng;
    const sx = (W - PAD * 2) / (maxLng - minLng);
    const sy = (H - PAD * 2) / (maxLat - minLat);
    const s = Math.min(sx, sy);
    const ox = (W - s * (maxLng - minLng)) / 2;
    const oy = (H - s * (maxLat - minLat)) / 2;
    return {
      x: (lng: number) => ox + (lng - minLng) * s,
      y: (lat: number) => H - (oy + (lat - minLat) * s), // north up
    };
  }, [businesses]);

  const points = useMemo(() => {
    if (!proj) return [];
    return businesses.map((b) => ({ b, x: proj.x(b.lng), y: proj.y(b.lat) }));
  }, [businesses, proj]);

  const inRect = useMemo(() => {
    if (!rect) return null;
    const x0 = Math.min(rect.x0, rect.x1), x1 = Math.max(rect.x0, rect.x1);
    const y0 = Math.min(rect.y0, rect.y1), y1 = Math.max(rect.y0, rect.y1);
    return points.filter((p) => p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1).map((p) => p.b);
  }, [rect, points]);

  function toSvg(e: React.PointerEvent) {
    const svg = svgRef.current!;
    const r = svg.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  }

  if (!proj) return <div className="panel p-10 text-center text-ink-soft">No locations to map.</div>;

  const hovered = hover != null ? points.find((p) => p.b.id === hover) : null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs text-meta">Schematic map · drag to draw an area and search within it.</p>
        {rect && (
          <button onClick={() => setRect(null)} className="text-xs font-medium text-indigo underline-offset-2 hover:underline">
            Clear area
          </button>
        )}
      </div>
      <div className="panel overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none select-none"
          style={{ background: '#f4f3ee', cursor: 'crosshair' }}
          onPointerDown={(e) => { const p = toSvg(e); drag.current = p; setRect({ x0: p.x, y0: p.y, x1: p.x, y1: p.y }); }}
          onPointerMove={(e) => { if (!drag.current) return; const p = toSvg(e); setRect((r) => (r ? { ...r, x1: p.x, y1: p.y } : r)); }}
          onPointerUp={() => { drag.current = null; }}
          onPointerLeave={() => { drag.current = null; }}
        >
          {/* graticule */}
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`v${i}`} x1={(W / 8) * i} y1={0} x2={(W / 8) * i} y2={H} stroke="#e4e3db" strokeWidth={1} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={(H / 5) * i} x2={W} y2={(H / 5) * i} stroke="#e4e3db" strokeWidth={1} />
          ))}

          {rect && (
            <rect
              x={Math.min(rect.x0, rect.x1)} y={Math.min(rect.y0, rect.y1)}
              width={Math.abs(rect.x1 - rect.x0)} height={Math.abs(rect.y1 - rect.y0)}
              fill="#3B4A6B22" stroke="#3B4A6B" strokeWidth={1.5} strokeDasharray="4 3"
            />
          )}

          {points.map((p) => {
            const active = hover === p.b.id;
            const dimmed = inRect && !inRect.includes(p.b);
            return (
              <g key={p.b.id} opacity={dimmed ? 0.25 : 1}
                onPointerEnter={() => setHover(p.b.id)} onPointerLeave={() => setHover((h) => (h === p.b.id ? null : h))}
                style={{ cursor: 'pointer' }}>
                <circle cx={p.x} cy={p.y} r={active ? 8 : 6} fill={hueOf(p.b)} stroke="#fff" strokeWidth={1.5} />
                {active && <circle cx={p.x} cy={p.y} r={12} fill="none" stroke={hueOf(p.b)} strokeWidth={1.5} opacity={0.5} />}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover card */}
      {hovered && (
        <Link href={companyHref(hovered.b)} className="panel mt-2 flex items-center justify-between gap-3 p-3 hover:border-[#c9c8bf]">
          <div className="min-w-0">
            <p className="truncate font-display font-bold text-ink">{hovered.b.name}</p>
            <p className="text-xs text-meta">{CITY_BY_SLUG[hovered.b.citySlug]?.name} · {CATEGORY_BY_SLUG[hovered.b.categorySlugs[0]]?.name}</p>
          </div>
          <Stars rating={hovered.b.rating} count={hovered.b.reviewCount} />
        </Link>
      )}

      {/* Draw-area results */}
      {inRect && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-ink">{inRect.length} business{inRect.length === 1 ? '' : 'es'} in this area</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {inRect.slice(0, 8).map((b) => (
              <Link key={b.id} href={companyHref(b)} className="panel flex items-center gap-2 p-2.5 hover:border-[#c9c8bf]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: hueOf(b) }} />
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{b.name}</span>
                <span className="tnum text-xs text-meta">{b.rating.toFixed(1)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
