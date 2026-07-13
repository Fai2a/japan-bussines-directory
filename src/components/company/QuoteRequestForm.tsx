'use client';

import { useState } from 'react';

export function QuoteRequestForm({ businessId, businessName }: { businessId: number; businessName: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="panel border-ok/40 bg-ok/5 p-4">
        <h2 className="font-display font-bold text-ok">Quote request sent</h2>
        <p className="mt-1 text-sm text-ink-soft">{businessName} will reply to {email} directly.</p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="panel border-seal/30 p-4">
        <h2 className="font-display font-bold text-ink">Request a quote</h2>
        <p className="mt-1 text-sm text-ink-soft">Send {businessName} a quick brief and get a price estimate.</p>
        <button onClick={() => setOpen(true)} className="btn btn-primary mt-3 w-full">Request a quote</button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, name, email, message }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(d?.error ?? 'Could not send your request.');
      return;
    }
    setSent(true);
  }

  return (
    <form onSubmit={submit} className="panel border-seal/30 space-y-3 p-4">
      <h2 className="font-display font-bold text-ink">Request a quote</h2>
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" />
      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" />
      <textarea required rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What do you need?" className="w-full rounded-md border border-rule bg-panel p-3 text-sm focus:outline-none focus-visible:border-indigo" />
      {error && <p className="rounded-sm bg-seal-wash px-3 py-2 text-sm text-seal-ink" role="alert">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">Cancel</button>
        <button type="submit" disabled={busy} className="btn btn-primary flex-1 disabled:opacity-60">{busy ? 'Sending…' : 'Send request'}</button>
      </div>
    </form>
  );
}
