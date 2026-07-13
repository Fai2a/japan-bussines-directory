'use client';

import { useState } from 'react';
import type { Role } from '@/lib/useAuth';
import { useAuth } from '@/lib/useAuth';

const DEMO_ACCOUNTS: Record<Role, { email: string; label: string }> = {
  user: { email: 'user@demo.jp', label: 'Demo user' },
  owner: { email: 'owner@demo.jp', label: 'Demo owner' },
  admin: { email: 'admin@demo.jp', label: 'Demo admin' },
};

/**
 * Real sign-in against the database (Auth.js credentials + /api/register).
 * Demo accounts (password123) are seeded so each role's experience can be
 * previewed instantly.
 */
export function SignInCard({
  heading = 'Sign in to NihonPages',
  intro = 'Save favorites, write reviews, and manage your listings.',
  defaultRole = 'user',
}: {
  heading?: string;
  intro?: string;
  defaultRole?: Role;
  lockRole?: boolean;
}) {
  const { signInWithPassword, register } = useAuth();
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [asOwner, setAsOwner] = useState(defaultRole === 'owner');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const err =
      mode === 'signin'
        ? await signInWithPassword(email.trim(), password)
        : await register(name.trim(), email.trim(), password, asOwner);
    setBusy(false);
    if (err) setError(err);
  }

  async function demo(role: Role) {
    setError('');
    setBusy(true);
    const err = await signInWithPassword(DEMO_ACCOUNTS[role].email, 'password123');
    setBusy(false);
    if (err) setError('Demo accounts missing — run `npm run seed` first.');
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="panel p-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{heading}</h1>
        <p className="mt-1 text-sm text-ink-soft">{intro}</p>

        {/* Mode toggle */}
        <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-sm border border-rule text-sm font-semibold">
          {(['signin', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(''); }}
              aria-pressed={mode === m}
              className={`py-2 transition-colors ${mode === m ? 'bg-ink text-paper' : 'bg-panel text-ink-soft hover:bg-[#f1f0ea]'}`}
            >
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          {mode === 'register' && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" />
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.jp" className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Password</span>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" />
          </label>
          {mode === 'register' && (
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={asOwner} onChange={(e) => setAsOwner(e.target.checked)} />
              I’m a business owner (I’ll manage a listing)
            </label>
          )}

          {error && <p className="rounded-sm bg-seal-wash px-3 py-2 text-sm text-seal-ink" role="alert">{error}</p>}

          <button type="submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
            {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="mt-5 border-t border-rule pt-4">
          <p className="eyebrow mb-2">Try a demo account</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(DEMO_ACCOUNTS) as Role[]).map((r) => (
              <button key={r} type="button" onClick={() => demo(r)} disabled={busy} className="btn btn-secondary py-1.5 text-xs disabled:opacity-60">
                {DEMO_ACCOUNTS[r].label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-2xs text-meta">Seeded accounts (password123) — instant preview of each role.</p>
        </div>
      </div>
    </div>
  );
}
