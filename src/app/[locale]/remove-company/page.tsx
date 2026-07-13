'use client';

import { useState } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function RemoveCompanyPage() {
  const [sent, setSent] = useState(false);
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/removals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, email, reason }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(d?.error ?? 'Could not submit the request.');
      return;
    }
    setSent(true);
  }

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Remove Company' }]} />
      <div className="mx-auto mt-6 max-w-xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Remove my company</h1>
        <p className="mt-2 text-ink-soft">Request removal of a listing. To protect businesses from malicious requests, our team verifies the request before removing anything (usually within 3 business days).</p>

        {sent ? (
          <div className="panel mt-6 border-ok/40 bg-ok/5 p-5">
            <h2 className="font-semibold text-ok">Request received</h2>
            <p className="mt-1 text-sm text-ink-soft">We’ll verify and review your request. The listing stays live until the review is complete.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="panel mt-6 grid gap-4 p-5">
            <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <label className="block"><span className="mb-1 block text-sm font-medium text-ink">Listing URL</span>
              <input required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://nihonpages.example.jp/company/…" className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium text-ink">Your email</span>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.jp" className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium text-ink">Reason</span>
              <textarea required rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell us why this listing should be removed." className="w-full rounded-md border border-rule bg-panel p-3 text-sm focus:outline-none focus-visible:border-indigo" /></label>
            {error && <p className="rounded-sm bg-seal-wash px-3 py-2 text-sm text-seal-ink" role="alert">{error}</p>}
            <div><button disabled={busy} className="btn btn-primary disabled:opacity-60">{busy ? 'Sending…' : 'Submit removal request'}</button></div>
          </form>
        )}
      </div>
    </div>
  );
}
