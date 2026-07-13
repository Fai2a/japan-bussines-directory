'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Stat {
  id: 'statFounded' | 'statCompanies' | 'statVerified' | 'statReviews';
  value: number;
  isYear?: boolean;
}

const STATS: Stat[] = [
  { id: 'statFounded', value: 2011, isYear: true },
  { id: 'statCompanies', value: 222410 },
  { id: 'statVerified', value: 68240 },
  { id: 'statReviews', value: 486203 },
];

function useCountUp(target: number, run: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1300;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return n;
}

function StatItem({ stat, run, label }: { stat: Stat; run: boolean; label: string }) {
  const n = useCountUp(stat.value, run);
  return (
    <div className="text-center sm:text-left">
      <div className="tnum font-mono text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {stat.isYear ? n : n.toLocaleString('en-US')}
      </div>
      <div className="mt-1 text-sm text-ink-soft">{label}</div>
    </div>
  );
}

export function StatBand() {
  const [run, setRun] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations('home');
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRun(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="border-y border-rule bg-panel">
      <div className="shell grid grid-cols-2 gap-8 py-10 sm:grid-cols-4">
        {STATS.map((s) => (
          <StatItem key={s.id} stat={s} run={run} label={t(s.id)} />
        ))}
      </div>
    </section>
  );
}
