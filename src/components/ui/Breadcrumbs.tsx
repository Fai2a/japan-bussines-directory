import { Link } from '@/i18n/navigation';

export interface Crumb {
  href?: string;
  label: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-meta">
        {items.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden className="text-rule">/</span>}
            {c.href ? (
              <Link href={c.href} className="hover:text-ink">{c.label}</Link>
            ) : (
              <span className="text-ink-soft">{c.label}</span>
            )}
          </span>
        ))}
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: items.map((c, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: c.label,
              ...(c.href ? { item: `https://nihonpages.example.jp${c.href}` } : {}),
            })),
          }),
        }}
      />
    </>
  );
}
