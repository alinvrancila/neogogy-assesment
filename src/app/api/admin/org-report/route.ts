import type { NextRequest } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import { listLeads } from '@/lib/storage';
import { toAttempts, toPeople } from '@/lib/analytics';
import { buildGroupResult, type GroupMember } from '@/engine/group';
import { generateGroupPdf } from '@/lib/groupReportPdf';
import type { Persona } from '@/engine/types';

export const runtime = 'nodejs';

/**
 * One report for a whole group.
 *
 * `domain` selects the organisation, which is how people are grouped
 * everywhere else in the admin. `label` overrides what the cover calls them,
 * because a class is rarely called by its email domain. `persona`, `from` and
 * `to` narrow the group the same way the dashboard filters narrow the numbers,
 * so a single class inside a school can be reported on its own.
 *
 * One attempt per person, the latest, so a keen retaker cannot weight the mean.
 */
const safeFilePart = (value: unknown, fallback = 'Group') =>
  String(value || fallback).trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || fallback;

const fail = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), {
    status, headers: { 'Content-Type': 'application/json' },
  });

export async function GET(request: NextRequest) {
  if (!isAdminAuthed(request)) return fail(401, 'Unauthorized');

  const sp = request.nextUrl.searchParams;
  const domain = (sp.get('domain') || '').trim().toLowerCase();
  const persona = sp.get('persona') || '';
  const from = sp.get('from') || '';
  const to = sp.get('to') || '';
  const label = (sp.get('label') || '').trim() || domain;

  if (!domain) return fail(400, 'A domain is required.');

  const leads = await listLeads();
  let attempts = toAttempts(leads);
  if (from) attempts = attempts.filter((a) => a.createdAt >= from);
  if (to) attempts = attempts.filter((a) => a.createdAt <= `${to}T23:59:59.999Z`);
  if (persona) attempts = attempts.filter((a) => a.persona === persona);

  const people = toPeople(attempts).filter((p) => p.domain === domain);
  if (!people.length) return fail(404, `No completed assessments for ${domain}.`);

  const members: GroupMember[] = people.map((p) => ({
    name: p.name,
    email: p.email,
    persona: p.latest.persona as Persona,
    result: p.latest.result,
    takenAt: p.latest.createdAt,
    indexDelta: p.indexDelta,
  }));

  const group = buildGroupResult(label, members);
  const pdf = await generateGroupPdf(group);
  const file = `${safeFilePart(label)}_Group_Report.pdf`;

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${file}"`,
      'Cache-Control': 'no-store',
    },
  });
}
