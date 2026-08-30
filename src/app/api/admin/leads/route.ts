import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import { getLead, listLeads, deleteLead } from '@/lib/storage';
import { buildLeadCsv } from '@/lib/leadCsv';

export const runtime = 'nodejs';

const guard = (request: NextRequest) =>
  isAdminAuthed(request) ? null : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

export async function GET(request: NextRequest) {
  const denied = guard(request);
  if (denied) return denied;

  const id = request.nextUrl.searchParams.get('id') || '';
  if (id) {
    const lead = await getLead(id);
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ lead });
  }

  const leads = await listLeads();
  if (request.nextUrl.searchParams.get('format') === 'csv') {
    return new Response(buildLeadCsv(leads), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="neogogy-exam-takers-${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  }

  return NextResponse.json({ leads });
}

/** Delete a single submission. A person's other attempts are untouched. */
export async function DELETE(request: NextRequest) {
  const denied = guard(request);
  if (denied) return denied;
  const id = request.nextUrl.searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const lead = await getLead(id);
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const ok = await deleteLead(id);
  if (!ok) return NextResponse.json({ error: 'Could not delete' }, { status: 500 });
  return NextResponse.json({ ok: true, id, email: lead.email });
}
