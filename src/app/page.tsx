import Link from 'next/link';
import Image from 'next/image';
import { SearchBar } from '@/components/site/SearchBar';
import { StatBand } from '@/components/home/StatBand';
import { PricingCards } from '@/components/home/PricingCards';
import { BusinessCard } from '@/components/ui/BusinessCard';
import { CATEGORIES } from '@/lib/categories';
import { CITIES } from '@/lib/cities';
import { dbRecentCompanies } from '@/lib/server/queries';
import { GROUP_BY_KEY } from '@/lib/categories';

const QUICK = [
  'restaurants', 'automotive', 'doctors-clinics', 'shopping',
  'legal', 'real-estate', 'contractors', 'employment', 'schools',
];

function SectionHead({ eyebrow, title, cta }: { eyebrow: string; title: string; cta?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow mb-1.5">{eyebrow}</p>
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
      </div>
      {cta && (
        <Link href={cta.href} className="link shrink-0 text-sm font-semibold">
          {cta.label} →
        </Link>
      )}
    </div>
  );
}

// Fresh feed from the DB; revalidate keeps the homepage lively without SSR cost.
export const revalidate = 120;

export default async function HomePage() {
  const categoryNames = CATEGORIES.map((c) => c.name);
  const cityNames = CITIES.map((c) => c.name);
  const recent = await dbRecentCompanies(8);
  const quickCats = QUICK.map((s) => CATEGORIES.find((c) => c.slug === s)!).filter(Boolean);

  return (
    <>
      {/* ---- Hero -------------------------------------------------------------- */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://images.unsplash.com/photo-1554797589-7241bb691973?auto=format&fit=crop&w=1920&q=70"
            alt="A Japanese shopping street at dusk lined with izakaya lanterns and shop signage"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/55 to-ink/35" />
        </div>

        <div className="shell flex min-h-[520px] flex-col justify-center py-16">
          <div className="max-w-2xl animate-rise-in">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-white/80">
              222,410 businesses · 47 prefectures · EN / 日本語
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">
              Find the right local business, anywhere in Japan.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/85">
              Restaurants, clinics, contractors, shops and more — with real reviews, verified
              profiles, and opening hours you can trust.
            </p>
            <div className="mt-7">
              <SearchBar categories={categoryNames} cities={cityNames} variant="hero" />
            </div>
          </div>
        </div>
      </section>

      {/* ---- Category quick-links --------------------------------------------- */}
      <section className="shell py-12">
        <SectionHead eyebrow="Browse by category" title="Popular categories" cta={{ href: '/categories', label: 'Browse all categories' }} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {quickCats.map((c) => {
            const hue = GROUP_BY_KEY[c.group].hue;
            return (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="group relative isolate flex h-28 items-end overflow-hidden rounded-md border border-rule"
              >
                <Image src={c.image} alt="" fill sizes="240px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
                <div className="relative z-10 p-3">
                  <span className="mb-1 block h-1 w-8 rounded-full" style={{ background: hue }} />
                  <span className="font-display text-sm font-bold text-white">{c.name}</span>
                  <span className="tnum block text-2xs text-white/70">{(c.count / 1000).toFixed(1)}k listings</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <StatBand />

      {/* ---- Pricing ---------------------------------------------------------- */}
      <section className="shell py-14">
        <SectionHead eyebrow="For business owners" title="Get listed in minutes" />
        <p className="-mt-3 mb-8 max-w-xl text-ink-soft">
          Launch promotion: <span className="font-semibold text-seal-ink">50% off every plan</span>.
          Pick a plan and your listing goes live after a quick human review.
        </p>
        <PricingCards />
      </section>

      {/* ---- New & updated feed ----------------------------------------------- */}
      <section className="border-y border-rule bg-panel py-14">
        <div className="shell">
          <SectionHead eyebrow="Fresh on NihonPages" title="New & updated companies" cta={{ href: '/locations', label: 'Explore all' }} />
          <div className="grid gap-3 sm:grid-cols-2">
            {recent.map((b) => (
              <BusinessCard key={b.id} b={b} />
            ))}
          </div>
        </div>
      </section>

      {/* ---- Data Hub promo --------------------------------------------------- */}
      <section className="shell py-14">
        <div className="panel relative overflow-hidden p-8 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow mb-2">NihonPages Data Hub</p>
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Every company. One clean table. No ads.
              </h2>
              <p className="mt-3 max-w-lg text-ink-soft">
                Search, filter and export the full company database through a fast, dense table
                built for B2B teams — advanced filters, saved searches, and CSV export with clear
                monthly quotas.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/saas" className="btn btn-primary">Plans & pricing</Link>
                <Link href="/saas#demo" className="btn btn-secondary">See the table</Link>
              </div>
            </div>
            <div className="rounded-md border border-rule bg-[#f8f7f2] p-1">
              <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-px overflow-hidden rounded bg-rule font-mono text-2xs">
                {['Company', 'City', 'Phone'].map((h) => (
                  <div key={h} className="bg-[#ecebe4] px-2 py-1.5 font-semibold uppercase tracking-wide text-meta">{h}</div>
                ))}
                {recent.slice(0, 6).map((b) => (
                  <FragmentRow key={b.id} name={b.name} city={b.citySlug} phone={b.phone} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Popular locations ------------------------------------------------ */}
      <section className="shell pb-16">
        <SectionHead eyebrow="Browse by place" title="Popular locations" cta={{ href: '/locations', label: 'See all cities' }} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CITIES.map((c) => (
            <Link
              key={c.slug}
              href={`/location/${c.slug}`}
              className="group relative isolate flex h-32 items-end overflow-hidden rounded-md border border-rule"
            >
              <Image src={c.image} alt="" fill sizes="240px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
              <div className="relative z-10 p-3">
                <span className="font-display text-base font-bold text-white">{c.name}</span>
                <span className="tnum block text-xs text-white/75">
                  {(c.count / 1000).toFixed(1)}k listings
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function FragmentRow({ name, city, phone }: { name: string; city: string; phone: string }) {
  return (
    <>
      <div className="truncate bg-panel px-2 py-1.5 text-ink">{name}</div>
      <div className="truncate bg-panel px-2 py-1.5 capitalize text-ink-soft">{city}</div>
      <div className="tnum truncate bg-panel px-2 py-1.5 text-ink-soft">{phone}</div>
    </>
  );
}
