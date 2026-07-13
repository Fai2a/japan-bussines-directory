'use client';

import { useEffect, useRef, useState } from 'react';

interface Stat {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
}

const STATS: Stat[] = [
  { value: 2011, label: 'Founded', suffix: '' },
  { value: 222410, label: 'Companies in database' },
  { value: 68240, label: 'Verified profiles' },
  { value: 486203, label: 'Reviews written' },
];

function useCountUp(target: number, run: boolean, isYear: boolean) {
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
  }, [target, run, isYear]);
  return n;
}

function StatItem({ stat, run }: { stat: Stat; run: boolean }) {
  const isYear = stat.label === 'Founded';
  const n = useCountUp(stat.value, run, isYear);
  return (
    <div className="text-center sm:text-left">
      <div className="tnum font-mono text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {stat.prefix}
        {isYear ? n : n.toLocaleString('en-US')}
        {stat.suffix}
      </div>
      <div className="mt-1 text-sm text-ink-soft">{stat.label}</div>
    </div>
  );
}

export function StatBand() {
  const [run, setRun] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
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
          <StatItem key={s.label} stat={s} run={run} />
        ))}
      </div>
    </section>
  );
}
