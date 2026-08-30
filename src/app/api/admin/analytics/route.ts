import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import { listLeads } from '@/lib/storage';
import {
  toAttempts, toPeople, buildCohortReport, buildOrgReports,
  buildAudienceReport, buildQualityReport, buildItemStats,
  buildReachReport, buildTechReport, buildEngagementReport,
} from '@/lib/analytics';
import { allItems } from '@/engine';
import type { Persona } from '@/engine/types';

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
  const latest = people.map((p) => p.latest);
  const audience = buildAudienceReport(latest);
  const quality = buildQualityReport(latest);
  const reach = buildReachReport(latest);
  const tech = buildTechReport(latest);
  const engagement = buildEngagementReport(latest);

  // Item review needs the item definitions for whichever personas appear.
  const personaSet = new Set(latest.map((a) => a.persona));
  const itemMeta = [...personaSet].flatMap((p) =>
    allItems(p as Persona).map((i) => ({ id: i.id, construct: i.construct, type: i.type })));
  const seen = new Set<string>();
  const uniqueItems = itemMeta.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
  const items = buildItemStats(latest, uniqueItems);
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
    // where and on what, so the people table can be read without opening rows
    country: p.latest.meta?.country,
    countryCode: p.latest.meta?.countryCode,
    city: p.latest.meta?.city,
    device: p.latest.meta?.device || p.latest.meta?.deviceClass,
    browser: p.latest.meta?.browser,
    os: p.latest.meta?.os,
    datacenter: p.latest.meta?.datacenter,
  }));

  return NextResponse.json({
    cohort,
    audience,
    quality,
    reach,
    tech,
    engagement,
    items,
    organisations,
    people: rows,
    filters: { persona, domain, from, to },
    legacyCount: leads.filter((l) => l.engineVersion !== 2).length,
  });
}
