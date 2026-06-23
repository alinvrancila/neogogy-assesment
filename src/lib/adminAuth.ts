import type { NextRequest } from 'next/server';

export const ADMIN_COOKIE = 'neogogy_admin';

/** True when the request carries a valid admin session cookie. */
export const isAdminAuthed = (request: NextRequest): boolean => {
  const token = process.env.STATS_TOKEN || '';
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  return Boolean(token) && cookie === token;
};
