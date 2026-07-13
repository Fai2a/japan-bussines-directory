import { Suspense } from 'react';
import type { Metadata } from 'next';
import { GetListedClient } from './GetListedClient';

export const metadata: Metadata = {
  title: 'Get Listed — put your business on NihonPages',
  description: 'List your business on Japan’s local directory. Basic, Premium and Lifetime plans, 50% off during launch. Live after a quick human review.',
};

export default function GetListedPage() {
  return (
    <Suspense fallback={<div className="shell py-16 text-center text-meta">Loading…</div>}>
      <GetListedClient />
    </Suspense>
  );
}
