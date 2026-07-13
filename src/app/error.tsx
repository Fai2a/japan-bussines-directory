'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // In production this reports to the error pipeline (Sentry etc.).
    console.error(error);
  }, [error]);

  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-meta">Error 500</div>
      <div className="tnum mt-2 font-display text-7xl font-extrabold text-seal">500</div>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">Something broke on our end</h1>
      <p className="mt-2 max-w-md text-ink-soft">
        This isn’t you — it’s us. The error has been logged. Try again, and if it keeps happening,
        let our support team know.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-meta">Reference: {error.digest}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button onClick={reset} className="btn btn-primary">Try again</button>
        <Link href="/" className="btn btn-secondary">Back to home</Link>
        <Link href="/contact" className="btn btn-ghost">Contact support</Link>
      </div>
    </div>
  );
}
