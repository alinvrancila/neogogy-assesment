import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getStats } from '@/lib/storage';
import { isAdminAuthed } from '@/lib/adminAuth';

export const runtime = 'nodejs';

/**
 * Lightweight self-hosted analytics summary. Accepts either the admin session
 * cookie or a STATS_TOKEN via ?token= / x-stats-token header (for CLI use).
 */
export async function GET(request: NextRequest) {
  const token = process.env.STATS_TOKEN;
  const provided =
    request.nextUrl.searchParams.get('token') || request.headers.get('x-stats-token');

  // Closed unless something proves the caller. The condition used to be gated
  // on a token existing, so a deployment that had not set STATS_TOKEN served
  // the whole analytics summary to anybody who asked.
  const byToken = Boolean(token) && provided === token;
  if (!byToken && !isAdminAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = await getStats();
  return NextResponse.json(stats);
}
