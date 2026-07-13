import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';

export default function NotFound() {
  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-meta">Error 404</div>
      <div className="tnum mt-2 font-display text-7xl font-extrabold text-ink">404</div>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">This page took a wrong turn</h1>
      <p className="mt-2 max-w-md text-ink-soft">
        The page you’re looking for isn’t here. It may have moved, or the listing may have been
        removed. Here’s a way back.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn btn-primary">Back to home</Link>
        <Link href="/categories" className="btn btn-secondary">Browse categories</Link>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {CATEGORIES.slice(0, 6).map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`} className="text-sm font-medium text-indigo hover:underline">
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
