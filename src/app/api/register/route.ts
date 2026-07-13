import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/server/db';

/**
 * POST /api/register — create a user account.
 * Body: { name, email, password, role? ("USER" | "OWNER") }
 * Owners self-select at signup (they're claiming/creating a listing);
 * ADMIN can never be self-assigned.
 */
export async function POST(req: Request) {
  let body: { name?: string; email?: string; password?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';
  const role = body.role === 'OWNER' ? 'OWNER' : 'USER';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

  const existing = await db.user.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json({ error: 'An account with this email already exists. Sign in instead.' }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.create({ data: { email, name: name || email.split('@')[0], passwordHash, role } });

  return NextResponse.json({ ok: true });
}
