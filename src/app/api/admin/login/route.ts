import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticate } from '@/lib/users';
import { ADMIN_COOKIE, SESSION_MAX_AGE_S, mintAdminSession } from '@/lib/adminAuth';
import { allow, peek } from '@/lib/throttle';
import { clientIp } from '@/lib/requestContext';

export const runtime = 'nodejs';

/**
 * Username + password login for the admin dashboard. Credentials are checked
 * against the DynamoDB users table (with an ADMIN_PASSWORD break-glass fallback).
 * On success it sets an httpOnly cookie holding the stats token, which the
 * protected admin APIs also accept.
 */
/**
 * How many wrong answers an address or an account gets before it waits.
 *
 * There was no limit at all, and the three accounts are named in the
 * deployment notes, so the whole dashboard stood behind a password that could
 * be guessed at whatever rate the server would answer. Ten in fifteen minutes
 * is generous for a person who has forgotten which password they used and
 * useless to anything working through a list.
 */
const TRIES = 10;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const { username, password } = (await request.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };

  const name = (username || '').trim().toLowerCase();
  const ip = clientIp(request.headers) || 'unknown';
  const byIp = `admin-login:ip:${ip}`;
  // Scoped to the caller as well as the account. Keyed on the submitted
  // username alone, this was a denial of service with no password required:
  // ten wrong guesses at a named account, from anywhere, and the person who
  // owns it could not sign in for fifteen minutes. An attacker now only ever
  // exhausts their own budget.
  const byUser = `admin-login:ip-user:${ip}:${name}`;

  // Checked before the password is, so a locked out caller cannot keep spending
  // scrypt work, and answered the same way as a wrong password so it discloses
  // nothing about which accounts exist.
  if (!peek(byIp, TRIES) || (name && !peek(byUser, TRIES))) {
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Wait fifteen minutes and try again.' },
      { status: 429 }
    );
  }

  if (!name || !password || !(await authenticate(name, password))) {
    // Only failures are counted, so a working password is never rationed.
    allow(byIp, TRIES, WINDOW_MS);
    if (name) allow(byUser, TRIES, WINDOW_MS);
    return NextResponse.json({ ok: false, error: 'Invalid username or password' }, { status: 401 });
  }

  const session = mintAdminSession(name);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'Sessions are not configured on this server.' },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ ok: true, username: name });
  const secure = request.nextUrl.protocol === 'https:';
  response.cookies.set(ADMIN_COOKIE, session, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_S
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
  return response;
}
