import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

/** DELETE /api/account/api-keys/:id — revoke a key you own. */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const key = await db.apiKey.findUnique({ where: { id: params.id } });
  if (!key || key.userId !== session.user.id) return NextResponse.json({ error: 'Key not found.' }, { status: 404 });

  await db.apiKey.update({ where: { id: params.id }, data: { revokedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
