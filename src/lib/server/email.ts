import 'server-only';
import { db } from './db';

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends a transactional email via Resend when RESEND_API_KEY is configured.
 * Without a key, the email is written to EmailLog instead of a real inbox —
 * the whole feature stays inspectable and testable without a live provider,
 * the same fallback pattern used for Stripe in src/app/api/checkout/route.ts.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    await db.emailLog.create({ data: { to, subject, body: html, provider: 'console', status: 'SENT' } });
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'NihonPages <notifications@nihonpages.example.jp>',
        to,
        subject,
        html,
      }),
    });
    await db.emailLog.create({
      data: { to, subject, body: html, provider: 'resend', status: res.ok ? 'SENT' : 'FAILED' },
    });
  } catch {
    await db.emailLog.create({ data: { to, subject, body: html, provider: 'resend', status: 'FAILED' } });
  }
}

/** Shared wrapper so every transactional email looks and reads the same way. */
export function emailShell(title: string, bodyHtml: string): string {
  return `
    <div style="font-family:-apple-system,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;color:#1A1C1E;">
      <div style="padding:20px 0;border-bottom:2px solid #C0392B;">
        <span style="font-weight:800;font-size:18px;">Nihon<span style="color:#C0392B;">Pages</span></span>
      </div>
      <h1 style="font-size:20px;margin:24px 0 8px;">${title}</h1>
      <div style="font-size:14px;line-height:1.6;color:#41454B;">${bodyHtml}</div>
      <p style="margin-top:32px;font-size:12px;color:#8A8B85;">NihonPages · Japan's local business directory</p>
    </div>
  `;
}
