'use client';

import { useState } from 'react';
import { HOLIDAYS, HOLIDAY_YEARS } from '@/lib/holidays';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HolidaysPage() {
  const [year, setYear] = useState(2026);
  const list = HOLIDAYS[year] ?? [];

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Public Holidays' }]} />
      <header className="mb-6 mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Public holidays in Japan</h1>
          <p className="mt-2 text-ink-soft">National holidays (国民の祝日). Many businesses close or shorten hours on these days.</p>
        </div>
        <div className="flex items-end gap-0.5">
          {HOLIDAY_YEARS.map((y) => (
            <button key={y} onClick={() => setYear(y)} data-active={y === year} className="idx-tab tnum" style={{ ['--tab-hue' as string]: '#3B4A6B' }}>
              {y}
            </button>
          ))}
        </div>
      </header>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rule bg-[#f4f3ee] text-left">
              <th className="px-4 py-2.5 font-mono text-2xs uppercase tracking-wide text-meta">Date</th>
              <th className="px-4 py-2.5 font-mono text-2xs uppercase tracking-wide text-meta">Day</th>
              <th className="px-4 py-2.5 font-mono text-2xs uppercase tracking-wide text-meta">Holiday</th>
              <th className="px-4 py-2.5 font-mono text-2xs uppercase tracking-wide text-meta">日本語</th>
            </tr>
          </thead>
          <tbody>
            {list.map((h) => {
              const d = new Date(h.date);
              const weekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <tr key={h.date} className="border-b border-rule last:border-0 hover:bg-[#faf9f5]">
                  <td className="tnum px-4 py-2.5 font-medium text-ink">
                    {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className={`px-4 py-2.5 ${weekend ? 'text-seal-ink' : 'text-ink-soft'}`}>{WEEKDAY[d.getDay()]}</td>
                  <td className="px-4 py-2.5 text-ink">{h.en}</td>
                  <td className="px-4 py-2.5 font-jp text-ink-soft">{h.ja}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-meta tnum">{list.length} national holidays in {year}. When a holiday falls on a Sunday, the following weekday becomes a substitute holiday (振替休日).</p>
    </div>
  );
}
