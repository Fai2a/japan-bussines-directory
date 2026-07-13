'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { shortDate } from '@/lib/format';

interface Answer { id: string; text: string; author: string; isOwner: boolean; createdAt: string }
interface Question { id: string; text: string; author: string; createdAt: string; answers: Answer[] }

export function QASection({ businessId, businessName }: { businessId: number; businessName: string }) {
  const { data: session } = useSession();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const res = await fetch(`/api/questions?businessId=${businessId}`);
    if (res.ok) setQuestions((await res.json()).questions);
  }
  useEffect(() => { void load(); }, [businessId]);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, text: draft.trim() }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(d?.error ?? 'Could not post your question.');
      return;
    }
    setDraft('');
    void load();
  }

  return (
    <section>
      <h2 className="mb-2 font-display text-xl font-bold text-ink">Questions & answers</h2>
      <p className="text-sm text-ink-soft">Ask the owner or the community a question about {businessName}.</p>

      <form onSubmit={ask} className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={session?.user ? 'e.g. Do you take reservations?' : 'Sign in to ask a question'}
          className="flex-1 rounded-md border border-rule bg-panel px-3 py-2 text-sm focus:outline-none focus-visible:border-indigo"
        />
        <button type="submit" disabled={busy} className="btn btn-secondary disabled:opacity-60">{busy ? 'Posting…' : 'Ask'}</button>
      </form>
      {error && <p className="mt-2 text-sm text-seal">{error}{error.startsWith('Sign in') && <> <a href="/account" className="font-semibold underline">Sign in</a></>}</p>}

      <div className="mt-4 space-y-3">
        {questions === null ? (
          <div className="skeleton h-16 rounded-md" />
        ) : questions.length === 0 ? (
          <p className="text-sm text-meta">No questions yet — be the first to ask.</p>
        ) : (
          questions.map((q) => <QAItem key={q.id} q={q} onAnswered={load} />)
        )}
      </div>
    </section>
  );
}

function QAItem({ q, onAnswered }: { q: Question; onAnswered: () => void }) {
  const { data: session } = useSession();
  const [answering, setAnswering] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    const res = await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: q.id, text: text.trim() }),
    });
    setBusy(false);
    if (res.ok) { setText(''); setAnswering(false); onAnswered(); }
  }

  return (
    <div className="panel p-4">
      <p className="text-sm font-semibold text-ink">Q: {q.text}</p>
      <p className="text-xs text-meta">{q.author} · {shortDate(q.createdAt)}</p>
      {q.answers.map((a) => (
        <div key={a.id} className={`mt-2 rounded-md p-3 text-sm ${a.isOwner ? 'border-l-2 border-indigo bg-indigo-wash/50' : 'bg-[#f4f3ee]'}`}>
          <p className="font-medium text-ink">{a.isOwner ? 'Owner' : a.author}<span className="ml-2 text-2xs font-normal text-meta">{shortDate(a.createdAt)}</span></p>
          <p className="mt-0.5 text-ink-soft">{a.text}</p>
        </div>
      ))}
      {answering ? (
        <form onSubmit={submit} className="mt-2 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Your answer…" autoFocus className="flex-1 rounded-md border border-rule bg-panel px-3 py-1.5 text-sm focus:outline-none focus-visible:border-indigo" />
          <button type="submit" disabled={busy} className="btn btn-secondary py-1.5 text-sm disabled:opacity-60">{busy ? '…' : 'Post'}</button>
        </form>
      ) : (
        session?.user && <button onClick={() => setAnswering(true)} className="mt-2 text-xs font-semibold text-indigo hover:underline">Answer this</button>
      )}
    </div>
  );
}
