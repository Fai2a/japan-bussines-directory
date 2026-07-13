import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const DOCS: Record<string, { title: string; updated: string; body: { h: string; p: string }[] }> = {
  'terms-of-use': {
    title: 'Terms of Use',
    updated: 'July 1, 2026',
    body: [
      { h: 'Acceptance', p: 'By accessing NihonPages you agree to these Terms of Use. If you do not agree, please do not use the service.' },
      { h: 'Directory content', p: 'Listings are compiled from public sources and owner submissions. We strive for accuracy but do not guarantee that every detail is current. Report corrections at any time.' },
      { h: 'Acceptable use', p: 'You may not scrape the directory in bulk, submit false listings or reviews, or use the service to harass any business or person.' },
      { h: 'Reviews', p: 'Reviews must reflect genuine experiences. We moderate submissions and remove content that violates our guidelines.' },
    ],
  },
  'terms-of-service': {
    title: 'Terms of Service',
    updated: 'July 1, 2026',
    body: [
      { h: 'Paid listings', p: 'Basic and Lifetime plans are one-time purchases; Premium is billed annually. Prices shown include the current promotion where applicable.' },
      { h: 'Refunds', p: 'Because listings are reviewed and published by a person, refunds are handled case-by-case within 14 days of purchase for listings not yet published.' },
      { h: 'Data Hub subscriptions', p: 'Data Hub plans are billed monthly and may be cancelled at any time; access continues to the end of the paid period. Export quotas reset monthly.' },
      { h: 'Termination', p: 'We may suspend accounts that violate these terms. You may close your account at any time from your dashboard.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'July 1, 2026',
    body: [
      { h: 'What we collect', p: 'Account details you provide, listings you manage, and — only with your consent — analytics about how you use the site.' },
      { h: 'How we use it', p: 'To operate the directory, process payments, prevent abuse, and (if you opt in) improve the product. We do not sell personal data.' },
      { h: 'Your choices', p: 'You can access, correct, or delete your personal data, and withdraw analytics consent, from your account settings or by contacting support.' },
      { h: 'Business data', p: 'Company information shown in listings is treated as business directory data. Owners can claim, edit, or request removal of their listing.' },
    ],
  },
  cookies: {
    title: 'Cookies Policy',
    updated: 'July 1, 2026',
    body: [
      { h: 'Essential cookies', p: 'Required for sign-in and core functionality. These are always on and cannot be disabled.' },
      { h: 'Optional analytics', p: 'Help us understand usage. These stay off unless you accept them in the cookie banner — the default is to decline.' },
      { h: 'Managing cookies', p: 'You can change your choice at any time via the cookie banner or your browser settings. Clearing cookies resets your preference.' },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const doc = DOCS[params.slug];
  return doc ? { title: doc.title } : {};
}

export default function LegalPage({ params }: { params: { slug: string } }) {
  const doc = DOCS[params.slug];
  if (!doc) notFound();

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: doc.title }]} />
      <article className="mx-auto mt-6 max-w-prose">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">{doc.title}</h1>
        <p className="mt-1 text-sm text-meta">Last updated {doc.updated}</p>
        <div className="mt-8 space-y-7">
          {doc.body.map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-lg font-bold text-ink">{s.h}</h2>
              <p className="mt-1.5 text-ink-soft">{s.p}</p>
            </section>
          ))}
        </div>
        <p className="mt-10 rounded-md border border-rule bg-[#f4f3ee] p-4 text-sm text-meta">
          This is a product template summarising typical directory terms. Before launch, have counsel review the full legal text for your jurisdiction.
        </p>
      </article>
    </div>
  );
}
