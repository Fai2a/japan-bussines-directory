import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DATAHUB_PLANS } from '@/lib/plans';
import { usd } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Data Hub — the full company database as a clean table',
  description: 'B2B access to the full NihonPages company database: advanced filters, saved searches, CSV export, and a read-only API. No ads.',
};

export default function SaasPage() {
  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Data Hub' }]} />

      <section className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <span className="eyebrow">NihonPages Data Hub</span>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-ink">Every company in Japan. One clean table.</h1>
          <p className="mt-3 max-w-lg text-lg text-ink-soft">Search, filter and export {`222,410`} company records through a fast, dense interface built for sales, research and operations teams. No ads, ever.</p>
          <div className="mt-6 flex gap-3"><Link href="/saas/app" className="btn btn-primary">Open the app</Link><a href="#pricing" className="btn btn-secondary">See pricing</a></div>
        </div>
        <div id="demo" className="panel overflow-hidden p-1">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-px overflow-hidden rounded bg-rule font-mono text-2xs">
            {['Company', 'City', 'Employees', 'Phone'].map((h) => (
              <div key={h} className="bg-[#ecebe4] px-2 py-1.5 font-semibold uppercase tracking-wide text-meta">{h}</div>
            ))}
            {[['Tanaka Shokudō', 'Tokyo', '14', '03-3421-8890'], ['Suzuki Fudōsan', 'Osaka', '22', '06-6612-0431'], ['Ito Clinic', 'Kyoto', '9', '075-221-5567'], ['Mori Motors', 'Nagoya', '40', '052-331-2280'], ['Kato Komuten', 'Fukuoka', '6', '092-712-4419']].map((r, i) => (
              <div key={i} className="contents">
                <div className="truncate bg-panel px-2 py-1.5 text-ink">{r[0]}</div>
                <div className="truncate bg-panel px-2 py-1.5 text-ink-soft">{r[1]}</div>
                <div className="tnum bg-panel px-2 py-1.5 text-ink-soft">{r[2]}</div>
                <div className="tnum truncate bg-panel px-2 py-1.5 text-ink-soft">{r[3]}</div>
              </div>
            ))}
          </div>
          <Link href="/saas/app" className="block px-3 py-2 text-2xs font-semibold text-indigo hover:underline">Open the live table app — filters, saved searches, CSV export with quotas →</Link>
        </div>
      </section>

      <section id="pricing" className="mt-14">
        <h2 className="mb-6 font-display text-2xl font-bold text-ink">Plans & pricing</h2>
        <div className="grid gap-5 lg:grid-cols-3">
          {DATAHUB_PLANS.map((p) => (
            <div key={p.id} className={`panel flex flex-col p-6 ${p.highlighted ? 'border-indigo ring-1 ring-indigo/20' : ''}`}>
              {p.highlighted && <span className="mb-2 self-start rounded-sm bg-indigo px-2 py-1 text-2xs font-bold uppercase text-white">Best value</span>}
              <h3 className="font-display text-xl font-bold text-ink">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1"><span className="tnum font-display text-4xl font-extrabold text-ink">{usd(p.price)}</span><span className="text-sm text-meta">/mo</span></div>
              <dl className="mt-4 space-y-1 border-y border-rule py-4 text-sm">
                <div className="flex justify-between"><dt className="text-meta">Contacts</dt><dd className="tnum font-medium text-ink">{p.contacts}</dd></div>
                <div className="flex justify-between"><dt className="text-meta">Exports</dt><dd className="tnum font-medium text-ink">{p.exports}</dd></div>
              </dl>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-ink-soft">
                {p.features.map((f) => <li key={f} className="flex gap-2"><span className="text-ok">✓</span>{f}</li>)}
              </ul>
              <Link href="/contact" className={`btn mt-5 ${p.highlighted ? 'btn-primary' : 'btn-secondary'}`}>Start {p.name}</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
