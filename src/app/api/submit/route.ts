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
import { requestContext } from '@/lib/requestContext';
import { lookupIp } from '@/lib/geoip';

export const runtime = 'nodejs';

const PERSONAS: Persona[] = ['student', 'teacher', 'parent', 'administrator', 'business', 'pastor'];

/**
 * The Pastor and Preacher check is anonymous by design and never reaches this
 * route: the browser scores it and shows the result without sending anything.
 * If a request for that persona arrives anyway, from an old tab or a script, it
 * is refused rather than stored. A count is not worth a trace.
 */
const ANONYMOUS_PERSONAS: Persona[] = ['pastor'];

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
  business?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

/** The Business Owner's optional context. Volunteered, never scored. */
function cleanBusiness(raw: unknown) {
  if (!raw || typeof raw !== 'object') return undefined;
  const b = raw as Record<string, unknown>;
  const str = (v: unknown, max: number) =>
    (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
  const out = {
    company: str(b.company, 120),
    industry: str(b.industry, 80),
    teamSize: str(b.teamSize, 40),
    tools: str(b.tools, 200),
  };
  return Object.values(out).some((v) => v !== undefined) ? out : undefined;
}

/** Accept only known fields, in sane ranges. Untrusted client input. */
function cleanMeta(raw: unknown): SubmissionMeta | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const m = raw as Record<string, unknown>;

  const int = (v: unknown, min: number, max: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : undefined;
  };
  const num = (v: unknown, min: number, max: number, dp = 2) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < min || n > max) return undefined;
    const f = 10 ** dp;
    return Math.round(n * f) / f;
  };
  const str = (v: unknown, max = 80) =>
    (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
  const bool = (v: unknown) => (typeof v === 'boolean' ? v : undefined);
  const list = (v: unknown, max = 5, len = 24) =>
    (Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, max).map((x) => String(x).slice(0, len)) : undefined);
  const oneOf = (v: unknown, allowed: string[]) =>
    (allowed.includes(String(v)) ? String(v) : undefined);

  const HOUR = 60 * 60 * 1000;
  const out: SubmissionMeta = {
    // the sitting. Four hours is the cap: longer is a tab left open, not a sitting
    durationMs: int(m.durationMs, 0, 4 * HOUR),
    revisions: int(m.revisions, 0, 500),
    awayMs: int(m.awayMs, 0, 24 * HOUR),
    awayCount: int(m.awayCount, 0, 500),
    answers: int(m.answers, 0, 200),
    medianAnswerMs: int(m.medianAnswerMs, 0, HOUR),
    fastestAnswerMs: int(m.fastestAnswerMs, 0, HOUR),
    slowestAnswerMs: int(m.slowestAnswerMs, 0, HOUR),
    rushedAnswers: int(m.rushedAnswers, 0, 200),
    resumed: bool(m.resumed),

    // the device
    device: oneOf(m.device, ['phone', 'tablet', 'desktop']),
    viewportWidth: int(m.viewportWidth, 0, 10000),
    viewportHeight: int(m.viewportHeight, 0, 10000),
    screenWidth: int(m.screenWidth, 0, 20000),
    screenHeight: int(m.screenHeight, 0, 20000),
    pixelRatio: num(m.pixelRatio, 0, 10),
    colorDepth: int(m.colorDepth, 0, 64),
    orientation: oneOf(m.orientation, ['portrait', 'landscape']),
    platform: str(m.platform, 40),
    uaMobile: bool(m.uaMobile),
    uaBrands: list(m.uaBrands, 4, 40),
    cores: int(m.cores, 0, 256),
    memoryGb: num(m.memoryGb, 0, 1024),
    touchPoints: int(m.touchPoints, 0, 64),
    connectionType: str(m.connectionType, 20),
    downlinkMbps: num(m.downlinkMbps, 0, 10000),
    rttMs: int(m.rttMs, 0, 600000),
    saveData: bool(m.saveData),
    prefersDark: bool(m.prefersDark),
    prefersReducedMotion: bool(m.prefersReducedMotion),
    cookiesEnabled: bool(m.cookiesEnabled),
    doNotTrack: bool(m.doNotTrack),

    // who and where they are
    localHour: int(m.localHour, 0, 23),
    weekday: int(m.weekday, 0, 6),
    timezone: str(m.timezone, 60),
    utcOffsetMinutes: int(m.utcOffsetMinutes, -900, 900),
    language: str(m.language, 24),
    languages: list(m.languages),

    // where the visit came from
    referrerHost: str(m.referrerHost, 120),
    referrerPath: str(m.referrerPath, 120),
    landingPath: str(m.landingPath, 120),
    utmSource: str(m.utmSource),
    utmMedium: str(m.utmMedium),
    utmCampaign: str(m.utmCampaign),
    utmTerm: str(m.utmTerm),
    utmContent: str(m.utmContent),
    clickId: str(m.clickId, 24),
  };
  return Object.values(out).some((v) => v !== undefined) ? out : undefined;
}

/**
 * What the request itself disclosed: the address it came from, the browser and
 * operating system behind it, and the place that address belongs to. Server
 * side only, so none of it can be spoofed by editing the page.
 */
async function serverMeta(request: NextRequest): Promise<SubmissionMeta> {
  const ctx = requestContext(request.headers);
  const geo = ctx.ip ? await lookupIp(ctx.ip) : undefined;
  return {
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    browser: ctx.browser,
    browserVersion: ctx.browserVersion,
    os: ctx.os,
    osVersion: ctx.osVersion,
    deviceClass: ctx.deviceClass,
    vendor: ctx.vendor,
    bot: ctx.bot,
    acceptLanguages: ctx.languages,
    ...(geo || {}),
  };
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

  // Refused rather than stored: this persona keeps no records at all.
  if (ANONYMOUS_PERSONAS.includes(body.persona as Persona)) {
    return NextResponse.json({
      error: 'This check is anonymous and is not stored. Your result is shown on your own screen.',
    }, { status: 400 });
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
    meta: {
      ...cleanMeta(body.meta), ...(await serverMeta(request)),
      business: cleanBusiness(body.business),
    },
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
    device: lead.meta?.device,
    country: lead.meta?.country,
    countryCode: lead.meta?.countryCode,
    browser: lead.meta?.browser,
    os: lead.meta?.os,
    bot: lead.meta?.bot,
    referrerHost: lead.meta?.referrerHost,
    utmSource: lead.meta?.utmSource,
  });

  let emailSent = false;
  try {
    const pdf = await generateCompassPdf({
      result, name: fullName, comparison,
      company: lead.meta?.business?.company,
      industry: lead.meta?.business?.industry,
    });
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
