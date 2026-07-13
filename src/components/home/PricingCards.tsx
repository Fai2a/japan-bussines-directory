import { Link } from '@/i18n/navigation';
import { LISTING_PLANS } from '@/lib/plans';
import { usd } from '@/lib/format';

function Check({ on }: { on: boolean }) {
  return on ? (
    <svg viewBox="0 0 20 20" width="16" height="16" className="text-ok" fill="currentColor" aria-label="Included">
      <path d="M8.2 13.2l-3-3 1.1-1 1.9 1.9 5-5 1.1 1z" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" width="16" height="16" className="text-rule" fill="currentColor" aria-label="Not included">
      <path d="M6 9h8v1.6H6z" />
    </svg>
  );
}

export function PricingCards() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {LISTING_PLANS.map((plan) => {
        const featured = plan.highlighted;
        return (
          <div
            key={plan.id}
            className={`panel relative flex flex-col p-6 ${
              featured ? 'border-seal shadow-lift ring-1 ring-seal/20' : ''
            }`}
          >
            {featured && (
              <span className="absolute -top-3 left-6 rounded-sm bg-seal px-2 py-1 text-2xs font-bold uppercase tracking-wide text-white">
                Most popular
              </span>
            )}
            <h3 className="font-display text-xl font-bold text-ink">{plan.name}</h3>
            <p className="mt-1 min-h-[2.5rem] text-sm text-ink-soft">{plan.tagline}</p>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="tnum font-display text-4xl font-extrabold tracking-tight text-ink">
                {usd(plan.price)}
              </span>
              <span className="text-sm text-meta">{plan.cadence}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="tnum text-meta line-through">{usd(plan.wasPrice)}</span>
              <span className="rounded-sm bg-seal-wash px-1.5 py-0.5 text-2xs font-bold uppercase text-seal-ink">
                50% off
              </span>
            </div>

            <Link
              href={`/get-listed?plan=${plan.id}`}
              className={`btn mt-5 w-full ${featured ? 'btn-primary' : 'btn-secondary'}`}
            >
              {plan.cta}
            </Link>

            <ul className="mt-6 space-y-2.5 border-t border-rule pt-5">
              {plan.features.map((f) => (
                <li key={f.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink-soft">{f.label}</span>
                  {typeof f.value === 'boolean' ? (
                    <Check on={f.value} />
                  ) : (
                    <span className="tnum font-medium text-ink">{f.value}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
