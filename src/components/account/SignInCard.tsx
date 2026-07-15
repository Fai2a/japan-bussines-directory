'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Role } from '@/lib/useAuth';
import { useAuth } from '@/lib/useAuth';

/**
 * Real sign-in against the database (Auth.js credentials + /api/register).
 * Demo accounts (password123) are seeded so each role's experience can be
 * previewed instantly.
 */
export function SignInCard({
  heading,
  intro,
  defaultRole = 'user',
}: {
  heading?: string;
  intro?: string;
  defaultRole?: Role;
  lockRole?: boolean;
}) {
  const t = useTranslations('signIn');
  const DEMO_ACCOUNTS: Record<Role, { email: string; label: string }> = {
    user: { email: 'user@demo.jp', label: t('demoUser') },
    owner: { email: 'owner@demo.jp', label: t('demoOwner') },
    admin: { email: 'admin@demo.jp', label: t('demoAdmin') },
  };
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
    if (err) setError(t('demoMissing'));
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="panel p-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{heading ?? t('defaultHeading')}</h1>
        <p className="mt-1 text-sm text-ink-soft">{intro ?? t('defaultIntro')}</p>

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
              {m === 'signin' ? t('signIn') : t('createAccount')}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          {mode === 'register' && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">{t('name')}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('namePlaceholder')} className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" />
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">{t('email')}</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.jp" className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">{t('password')}</span>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'register' ? t('passwordMinPlaceholder') : t('passwordPlaceholder')} className="w-full rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo" />
          </label>
          {mode === 'register' && (
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={asOwner} onChange={(e) => setAsOwner(e.target.checked)} />
              {t('imOwner')}
            </label>
          )}

          {error && <p className="rounded-sm bg-seal-wash px-3 py-2 text-sm text-seal-ink" role="alert">{error}</p>}

          <button type="submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
            {busy ? t('working') : mode === 'signin' ? t('signIn') : t('createAccount')}
          </button>
        </form>

        <div className="mt-5 border-t border-rule pt-4">
          <p className="eyebrow mb-2">{t('tryDemoAccount')}</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(DEMO_ACCOUNTS) as Role[]).map((r) => (
              <button key={r} type="button" onClick={() => demo(r)} disabled={busy} className="btn btn-secondary py-1.5 text-xs disabled:opacity-60">
                {DEMO_ACCOUNTS[r].label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-2xs text-meta">{t('demoAccountsNote')}</p>
        </div>
      </div>
    </div>
  );
}
