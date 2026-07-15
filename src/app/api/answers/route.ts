import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { sendEmail, emailShell } from '@/lib/server/email';

/** POST /api/answers — answer a question. Body: { questionId, text } (auth required). */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in to answer.' }, { status: 401 });

  let body: { questionId?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const text = body.text?.trim();
  if (!body.questionId) return NextResponse.json({ error: 'questionId required.' }, { status: 400 });
  if (!text || text.length < 2) return NextResponse.json({ error: 'Answer is too short.' }, { status: 400 });

  const question = await db.question.findUnique({
    where: { id: body.questionId },
    include: {
      business: { select: { ownerId: true, name: true } },
      author: { select: { id: true, email: true, prefAnswers: true } },
    },
  });
  if (!question) return NextResponse.json({ error: 'Question not found.' }, { status: 404 });

  const isOwner = question.business.ownerId === session.user.id;
  const answer = await db.answer.create({
    data: { questionId: question.id, authorId: session.user.id, text, isOwner },
  });

  if (question.author?.email && question.author.prefAnswers && question.author.id !== session.user.id) {
    await sendEmail({
      to: question.author.email,
      subject: `Your question about ${question.business.name} was answered`,
      html: emailShell(
        'You got an answer',
        `<p>Someone answered your question about <strong>${question.business.name}</strong>:</p><p style="padding:12px;background:#F4F3EE;border-radius:6px;">${text}</p>`,
      ),
    });
  }

  return NextResponse.json({ ok: true, id: answer.id });
}
