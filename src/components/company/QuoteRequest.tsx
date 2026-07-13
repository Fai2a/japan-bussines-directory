'use client';

import { useState } from 'react';

/** "Request a quote" → POST /api/leads → owner's lead inbox. */
export function QuoteRequest({ businessId, businessName }: { businessId: number; businessName: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, name, email, message }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? 'Something went wrong. Try again.');
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="panel border-ok/40 bg-ok/5 p-4 text-sm">
        <p className="font-semibold text-ok">Request sent</p>
        <p className="mt-1 text-ink-soft">{businessName} will reply to {email}. Most businesses respond within a day.</p>
      </div>
    );
  }

  return (
    <div className="panel border-seal/30 p-4">
      <h2 className="font-display font-bold text-ink">Request a quote</h2>
      <p className="mt-1 text-sm text-ink-soft">Send {businessName} a quick brief and get a price estimate.</p>

      {!open ? (
        <button onClick={() => setOpen(true)} className="btn btn-primary mt-3 w-full">Request a quote</button>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-2.5">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" required className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="What do you need, and by when?" required className="w-full rounded-md border border-rule bg-panel p-3 text-sm focus:outline-none focus-visible:border-indigo" />
          {error && <p className="rounded-sm bg-seal-wash px-3 py-2 text-sm text-seal-ink" role="alert">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn btn-primary flex-1 disabled:opacity-60">{busy ? 'Sending…' : 'Send request'}</button>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
