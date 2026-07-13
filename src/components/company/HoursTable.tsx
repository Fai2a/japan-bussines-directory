import type { Business } from '@/lib/types';
import { openStatus } from '@/lib/queries';

const LABELS: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};
const ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const JS_DAY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function HoursTable({ b }: { b: Business }) {
  const status = openStatus(b);
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
                <td className="py-1 pr-4">{LABELS[d]}{isToday && <span className="ml-1 text-2xs text-meta">(today)</span>}</td>
                <td className="tnum py-1 text-right">{h ? `${h[0]} – ${h[1]}` : <span className="text-meta">Closed</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
