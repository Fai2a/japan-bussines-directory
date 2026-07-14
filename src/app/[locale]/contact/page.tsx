'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function ContactPage() {
  const t = useTranslations('contact');
  const tc = useTranslations('common');
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, topic: topic || t('topicGeneral'), message }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(d?.error ?? t('couldNotSend'));
      return;
    }
    setSent(true);
  }

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: tc('home') }, { label: t('crumb') }]} />
      <div className="mx-auto mt-6 grid max-w-4xl gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{t('title')}</h1>
          <p className="mt-2 text-ink-soft">{t('subtitle')}</p>

          {sent ? (
            <div className="panel mt-6 border-ok/40 bg-ok/5 p-5">
              <h2 className="font-semibold text-ok">{t('sentTitle')}</h2>
              <p className="mt-1 text-sm text-ink-soft">{t('sentBody')}</p>
            </div>
          ) : (
            <form onSubmit={submit} className="panel mt-6 grid gap-4 p-5 sm:grid-cols-2">
              <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <label className="block"><span className="mb-1 block text-sm font-medium text-ink">{t('name')}</span>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" /></label>
              <label className="block"><span className="mb-1 block text-sm font-medium text-ink">{t('email')}</span>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" /></label>
              <label className="block sm:col-span-2"><span className="mb-1 block text-sm font-medium text-ink">{t('topic')}</span>
                <select value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo">
                  <option>{t('topicGeneral')}</option><option>{t('topicListing')}</option><option>{t('topicBilling')}</option><option>{t('topicReport')}</option><option>{t('topicDataHub')}</option>
                </select></label>
              <label className="block sm:col-span-2"><span className="mb-1 block text-sm font-medium text-ink">{t('message')}</span>
                <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-md border border-rule bg-panel p-3 text-sm focus:outline-none focus-visible:border-indigo" /></label>
              {error && <p className="rounded-sm bg-seal-wash px-3 py-2 text-sm text-seal-ink sm:col-span-2" role="alert">{error}</p>}
              <div className="sm:col-span-2"><button disabled={busy} className="btn btn-primary disabled:opacity-60">{busy ? t('sending') : t('send')}</button></div>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          <div className="panel p-4">
            <h2 className="eyebrow mb-2">{t('otherWays')}</h2>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li><Link href="/remove-company" className="link">{t('removeMyCompany')}</Link></li>
              <li><Link href="/get-listed" className="link">{t('getListedLink')}</Link></li>
              <li><Link href="/saas" className="link">{t('dataHubLink')}</Link></li>
            </ul>
          </div>
          <div className="panel p-4 text-sm text-ink-soft">
            <h2 className="eyebrow mb-2">{t('responseTimes')}</h2>
            <p>{t('responseTimesBody')}<br />{t('responseTimesBilling')}<br />{t('responseTimesRemoval')}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
