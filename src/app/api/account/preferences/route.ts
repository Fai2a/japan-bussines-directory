import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

const PREF_FIELDS = ['digest', 'replies', 'answers', 'product'] as const;
type PrefId = (typeof PREF_FIELDS)[number];

function toDbField(id: PrefId): 'prefDigest' | 'prefReplies' | 'prefAnswers' | 'prefProduct' {
  return `pref${id[0].toUpperCase()}${id.slice(1)}` as 'prefDigest' | 'prefReplies' | 'prefAnswers' | 'prefProduct';
}

/** GET /api/account/preferences — the signed-in user's notification preferences. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { prefDigest: true, prefReplies: true, prefAnswers: true, prefProduct: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  return NextResponse.json({
    digest: user.prefDigest,
    replies: user.prefReplies,
    answers: user.prefAnswers,
    product: user.prefProduct,
  });
}

/** PATCH /api/account/preferences — toggle one preference. Body: { id, value }. */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  let body: { id?: string; value?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!body.id || !PREF_FIELDS.includes(body.id as PrefId) || typeof body.value !== 'boolean') {
    return NextResponse.json({ error: 'id (digest|replies|answers|product) and boolean value required.' }, { status: 400 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { [toDbField(body.id as PrefId)]: body.value },
  });
  return NextResponse.json({ ok: true });
}
