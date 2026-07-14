import { Suspense } from 'react';
import { ReportClient } from './ReportClient';

export const metadata = { title: 'Report a problem' };

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="shell py-16"><div className="skeleton mx-auto h-64 max-w-xl rounded-md" /></div>}>
      <ReportClient />
    </Suspense>
  );
}
