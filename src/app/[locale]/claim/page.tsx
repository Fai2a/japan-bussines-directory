import { Suspense } from 'react';
import { ClaimClient } from './ClaimClient';

export const metadata = { title: 'Claim a listing' };

export default function ClaimPage() {
  return (
    <Suspense fallback={<div className="shell py-16"><div className="skeleton mx-auto h-64 max-w-xl rounded-md" /></div>}>
      <ClaimClient />
    </Suspense>
  );
}
