import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';

// Auth.js (NextAuth v4) — credentials against the Prisma User table, JWT
// sessions carrying the DB role. Google OAuth slots in here later by adding
// GoogleProvider with client id/secret env vars.
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/account' },
  providers: [
    CredentialsProvider({
      name: 'Email & password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await db.user.findUnique({ where: { email: credentials.email.toLowerCase() } });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? 'USER';
        token.uid = (user as { id?: string }).id;
      }
      // Re-read the role from the DB on demand (e.g. after a claim promotes
      // USER -> OWNER) so the client can refresh without a full re-login.
      if (trigger === 'update' && token.uid) {
        const fresh = await db.user.findUnique({ where: { id: token.uid as string }, select: { role: true } });
        if (fresh) token.role = fresh.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as string) ?? 'USER';
        session.user.id = token.uid as string;
      }
      return session;
    },
  },
};
