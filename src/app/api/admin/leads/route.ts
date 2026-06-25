import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import { getLead, listLeads, type LeadRecord } from '@/lib/storage';

export const runtime = 'nodejs';

const guard = (request: NextRequest) =>
  isAdminAuthed(request) ? null : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const csvCell = (value: unknown): string => {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toCsv = (leads: LeadRecord[]): string => {
  const dimensionKeys = Array.from(
    new Set(leads.flatMap((lead) => Object.keys(lead.dimensions || {})))
  ).sort();
  const headers = [
    'id',
    'createdAt',
    'name',
    'firstName',
    'lastName',
    'email',
    'mobilePhone',
    'heardFrom',
    'role',
    'modality',
    'consent',
    'persona',
    'personaName',
    'resilience',
    'readiness',
    'overall',
    'usageVal',
    ...dimensionKeys.map((key) => `dimension_${key}`)
  ];

  const rows = leads.map((lead) => [
    lead.id,
    lead.createdAt,
    lead.name,
    lead.firstName || '',
    lead.lastName || '',
    lead.email,
    lead.mobilePhone || '',
    lead.heardFrom || '',
    lead.role,
    lead.modality,
    lead.consent ? 'yes' : 'no',
    lead.persona,
    lead.personaName,
    lead.resilience,
    lead.readiness,
    lead.overall,
    lead.usageVal ?? '',
    ...dimensionKeys.map((key) => lead.dimensions?.[key] ?? '')
  ]);

  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
};

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
    return new Response(toCsv(leads), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="neogogy-exam-takers-${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  }

  return NextResponse.json({ leads });
}
