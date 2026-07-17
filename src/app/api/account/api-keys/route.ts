import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { generateApiKey, MAX_ACTIVE_KEYS_PER_USER } from '@/lib/server/apiKey';

/** GET /api/account/api-keys — the signed-in user's own keys (never returns the raw secret). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const keys = await db.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    keys: keys.map((k) => ({
      id: k.id,
      label: k.label,
      keyPrefix: k.keyPrefix,
      rateLimit: k.rateLimit,
      requestCount: k.requestCount,
      windowStart: k.windowStart.toISOString(),
      createdAt: k.createdAt.toISOString(),
      revokedAt: k.revokedAt?.toISOString() ?? null,
    })),
  });
}

/** POST /api/account/api-keys — create a new key. Body: { label }. Returns the raw key once. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  let body: { label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const label = body.label?.trim();
  if (!label) return NextResponse.json({ error: 'label required.' }, { status: 400 });

  const activeCount = await db.apiKey.count({ where: { userId: session.user.id, revokedAt: null } });
  if (activeCount >= MAX_ACTIVE_KEYS_PER_USER)
    return NextResponse.json({ error: `You can have at most ${MAX_ACTIVE_KEYS_PER_USER} active keys. Revoke one first.` }, { status: 409 });

  const { raw, hash, prefix } = generateApiKey();
  const key = await db.apiKey.create({
    data: { userId: session.user.id, keyHash: hash, keyPrefix: prefix, label },
  });

  return NextResponse.json({ ok: true, id: key.id, key: raw });
}
