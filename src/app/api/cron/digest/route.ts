import { NextResponse } from 'next/server';
import { runWeeklyDigest } from '@/lib/server/digest';

/**
 * GET /api/cron/digest — triggered by Vercel Cron (see vercel.json). Vercel
 * automatically sends `Authorization: Bearer $CRON_SECRET` when that env var
 * is set; without one configured, the route stays open (fine for local
 * testing, never for a real deployment).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const result = await runWeeklyDigest();
  return NextResponse.json({ ok: true, ...result });
}
