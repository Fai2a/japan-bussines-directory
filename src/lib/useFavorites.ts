'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

// ---------------------------------------------------------------------------
// Favorites. Guests: localStorage. Signed-in users: the Favorite table via
// /api/favorites — and guest saves are merged into the account once on
// sign-in, so nothing is lost by authenticating. All components + tabs stay
// in sync through a window event.
// ---------------------------------------------------------------------------

const KEY = 'np_favorites_v1';
const MERGED_KEY = 'np_favorites_merged_v1';
const EVENT = 'np:favorites';

function readLocal(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(ids: number[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {}
}

function broadcast(ids: number[]) {
  try {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: ids }));
  } catch {}
}

export function useFavorites() {
  const { data: session, status } = useSession();
  const authed = Boolean(session?.user);
  const [ids, setIds] = useState<number[]>([]);
  const [ready, setReady] = useState(false);
  const merged = useRef(false);

  // Initial load + cross-component sync.
  useEffect(() => {
    const sync = (e: Event) => {
      const detail = (e as CustomEvent<number[]>).detail;
      setIds(detail ?? readLocal());
    };
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', () => setIds(readLocal()));
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  useEffect(() => {
    if (status === 'loading') return;

    if (!authed) {
      setIds(readLocal());
      setReady(true);
      return;
    }

    // Signed in: merge guest favorites once, then load from the server.
    (async () => {
      try {
        const local = readLocal();
        const alreadyMerged = localStorage.getItem(MERGED_KEY) === session!.user.id;
        let serverIds: number[];
        if (local.length > 0 && !alreadyMerged && !merged.current) {
          merged.current = true;
          const res = await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ merge: local }),
          });
          serverIds = res.ok ? ((await res.json()).ids as number[]) : local;
          try { localStorage.setItem(MERGED_KEY, session!.user.id); } catch {}
        } else {
          const res = await fetch('/api/favorites');
          serverIds = res.ok ? ((await res.json()).ids as number[]) : readLocal();
        }
        writeLocal(serverIds); // keep the offline (PWA) copy current
        setIds(serverIds);
        broadcast(serverIds);
      } catch {
        setIds(readLocal());
      } finally {
        setReady(true);
      }
    })();
  }, [authed, status, session]);

  const toggle = useCallback(
    (id: number) => {
      // Optimistic update everywhere, then persist.
      const cur = readLocal();
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      writeLocal(next);
      setIds(next);
      broadcast(next);
      if (authed) {
        void fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId: id }),
        }).catch(() => {});
      }
    },
    [authed],
  );

  const remove = useCallback((id: number) => toggle(id), [toggle]);
  const has = useCallback((id: number) => ids.includes(id), [ids]);

  return { ids, has, toggle, remove, ready, count: ids.length };
}
