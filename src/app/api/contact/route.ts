import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { sendEmail, emailShell } from '@/lib/server/email';

/**
 * POST /api/contact — general support form submission.
 * Body: { name, email, topic, message, website? (honeypot) }
 */
export async function POST(req: Request) {
  let body: { name?: string; email?: string; topic?: string; message?: string; website?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (body.website) return NextResponse.json({ ok: true }); // honeypot

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const topic = body.topic?.trim() || 'General question';
  const message = body.message?.trim();

  if (!name) return NextResponse.json({ error: 'Your name is required.' }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (!message || message.length < 10)
    return NextResponse.json({ error: 'Tell us a bit more (at least 10 characters).' }, { status: 400 });

  await db.contactMessage.create({ data: { name, email, topic, message } });

  await sendEmail({
    to: email,
    subject: 'We got your message — NihonPages',
    html: emailShell(
      'Thanks for reaching out',
      `<p>Hi ${name}, we received your message about <strong>${topic}</strong> and will reply within one business day.</p>
       <p style="margin-top:16px;padding:12px;background:#F4F3EE;border-radius:4px;color:#41454B;">${message}</p>`,
    ),
  });

  return NextResponse.json({ ok: true });
}
