'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

interface ApiKeyRow {
  id: string;
  label: string;
  keyPrefix: string;
  rateLimit: number;
  requestCount: number;
  windowStart: string;
  createdAt: string;
  revokedAt: string | null;
}

export function ApiKeysPanel() {
  const t = useTranslations('apiKeys');
  const { data: session, status } = useSession();
  const [keys, setKeys] = useState<ApiKeyRow[] | null>(null);
  const [label, setLabel] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refetch = () => {
    fetch('/api/account/api-keys')
      .then((r) => (r.ok ? r.json() : { keys: [] }))
      .then((d: { keys: ApiKeyRow[] }) => setKeys(d.keys))
      .catch(() => setKeys([]));
  };

  useEffect(() => {
    if (session?.user) refetch();
  }, [session?.user]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || busy) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/account/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: label.trim() }),
    });
    const data = (await res.json().catch(() => null)) as { key?: string; error?: string } | null;
    setBusy(false);
    if (!res.ok || !data?.key) {
      setError(data?.error ?? t('createError'));
      return;
    }
    setNewKey(data.key);
    setLabel('');
    refetch();
  }

  async function revoke(id: string) {
    await fetch(`/api/account/api-keys/${id}`, { method: 'DELETE' });
    refetch();
  }

  if (status === 'loading') return null;
  if (!session?.user) {
    return (
      <div className="panel p-4">
        <p className="eyebrow mb-1">{t('title')}</p>
        <p className="text-sm text-meta">{t('signInToManage')}</p>
      </div>
    );
  }

  const active = (keys ?? []).filter((k) => !k.revokedAt);

  return (
    <div className="panel p-4">
      <p className="eyebrow mb-1">{t('title')}</p>
      <p className="mb-3 text-sm text-meta">{t('intro')}</p>

      {newKey && (
        <div className="mb-3 rounded-md border border-ok/40 bg-ok/5 p-3">
          <p className="text-sm font-semibold text-ok">{t('newKeyTitle')}</p>
          <code className="mt-1 block break-all rounded-sm bg-ink px-2 py-1.5 font-mono text-xs text-paper">{newKey}</code>
          <p className="mt-1.5 text-xs text-meta">{t('newKeyWarning')}</p>
          <button type="button" onClick={() => setNewKey(null)} className="mt-2 text-xs font-semibold text-indigo hover:underline">{t('dismiss')}</button>
        </div>
      )}

      {keys === null ? (
        <div className="skeleton h-10 rounded-md" />
      ) : keys.length === 0 ? (
        <p className="mb-3 text-sm text-meta">{t('noKeys')}</p>
      ) : (
        <ul className="mb-3 divide-y divide-rule text-sm">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{k.label} <code className="font-mono text-xs text-meta">{k.keyPrefix}…</code></p>
                <p className="text-xs text-meta">
                  {k.revokedAt ? t('revoked') : t('usage', { used: k.requestCount, limit: k.rateLimit })}
                </p>
              </div>
              {!k.revokedAt && (
                <button type="button" onClick={() => revoke(k.id)} className="btn btn-secondary shrink-0 px-2.5 py-1 text-xs">{t('revoke')}</button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={create} className="flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t('labelPlaceholder')}
          disabled={active.length >= 3}
          className="min-w-0 flex-1 rounded-sm border border-rule bg-panel px-2 py-1.5 text-sm focus:outline-none focus-visible:border-indigo disabled:opacity-50"
        />
        <button type="submit" disabled={!label.trim() || busy || active.length >= 3} className="btn btn-primary shrink-0 px-3 py-1.5 text-sm disabled:opacity-50">
          {busy ? t('creating') : t('generate')}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-seal-ink">{error}</p>}
      <p className="mt-2 text-2xs text-meta">{t('docsNote')}</p>
    </div>
  );
}
