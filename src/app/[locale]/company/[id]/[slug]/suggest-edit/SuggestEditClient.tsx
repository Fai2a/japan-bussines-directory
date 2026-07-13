'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const FIELDS = [
  { id: 'hours', label: 'Opening hours' },
  { id: 'phone', label: 'Phone number' },
  { id: 'address', label: 'Address' },
  { id: 'website', label: 'Website' },
  { id: 'category', label: 'Category' },
  { id: 'closed', label: 'This business has closed' },
  { id: 'other', label: 'Something else' },
];

export function SuggestEditClient({ id, slug, name }: { id: number; slug: string; name: string }) {
  const [field, setField] = useState('hours');
  const [value, setValue] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    try {
      const key = 'np_my_edits';
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      const label = FIELDS.find((f) => f.id === field)?.label ?? field;
      prev.unshift({ businessId: id, businessName: name, summary: `${label}: ${value.trim()}`, date: new Date().toISOString(), status: 'pending' });
      localStorage.setItem(key, JSON.stringify(prev));
    } catch {}
    setSent(true);
  }

  if (sent) {
    return (
      <div className="shell py-12">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok/10">
            <svg viewBox="0 0 24 24" width="30" height="30" className="text-ok" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">Thanks for the suggestion</h1>
          <p className="mt-2 text-ink-soft">We’ll review your proposed change to <span className="font-semibold text-ink">{name}</span> and update the listing if it checks out. You can track it in your account.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href={`/company/${id}/${slug}`} className="btn btn-secondary">Back to listing</Link>
            <Link href="/account" className="btn btn-primary">View my suggestions</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: `/company/${id}/${slug}`, label: name }, { label: 'Suggest an edit' }]} />
      <div className="mx-auto mt-4 max-w-xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Suggest an edit</h1>
        <p className="mt-2 text-ink-soft">Help keep <span className="font-medium text-ink">{name}</span> accurate. Changes are reviewed by a human before they go live.</p>

        <form onSubmit={submit} className="panel mt-6 space-y-4 p-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">What needs fixing?</span>
            <select value={field} onChange={(e) => setField(e.target.value)} className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo">
              {FIELDS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">The correct information</span>
            <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={3} placeholder="Tell us what it should say…" className="w-full rounded-md border border-rule bg-panel p-3 text-sm focus:outline-none focus-visible:border-indigo" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Your email <span className="font-normal text-meta">(optional — to notify you)</span></span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.jp" className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" />
          </label>
          <button type="submit" disabled={!value.trim()} className="btn btn-primary w-full disabled:opacity-50">Submit suggestion</button>
        </form>
      </div>
    </div>
  );
}
