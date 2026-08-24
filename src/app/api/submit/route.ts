import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { compute, applicableItems } from '@/engine';
import type { Persona, Submission } from '@/engine/types';
import { saveLead, logEvent, type LeadRecord } from '@/lib/storage';

export const runtime = 'nodejs';

const PERSONAS: Persona[] = ['student', 'teacher', 'parent', 'administrator'];

type Body = {
  persona?: string;
  usage?: number;
  b1?: number;
  b2?: number;
  answers?: Record<string, number>;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  mobilePhone?: string;
  heardFrom?: string;
  consent?: boolean;
  sessionId?: string;
};

/** Validate the Submission against the engine's own item model. */
function validate(body: Body): { ok: true; submission: Submission } | { ok: false; error: string } {
  const persona = body.persona as Persona | undefined;
  if (!persona || !PERSONAS.includes(persona)) return { ok: false, error: 'Unknown persona.' };

  const usage = Number(body.usage);
  if (!Number.isInteger(usage) || usage < 1 || usage > 5) return { ok: false, error: 'Usage must be 1 to 5.' };

  const answers = body.answers;
  if (!answers || typeof answers !== 'object') return { ok: false, error: 'Missing answers.' };

  const items = applicableItems(persona, usage);
  const byId = new Map(items.map((i) => [i.id, i]));

  for (const [id, raw] of Object.entries(answers)) {
    const item = byId.get(id);
    if (!item) return { ok: false, error: `Unknown item for this assessment: ${id}` };
    const value = Number(raw);
    if (!Number.isInteger(value)) return { ok: false, error: `Non-integer answer for ${id}` };
    const allowed = item.options?.length
      ? item.options.map((o) => o.value)
      : (item.type === 'outcome' ? [0, 1, 2, 3, 4, 5] : [1, 2, 3, 4, 5]);
    if (!allowed.includes(value)) return { ok: false, error: `Out of range answer for ${id}` };
  }

  const inRange1to5 = (v: unknown) =>
    v === undefined || (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 5);
  if (!inRange1to5(body.b1) || !inRange1to5(body.b2)) {
    return { ok: false, error: 'Baseline answers must be 1 to 5.' };
  }

  return {
    ok: true,
    submission: {
      persona,
      usage,
      b1: body.b1 === undefined ? undefined : Number(body.b1),
      b2: body.b2 === undefined ? undefined : Number(body.b2),
      answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, Number(v)])),
    },
  };
}

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const fullName = (body.name || `${body.firstName || ''} ${body.lastName || ''}`).trim();
  if (!body.email || !fullName) {
    return NextResponse.json({ error: 'First name and email are required.' }, { status: 400 });
  }

  const checked = validate(body);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });

  const result = compute(checked.submission);

  const dimensionScores: Record<string, number> = {};
  Object.values(result.dimensions).forEach((d) => { dimensionScores[d.construct] = d.score; });

  const lead: LeadRecord = {
    id: randomUUID(),
    name: fullName,
    firstName: body.firstName || '',
    lastName: body.lastName || '',
    email: body.email,
    mobilePhone: body.mobilePhone || '',
    heardFrom: body.heardFrom || '',
    role: checked.submission.persona,
    modality: '',
    consent: Boolean(body.consent),
    persona: result.archetype.id,
    personaName: result.archetype.name,
    overall: result.stage.rawIndex,
    dimensions: dimensionScores,
    answers: checked.submission.answers as Record<string, number>,
    baseline: (checked.submission.b1 !== undefined || checked.submission.b2 !== undefined)
      ? { b1: checked.submission.b1 ?? 0, b2: checked.submission.b2 ?? 0 }
      : null,
    usageVal: checked.submission.usage,
    createdAt: new Date().toISOString(),
    engineVersion: 2,
    result,
    stage: result.stage.stage,
    stageName: result.stage.stageName,
    archetypeId: result.archetype.id,
    archetypeName: result.archetype.name,
    confidence: result.overallConfidence,
  };

  try {
    await saveLead(lead);
  } catch (error) {
    console.error('saveLead failed', error);
    // A storage failure must never cost the respondent their result.
  }

  await logEvent({
    event: 'email_submit',
    sessionId: body.sessionId,
    role: lead.role,
    zone: result.archetype.id,
  });

  return NextResponse.json({ success: true, result, emailSent: false });
}
