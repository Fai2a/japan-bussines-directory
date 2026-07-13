import { Link } from '@/i18n/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

/**
 * Honest, on-brand placeholder for sections scheduled in a later build phase.
 * We show exactly what's coming rather than faking a finished feature.
 */
export function Upcoming({
  title,
  phase,
  summary,
  points,
  crumb,
  primary = { href: '/', label: 'Back to home' },
}: {
  title: string;
  phase: string;
  summary: string;
  points: string[];
  crumb: string;
  primary?: { href: string; label: string };
}) {
  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: crumb }]} />
      <div className="mx-auto mt-6 max-w-2xl">
        <span className="eyebrow">{phase}</span>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h1>
        <p className="mt-3 text-lg text-ink-soft">{summary}</p>
        <div className="panel mt-6 p-5">
          <p className="eyebrow mb-3">What this section will include</p>
          <ul className="space-y-2">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-ink-soft">
                <span aria-hidden className="mt-0.5 text-indigo">▸</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 flex gap-2">
          <Link href={primary.href} className="btn btn-primary">{primary.label}</Link>
          <Link href="/categories" className="btn btn-secondary">Browse the directory</Link>
        </div>
      </div>
    </div>
  );
}
