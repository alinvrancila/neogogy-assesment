import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticate } from '@/lib/users';
import { ADMIN_COOKIE } from '@/lib/adminAuth';

export const runtime = 'nodejs';

/**
 * Username + password login for the admin dashboard. Credentials are checked
 * against the DynamoDB users table (with an ADMIN_PASSWORD break-glass fallback).
 * On success it sets an httpOnly cookie holding the stats token, which the
 * protected admin APIs also accept.
 */
export async function POST(request: NextRequest) {
  const { username, password } = (await request.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };
  const token = process.env.STATS_TOKEN || '';

  const name = (username || '').trim().toLowerCase();
  if (!name || !password || !(await authenticate(name, password))) {
    return NextResponse.json({ ok: false, error: 'Invalid username or password' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, username: name });
  const secure = request.nextUrl.protocol === 'https:';
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8
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
