import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { compute, applicableItems } from '@/engine';
import type { Persona, Submission } from '@/engine/types';
import { saveLead, logEvent, type LeadRecord, type SubmissionMeta } from '@/lib/storage';
import { generateCompassPdf } from '@/lib/reportPdfV2';
import { sendReportEmail, isEmailEnabled } from '@/lib/email';
import { buildComparison } from '@/lib/history';
import { sharePosts, SHARE_URL } from '@/lib/share';

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
  meta?: Record<string, unknown>;
};

/** Accept only known fields, in sane ranges. Untrusted client input. */
function cleanMeta(raw: unknown): SubmissionMeta | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const m = raw as Record<string, unknown>;
  const int = (v: unknown, min: number, max: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : undefined;
  };
  const str = (v: unknown, max = 80) =>
    (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
  const out: SubmissionMeta = {
    // capped at four hours: anything longer is a tab left open, not a sitting
    durationMs: int(m.durationMs, 0, 4 * 60 * 60 * 1000),
    revisions: int(m.revisions, 0, 500),
    viewportWidth: int(m.viewportWidth, 0, 10000),
    device: ['phone', 'tablet', 'desktop'].includes(String(m.device)) ? String(m.device) : undefined,
    referrerHost: str(m.referrerHost, 120),
    utmSource: str(m.utmSource),
    utmMedium: str(m.utmMedium),
    utmCampaign: str(m.utmCampaign),
    localHour: int(m.localHour, 0, 23),
    weekday: int(m.weekday, 0, 6),
  };
  return Object.values(out).some((v) => v !== undefined) ? out : undefined;
}

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

  // A returning respondent is matched on email so their movement can be shown.
  // This runs before the new record is saved, so it compares against genuine
  // prior attempts only.
  let comparison = null;
  try {
    comparison = await buildComparison(body.email, result, new Date());
  } catch (error) {
    console.error('comparison lookup failed', error);
    // A missing comparison is never allowed to cost the respondent their result.
  }

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
    meta: cleanMeta(body.meta),
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

  let emailSent = false;
  try {
    const pdf = await generateCompassPdf({ result, name: fullName, comparison });
    if (isEmailEnabled()) {
      const first = body.firstName || fullName;
      const sent = await sendReportEmail({
        to: body.email,
        name: fullName,
        personaName: result.archetype.name,
        subject: `Your Formation Compass result: ${result.archetype.name}`,
        bodyText: [
          `Hello ${first},`,
          ``,
          `Your Formation Compass report is attached.`,
          ``,
          `Your answers are consistent with ${result.archetype.name}: ${result.archetype.tagline}`,
          `They place you at stage ${result.stage.stage} of 10 on the Neogogy continuum, ${result.stage.stageName}, with a developmental index of ${result.stage.rawIndex}.`,
          ``,
          `The report walks through all ten dimensions, where your answers suggest AI is helping and where it may be working against you, what appears to be holding your position, and a roadmap built from what you reported.`,
          ``,
          `These are assessment indices drawn from self reported answers, meant to support reflection rather than to measure you.`,
          ``,
          `Explore the framework at www.ican.ph.`,
          ``,
          `---`,
          ``,
          `If you would like to share where you landed, here is a post you can copy:`,
          ``,
          sharePosts(result)[0].text,
          ``,
          `Share links:`,
          `  LinkedIn  https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}`,
          `  Facebook  https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`,
          `  X         https://twitter.com/intent/tweet?text=${encodeURIComponent(sharePosts(result)[2].text)}`,
          ``,
          `The link points at the assessment itself, so your scores are never published.`,
          ``,
          `Warmly,`,
          `The International Center for Applied Neogogy`,
        ].join('\n'),
        pdf,
      });
      emailSent = sent.sent;
    }
  } catch (error) {
    console.error('pdf/email failed', error);
    // The respondent still sees their result on screen.
  }

  return NextResponse.json({ success: true, result, comparison, emailSent });
}
