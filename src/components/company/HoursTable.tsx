'use client';

import { useTranslations } from 'next-intl';
import type { Business } from '@/lib/types';
import { useOpenStatusLabel } from '@/lib/useOpenStatusLabel';

const ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const JS_DAY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function HoursTable({ b }: { b: Business }) {
  const t = useTranslations('hours');
  const status = useOpenStatusLabel(b);
  const todayKey = JS_DAY[new Date().getDay()];

  return (
    <div>
      <div className={`mb-3 inline-flex items-center gap-2 rounded-sm px-2.5 py-1 text-sm font-semibold ${status.open ? 'bg-ok/10 text-ok' : 'bg-[#f1f0ea] text-ink-soft'}`}>
        <span className={`h-2 w-2 rounded-full ${status.open ? 'bg-ok' : 'bg-meta'}`} />
        {status.label}
      </div>
      <table className="w-full text-sm">
        <tbody>
          {ORDER.map((d) => {
            const h = b.hours[d];
            const isToday = d === todayKey;
            return (
              <tr key={d} className={isToday ? 'font-semibold text-ink' : 'text-ink-soft'}>
                <td className="py-1 pr-4">{t(d)}{isToday && <span className="ml-1 text-2xs text-meta">{t('today')}</span>}</td>
                <td className="tnum py-1 text-right">{h ? `${h[0]} – ${h[1]}` : <span className="text-meta">{t('closed')}</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
