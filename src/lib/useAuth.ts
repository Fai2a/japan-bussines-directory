'use client';

import { useCallback } from 'react';
import { useSession, signIn as nextSignIn, signOut as nextSignOut } from 'next-auth/react';

// ---------------------------------------------------------------------------
// Real auth, backed by Auth.js JWT sessions over the Prisma User table.
// Exposes the same shape the account / dashboard / admin pages have always
// consumed, so swapping the mock for the real thing touched no page code.
// ---------------------------------------------------------------------------

export type Role = 'user' | 'owner' | 'admin';

export interface AuthUser {
  name: string;
  email: string;
  role: Role;
}

function toRole(dbRole?: string | null): Role {
  switch (dbRole) {
    case 'ADMIN':
    case 'MODERATOR':
      return 'admin';
    case 'OWNER':
      return 'owner';
    default:
      return 'user';
  }
}

export function useAuth() {
  const { data: session, status } = useSession();

  const user: AuthUser | null = session?.user
    ? {
        name: session.user.name ?? session.user.email ?? 'Account',
        email: session.user.email ?? '',
        role: toRole(session.user.role),
      }
    : null;

  /** Credentials sign-in. Returns an error message, or null on success. */
  const signInWithPassword = useCallback(async (email: string, password: string): Promise<string | null> => {
    const res = await nextSignIn('credentials', { email, password, redirect: false });
    if (res?.error) return 'Wrong email or password.';
    return null;
  }, []);

  /** Register then sign in. Returns an error message, or null on success. */
  const register = useCallback(
    async (name: string, email: string, password: string, asOwner: boolean): Promise<string | null> => {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: asOwner ? 'OWNER' : 'USER' }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        return data?.error ?? 'Could not create the account. Try again.';
      }
      return signInWithPassword(email, password);
    },
    [signInWithPassword],
  );

  const signOut = useCallback(() => {
    void nextSignOut({ redirect: false });
  }, []);

  return {
    user,
    ready: status !== 'loading',
    signInWithPassword,
    register,
    signOut,
  };
}
