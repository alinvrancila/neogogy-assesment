import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import { listUsers, upsertUser, deleteUser, getUser, usersEnabled } from '@/lib/users';

export const runtime = 'nodejs';

const guard = (request: NextRequest) => (isAdminAuthed(request) ? null : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// List users
export async function GET(request: NextRequest) {
  const denied = guard(request);
  if (denied) return denied;
  return NextResponse.json({ enabled: usersEnabled(), users: await listUsers() });
}

// Create a user
export async function POST(request: NextRequest) {
  const denied = guard(request);
  if (denied) return denied;
  const { username, password } = (await request.json().catch(() => ({}))) as { username?: string; password?: string };
  const name = (username || '').trim().toLowerCase();
  if (!isEmail(name)) {
    return NextResponse.json({ error: 'Username must be a valid email address.' }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }
  if (await getUser(name)) {
    return NextResponse.json({ error: 'That email already exists.' }, { status: 409 });
  }
  await upsertUser(name, password);
  return NextResponse.json({ ok: true });
}

// Update an existing user's password
export async function PUT(request: NextRequest) {
  const denied = guard(request);
  if (denied) return denied;
  const { username, password } = (await request.json().catch(() => ({}))) as { username?: string; password?: string };
  const name = (username || '').trim();
  if (!name || !password || password.length < 6) {
    return NextResponse.json({ error: 'Username required and password must be at least 6 characters.' }, { status: 400 });
  }
  if (!(await getUser(name))) {
    return NextResponse.json({ error: 'No such user.' }, { status: 404 });
  }
  await upsertUser(name, password);
  return NextResponse.json({ ok: true });
}

// Delete a user
export async function DELETE(request: NextRequest) {
  const denied = guard(request);
  if (denied) return denied;
  const name = (request.nextUrl.searchParams.get('username') || '').trim();
  if (!name) return NextResponse.json({ error: 'Username required.' }, { status: 400 });
  const remaining = await listUsers();
  if (remaining.length <= 1 && remaining[0]?.username === name) {
    return NextResponse.json({ error: 'Cannot delete the last remaining admin.' }, { status: 400 });
  }
  await deleteUser(name);
  return NextResponse.json({ ok: true });
}
