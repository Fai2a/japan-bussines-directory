import 'server-only';
import crypto from 'node:crypto';
import { db } from './db';

const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_ACTIVE_KEYS_PER_USER = 3;

function hashKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/** Generates a new raw API key + its storable hash/prefix. The raw value is shown to the user exactly once. */
export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `np_${crypto.randomBytes(24).toString('hex')}`;
  return { raw, hash: hashKey(raw), prefix: raw.slice(0, 10) };
}

export { MAX_ACTIVE_KEYS_PER_USER };

export type AuthResult =
  | { ok: true; apiKeyId: string; userId: string }
  | { ok: false; status: 401 | 429; error: string };

/**
 * Validates a Bearer API key from a public API request and enforces its
 * rolling-24h rate limit. On success, atomically increments the usage
 * counter (resetting the window if it has expired) before returning ok.
 */
export async function authenticateApiKey(req: Request): Promise<AuthResult> {
  const auth = req.headers.get('authorization') ?? '';
  const raw = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!raw) return { ok: false, status: 401, error: 'Missing Authorization: Bearer <key> header.' };

  const key = await db.apiKey.findUnique({ where: { keyHash: hashKey(raw) } });
  if (!key || key.revokedAt) return { ok: false, status: 401, error: 'Invalid or revoked API key.' };

  const now = new Date();
  const windowExpired = now.getTime() - key.windowStart.getTime() > WINDOW_MS;
  const nextCount = windowExpired ? 1 : key.requestCount + 1;

  if (!windowExpired && key.requestCount >= key.rateLimit) {
    return { ok: false, status: 429, error: `Rate limit exceeded (${key.rateLimit} requests / 24h). Try again later.` };
  }

  await db.apiKey.update({
    where: { id: key.id },
    data: windowExpired ? { requestCount: nextCount, windowStart: now } : { requestCount: nextCount },
  });

  return { ok: true, apiKeyId: key.id, userId: key.userId };
}
