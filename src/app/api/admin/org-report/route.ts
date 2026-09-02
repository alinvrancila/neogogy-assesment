import type { NextRequest } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import { listLeads } from '@/lib/storage';
import { toAttempts, toPeople } from '@/lib/analytics';
import { buildGroupResult, type GroupMember } from '@/engine/group';
import { generateGroupPdf } from '@/lib/groupReportPdf';
import { getOrgProfile } from '@/lib/orgProfile';
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

/** One row per aggregate, quartiles included, no row per person. */
function toCsv(g: ReturnType<typeof buildGroupResult>): string {
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows: string[][] = [['section', 'measure', 'n', 'share', 'median', 'q1', 'q3', 'min', 'max', 'mean', 'sd']];
  const spreadRow = (section: string, measure: string, sp: typeof g.index) =>
    rows.push([section, measure, String(sp.n), '', String(sp.median), String(sp.q1), String(sp.q3),
      String(sp.min), String(sp.max), String(sp.mean), String(sp.sd)]);
  const countRow = (section: string, measure: string, n: number, share: number) =>
    rows.push([section, measure, String(n), String(share), '', '', '', '', '', '', '']);

  rows.push(['meta', 'label', String(g.n), '', '', '', '', '', '', '', '']);
  for (const [k, v] of Object.entries(g.versions)) rows.push(['meta', `version.${k}`, '', '', String(v), '', '', '', '', '', '']);
  spreadRow('index', 'developmental index', g.index);
  for (const d of g.distribution) countRow('stage', `${d.stage} ${d.stageName}`, d.n, d.share);
  for (const d of g.dimensions) {
    spreadRow('dimension', d.name, d.spread);
    countRow('dimension band', `${d.name} strong`, d.bands.strong.n, d.bands.strong.share);
    countRow('dimension band', `${d.name} watch`, d.bands.watch.n, d.bands.watch.share);
  }
  for (const c of g.composites) spreadRow('composite', c.label, c.spread);
  for (const c of g.constraints) countRow('constraint', c.name, c.n, c.share);
  for (const a of g.archetypes) countRow('archetype', a.name, a.n, a.share);
  for (const q of [...g.quadrants.capabilityUse, ...g.quadrants.fluencyJudgment]) countRow('quadrant', q.label, q.n, q.share);
  for (const m of g.moves) countRow('practice', m.capability, m.n, m.share);
  for (const s2 of g.segments) {
    if (s2.suppressed) countRow('segment', `${s2.dimension}: ${s2.value} (suppressed)`, s2.n, 0);
    else spreadRow('segment', `${s2.dimension}: ${s2.value}`, s2.index!);
  }
  countRow('headline', 'healthy adoption', g.headline.healthyAdoption.n, g.headline.healthyAdoption.share);
  return rows.map((r) => r.map(esc).join(',')).join('\n');
}

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

  // Pseudonymous: the key exists so a person is counted once. It is never
  // printed, and no per-person row leaves this function.
  const members: GroupMember[] = people.map((p, i) => ({
    key: `r${i + 1}`,
    persona: p.latest.persona as Persona,
    result: p.latest.result,
    takenAt: p.latest.createdAt,
    usage: p.latest.result.usageProfile.usage,
    felt: p.latest.baseline?.b1 ?? null,
    predicted: p.latest.baseline?.b2 ?? null,
    indexDelta: p.indexDelta,
    priorStage: p.attempts.length > 1 ? p.first.result.stage.stage : undefined,
  }));

  const group = buildGroupResult(label, members);

  // Aggregates only. There is no format that emits a row per person.
  const format = (sp.get('format') || 'pdf').toLowerCase();
  if (format === 'json') {
    return new Response(JSON.stringify(group, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${safeFilePart(label)}_Group_Aggregates.json"`,
        'Cache-Control': 'no-store',
      },
    });
  }
  if (format === 'csv') {
    return new Response(toCsv(group), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeFilePart(label)}_Group_Aggregates.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  const profile = await getOrgProfile(domain);
  const pdf = await generateGroupPdf(group, profile);
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
