import Link from 'next/link';

export function Pagination({ page, pages, baseQuery }: { page: number; pages: number; baseQuery: string }) {
  if (pages <= 1) return null;
  const mk = (p: number) => {
    const q = new URLSearchParams(baseQuery);
    if (p === 1) q.delete('page');
    else q.set('page', String(p));
    const s = q.toString();
    return s ? `?${s}` : '?';
  };
  const nums: (number | '…')[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
      {page > 1 && (
        <Link href={mk(page - 1)} className="btn btn-secondary px-3 py-2 text-sm" scroll>
          ← Prev
        </Link>
      )}
      {nums.map((n, i) =>
        n === '…' ? (
          <span key={`e${i}`} className="px-2 text-meta">…</span>
        ) : (
          <Link
            key={n}
            href={mk(n)}
            aria-current={n === page ? 'page' : undefined}
            className={`tnum grid h-9 min-w-9 place-items-center rounded-sm border px-2 text-sm font-medium ${
              n === page ? 'border-ink bg-ink text-paper' : 'border-rule bg-panel text-ink-soft hover:border-[#c9c8bf]'
            }`}
          >
            {n}
          </Link>
        ),
      )}
      {page < pages && (
        <Link href={mk(page + 1)} className="btn btn-secondary px-3 py-2 text-sm">
          Next →
        </Link>
      )}
    </nav>
  );
}
