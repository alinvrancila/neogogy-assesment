import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import { listLeads } from '@/lib/storage';
import { toAttempts, toPeople, buildCohortReport, buildOrgReports } from '@/lib/analytics';

export const runtime = 'nodejs';

/**
 * Everything the admin dashboard needs in one call: cohort statistics,
 * organisation rollups, and a compact row per person.
 *
 * Optional filters narrow the cohort so the same statistics can be read for a
 * persona, an organisation, or a date range.
 */
export async function GET(request: NextRequest) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const persona = sp.get('persona') || '';
  const domain = sp.get('domain') || '';
  const from = sp.get('from') || '';
  const to = sp.get('to') || '';

  const leads = await listLeads();
  let attempts = toAttempts(leads);

  if (from) attempts = attempts.filter((a) => a.createdAt >= from);
  if (to) attempts = attempts.filter((a) => a.createdAt <= `${to}T23:59:59.999Z`);
  if (persona) attempts = attempts.filter((a) => a.persona === persona);

  let people = toPeople(attempts);
  if (domain) people = people.filter((p) => p.domain === domain);

  const cohort = buildCohortReport(attempts, people);
  const organisations = buildOrgReports(toPeople(toAttempts(leads)));

  // A compact row per person; the full result is fetched on demand.
  const rows = people.map((p) => ({
    email: p.email,
    name: p.name,
    domain: p.domain,
    isOrganisational: p.isOrganisational,
    persona: p.latest.persona,
    attempts: p.attempts.length,
    firstAt: p.first.createdAt,
    latestAt: p.latest.createdAt,
    index: p.latest.result.stage.rawIndex,
    stage: p.latest.result.stage.stage,
    stageName: p.latest.result.stage.stageName,
    archetype: p.latest.result.archetype.name,
    confidence: p.latest.result.overallConfidence,
    usage: p.latest.result.usageProfile.usage,
    dependencyIndex: p.latest.result.composites.dependencyIndex,
    underexposed: p.latest.result.usageProfile.underexposed,
    gated: !!p.latest.result.stage.gated,
    indexDelta: p.indexDelta,
    stageDelta: p.stageDelta,
    direction: p.direction,
    latestId: p.latest.id,
  }));

  return NextResponse.json({
    cohort,
    organisations,
    people: rows,
    filters: { persona, domain, from, to },
    legacyCount: leads.filter((l) => l.engineVersion !== 2).length,
  });
}
