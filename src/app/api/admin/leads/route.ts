import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import { getLead, listLeads, deleteLead, type LeadRecord } from '@/lib/storage';

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
  // v1 and v2 records are not interchangeable, so both column sets are present
  // and each row fills only the ones that apply to its engineVersion.
  const headers = [
    'id',
    'createdAt',
    'engineVersion',
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
    'stage',
    'stageName',
    'index',
    'confidence',
    'rescoredFrom',
    'resilience',
    'readiness',
    'overall',
    'usageVal',
    // the context each submission arrived with
    'ip', 'country', 'region', 'city', 'postal', 'latitude', 'longitude', 'isEu',
    'isp', 'org', 'asn', 'datacenter',
    'device', 'browser', 'browserVersion', 'os', 'osVersion', 'vendor', 'platform',
    'screenWidth', 'screenHeight', 'viewportWidth', 'orientation', 'connectionType',
    'language', 'timezone', 'ipTimezone', 'localHour', 'weekday',
    'referrerHost', 'landingPath', 'utmSource', 'utmMedium', 'utmCampaign',
    'utmTerm', 'utmContent', 'clickId',
    'durationMs', 'awayMs', 'awayCount', 'medianAnswerMs', 'rushedAnswers',
    'revisions', 'resumed', 'bot', 'userAgent',
    ...dimensionKeys.map((key) => `dimension_${key}`)
  ];

  const rows = leads.map((lead) => [
    lead.id,
    lead.createdAt,
    lead.engineVersion ?? 1,
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
    lead.stage ?? '',
    lead.stageName ?? '',
    lead.engineVersion === 2 ? lead.overall : '',
    lead.confidence ?? '',
    lead.rescoredFrom ?? '',
    lead.resilience ?? '',
    lead.readiness ?? '',
    lead.engineVersion === 2 ? '' : lead.overall,
    lead.usageVal ?? '',
    lead.meta?.ip ?? '',
    lead.meta?.country ?? '',
    lead.meta?.region ?? '',
    lead.meta?.city ?? '',
    lead.meta?.postal ?? '',
    lead.meta?.latitude ?? '',
    lead.meta?.longitude ?? '',
    lead.meta?.isEu ?? '',
    lead.meta?.isp ?? '',
    lead.meta?.org ?? '',
    lead.meta?.asn ?? '',
    lead.meta?.datacenter ?? '',
    lead.meta?.device ?? lead.meta?.deviceClass ?? '',
    lead.meta?.browser ?? '',
    lead.meta?.browserVersion ?? '',
    lead.meta?.os ?? '',
    lead.meta?.osVersion ?? '',
    lead.meta?.vendor ?? '',
    lead.meta?.platform ?? '',
    lead.meta?.screenWidth ?? '',
    lead.meta?.screenHeight ?? '',
    lead.meta?.viewportWidth ?? '',
    lead.meta?.orientation ?? '',
    lead.meta?.connectionType ?? '',
    lead.meta?.language ?? '',
    lead.meta?.timezone ?? '',
    lead.meta?.ipTimezone ?? '',
    lead.meta?.localHour ?? '',
    lead.meta?.weekday ?? '',
    lead.meta?.referrerHost ?? '',
    lead.meta?.landingPath ?? '',
    lead.meta?.utmSource ?? '',
    lead.meta?.utmMedium ?? '',
    lead.meta?.utmCampaign ?? '',
    lead.meta?.utmTerm ?? '',
    lead.meta?.utmContent ?? '',
    lead.meta?.clickId ?? '',
    lead.meta?.durationMs ?? '',
    lead.meta?.awayMs ?? '',
    lead.meta?.awayCount ?? '',
    lead.meta?.medianAnswerMs ?? '',
    lead.meta?.rushedAnswers ?? '',
    lead.meta?.revisions ?? '',
    lead.meta?.resumed ?? '',
    lead.meta?.bot ?? '',
    lead.meta?.userAgent ?? '',
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
