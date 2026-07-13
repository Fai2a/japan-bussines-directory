import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

/** GET /api/questions?businessId= — a business's Q&A thread, newest first. */
export async function GET(req: Request) {
  const businessId = Number(new URL(req.url).searchParams.get('businessId'));
  if (!businessId) return NextResponse.json({ error: 'businessId required.' }, { status: 400 });

  const questions = await db.question.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { name: true } }, answers: { orderBy: { createdAt: 'asc' }, include: { author: { select: { name: true } } } } },
    take: 30,
  });

  return NextResponse.json({
    questions: questions.map((q) => ({
      id: q.id,
      text: q.text,
      author: q.author?.name ?? 'Anonymous',
      createdAt: q.createdAt.toISOString(),
      answers: q.answers.map((a) => ({
        id: a.id, text: a.text, author: a.author?.name ?? 'Anonymous', isOwner: a.isOwner, createdAt: a.createdAt.toISOString(),
      })),
    })),
  });
}

/** POST /api/questions — ask a question. Body: { businessId, text } (auth required). */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in to ask a question.' }, { status: 401 });

  let body: { businessId?: number; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const businessId = Number(body.businessId);
  const text = body.text?.trim();
  if (!businessId) return NextResponse.json({ error: 'businessId required.' }, { status: 400 });
  if (!text || text.length < 5) return NextResponse.json({ error: 'Question must be at least 5 characters.' }, { status: 400 });

  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });

  const q = await db.question.create({ data: { businessId, authorId: session.user.id, text } });
  return NextResponse.json({ ok: true, id: q.id });
}
