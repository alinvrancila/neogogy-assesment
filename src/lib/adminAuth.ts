import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';

/**
 * The admin session.
 *
 * This used to set the cookie to STATS_TOKEN and accept exactly that value
 * back. Three things were wrong with it, and all three mattered because the
 * dashboard behind it holds every respondent's name, address, phone, location
 * and answers.
 *
 * The stats token also travels in a query string, as `/api/stats?token=...`, so
 * anything that logs a URL logged a working admin session. The value never
 * changed, so a session could not be ended, and one leak was permanent. And it
 * was shared by everyone, so a session could not be attributed to a person.
 *
 * A session is now a signed statement that a named user logged in at a given
 * moment, good for a fixed period and no longer. It is still stateless, which
 * keeps the deployment as simple as it was, but it expires on its own, it names
 * who it belongs to, and it is not the same secret as anything else.
 *
 * Rotating ADMIN_SESSION_SECRET signs everyone out, which is the control that
 * was missing entirely.
 */

export const ADMIN_COOKIE = 'neogogy_admin';

/** Eight hours, the same working day the cookie was already set for. */
export const SESSION_MAX_AGE_S = 8 * 60 * 60;

const secret = (): string =>
  process.env.ADMIN_SESSION_SECRET
  // Falls back so an existing deployment keeps working without new
  // configuration. Set ADMIN_SESSION_SECRET to separate the two.
  || process.env.STATS_TOKEN
  || '';

const sign = (payload: string, key: string) =>
  createHmac('sha256', key).update(payload).digest('base64url');

/** A session for one user, valid from now. */
export function mintAdminSession(username: string, now = Date.now()): string {
  const key = secret();
  if (!key) return '';
  // A nonce, so two logins by the same person in the same second are still
  // different sessions.
  const payload = [
    Buffer.from(username).toString('base64url'),
    String(Math.floor(now / 1000) + SESSION_MAX_AGE_S),
    randomBytes(9).toString('base64url'),
  ].join('.');
  return `${payload}.${sign(payload, key)}`;
}

/** The user a valid session belongs to, or null. */
export function readAdminSession(value: string | undefined, now = Date.now()): string | null {
  const key = secret();
  if (!key || !value) return null;

  const parts = value.split('.');
  if (parts.length !== 4) return null;
  const payload = parts.slice(0, 3).join('.');

  const expected = Buffer.from(sign(payload, key));
  const given = Buffer.from(parts[3]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt * 1000 <= now) return null;

  try {
    return Buffer.from(parts[0], 'base64url').toString('utf-8') || null;
  } catch {
    return null;
  }
}

/** True when the request carries a session that has not expired. */
export const isAdminAuthed = (request: NextRequest): boolean =>
  readAdminSession(request.cookies.get(ADMIN_COOKIE)?.value) !== null;

/** Who the request is, for an audit line. Null when it is not signed in. */
export const adminUser = (request: NextRequest): string | null =>
  readAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
