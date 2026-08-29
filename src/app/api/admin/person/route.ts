import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import { listLeads, deleteLeadsByEmail } from '@/lib/storage';
import { toAttempts, toPeople, CONSTRUCT_IDS } from '@/lib/analytics';
import { CONSTRUCTS } from '@/engine/config';

export const runtime = 'nodejs';

/** One person's full history, including per-dimension movement per attempt. */
export async function GET(request: NextRequest) {
  if (!isAdminAuthed(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const email = (request.nextUrl.searchParams.get('email') || '').trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  const people = toPeople(toAttempts(await listLeads()));
  const person = people.find((p) => p.email === email);
  if (!person) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const series = person.attempts.map((a) => {
    const dims: Record<string, number> = {};
    for (const c of CONSTRUCT_IDS) {
      const d = a.result.dimensions[c];
      dims[c] = CONSTRUCTS[c].reportedAsRisk ? d.reportedScore : d.score;
    }
    return {
      id: a.id,
      at: a.createdAt,
      index: a.result.stage.rawIndex,
      stage: a.result.stage.stage,
      stageName: a.result.stage.stageName,
      archetype: a.result.archetype.name,
      confidence: a.result.overallConfidence,
      usage: a.result.usageProfile.usage,
      rescored: a.rescored,
      dims,
      composites: a.result.composites,
      patterns: a.result.patterns.map((p) => ({ id: p.id, label: p.label, kind: p.kind })),
      bottleneck: a.result.bottleneck.construct,
    };
  });

  return NextResponse.json({
    email: person.email,
    name: person.name,
    domain: person.domain,
    isOrganisational: person.isOrganisational,
    direction: person.direction,
    indexDelta: person.indexDelta,
    stageDelta: person.stageDelta,
    series,
  });
}

/** Erase every submission for an email. Used for deletion requests and cleanup. */
export async function DELETE(request: NextRequest) {
  if (!isAdminAuthed(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const email = (request.nextUrl.searchParams.get('email') || '').trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  const removed = await deleteLeadsByEmail(email);
  if (!removed) return NextResponse.json({ error: 'Nothing matched that address' }, { status: 404 });
  return NextResponse.json({ ok: true, removed });
}
