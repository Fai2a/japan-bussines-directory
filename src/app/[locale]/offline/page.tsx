import { Link } from '@/i18n/navigation';

export const metadata = { title: 'Offline' };

export default function OfflinePage() {
  return (
    <div className="shell py-24 text-center">
      <p className="eyebrow">No connection</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">You’re offline</h1>
      <p className="mx-auto mt-2 max-w-sm text-ink-soft">
        Your saved favorites are still available. Reconnect to browse the full directory again.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/account" className="btn btn-primary">View saved favorites</Link>
        <Link href="/" className="btn btn-secondary">Try home</Link>
      </div>
    </div>
  );
}
