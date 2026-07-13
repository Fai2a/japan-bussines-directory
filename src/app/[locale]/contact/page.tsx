'use client';

import { useState } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Support' }]} />
      <div className="mx-auto mt-6 grid max-w-4xl gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Contact & support</h1>
          <p className="mt-2 text-ink-soft">Questions about a listing, your account, or billing? Send us a note and we’ll reply by email — usually within one business day.</p>

          {sent ? (
            <div className="panel mt-6 border-ok/40 bg-ok/5 p-5">
              <h2 className="font-semibold text-ok">Message sent</h2>
              <p className="mt-1 text-sm text-ink-soft">Thanks — we’ve received your message and will reply to your email shortly.</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="panel mt-6 grid gap-4 p-5 sm:grid-cols-2">
              <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <label className="block"><span className="mb-1 block text-sm font-medium text-ink">Name</span>
                <input required className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" /></label>
              <label className="block"><span className="mb-1 block text-sm font-medium text-ink">Email</span>
                <input required type="email" className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" /></label>
              <label className="block sm:col-span-2"><span className="mb-1 block text-sm font-medium text-ink">Topic</span>
                <select className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo">
                  <option>General question</option><option>Listing / claim</option><option>Billing</option><option>Report a problem</option><option>Data Hub / API</option>
                </select></label>
              <label className="block sm:col-span-2"><span className="mb-1 block text-sm font-medium text-ink">Message</span>
                <textarea required rows={5} className="w-full rounded-md border border-rule bg-panel p-3 text-sm focus:outline-none focus-visible:border-indigo" /></label>
              <div className="sm:col-span-2"><button className="btn btn-primary">Send message</button></div>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          <div className="panel p-4">
            <h2 className="eyebrow mb-2">Other ways</h2>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li><a href="/remove-company" className="link">Remove my company →</a></li>
              <li><a href="/get-listed" className="link">Get my business listed →</a></li>
              <li><a href="/saas" className="link">Data Hub & API access →</a></li>
            </ul>
          </div>
          <div className="panel p-4 text-sm text-ink-soft">
            <h2 className="eyebrow mb-2">Response times</h2>
            <p>Support: ~1 business day.<br />Billing: ~1 business day.<br />Removal requests: up to 3 business days after email verification.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
