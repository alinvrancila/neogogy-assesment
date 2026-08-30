import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import { listLeads } from '@/lib/storage';
import { buildLeadCsv } from '@/lib/leadCsv';

export const runtime = 'nodejs';

/**
 * CSV for a chosen set of records, or for all of them when no ids are given.
 *
 * A POST rather than a query string because a selection of several hundred
 * records would otherwise be a URL long enough for a proxy to refuse.
 */
export async function POST(request: NextRequest) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let ids: string[] = [];
  try {
    const body = await request.json();
    if (Array.isArray(body?.ids)) ids = body.ids.filter((id: unknown) => typeof id === 'string');
  } catch {
    // an empty or malformed body means the whole set
  }

  const all = await listLeads();
  const wanted = ids.length ? new Set(ids) : null;
  const leads = wanted ? all.filter((lead) => wanted.has(lead.id)) : all;

  if (wanted && !leads.length) {
    return NextResponse.json({ error: 'None of those records exist.' }, { status: 404 });
  }

  const csv = buildLeadCsv(leads);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="neogogy-records-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
