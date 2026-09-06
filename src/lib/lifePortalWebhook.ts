import crypto from 'node:crypto';
import type { CompassResult } from '@/engine/types';
import type { LeadRecord, SubmissionMeta } from '@/lib/storage';
import { resolveLifePortalWebhookSettings, type LifePortalWebhookConfig } from '@/lib/lifePortalSettings';

const DEFAULT_ENDPOINT = 'https://lifeportal.life.edu.ph/api/public/integrations/contacts/webhook';
const DEFAULT_PROGRAM_INTEREST = 'LifeX Online Certificate';
const EXPERIENCE = 'neogogy_assessment';
const EXPERIENCE_LABEL = 'Neogogy Human Advantage Assessment';

export type LifePortalWebhookPayload = {
  external_id: string;
  event_type: string;
  occurred_at: string;
  sender: {
    id: string;
    name: string;
    type: string;
  };
  experience: string;
  experience_label: string;
  profile_type: string;
  archetype?: string;
  archetype_name?: string;
  program_interest: string;
  contact: {
    full_name: string;
    first_name?: string;
    last_name?: string;
    email: string;
    phone?: string;
    mobile_phone?: string;
    program_code?: string;
    academic_term_code?: string;
    stage_code: string;
    source_of_origin_code?: string;
    first_inquiry_source_code: string;
    tags: string[];
  };
  attribution: {
    source: string;
    medium: string;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmContent: string;
    utmTerm: string;
    landingPage?: string;
    pageUrl?: string;
    referrer?: string;
    clickId?: string;
  };
  assessment: {
    leadId: string;
    submittedAt: string;
    role: string;
    profileType: string;
    experience: string;
    experienceLabel: string;
    programInterest: string;
    assessmentPersona: string;
    archetypeId?: string;
    archetypeName?: string;
    stage?: number;
    stageName?: string;
    developmentalIndex?: number;
    confidence?: string;
    usage?: number | null;
    dimensions?: Record<string, number>;
    composites?: Record<string, number>;
    strengths?: Array<{ construct: string; score: number }>;
    vulnerabilities?: Array<{ construct: string; score: number }>;
    riskSignals?: Array<{ tag: string; severity: string; construct?: string }>;
    heardFrom?: string;
    marketingConsent: boolean;
    business?: SubmissionMeta['business'];
    location?: {
      country?: string;
      countryCode?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
    device?: {
      device?: string;
      deviceClass?: string;
      browser?: string;
      os?: string;
      language?: string;
    };
  };
};

type SendContext = {
  pageUrl?: string;
  referrer?: string;
};

export type LifePortalWebhookResult =
  | { sent: true; status: number; response: unknown }
  | { sent: false; reason: 'disabled' | 'not_configured' };

const text = (value: unknown, max: number): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
};

const roundScore = (value: unknown): number | undefined => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : undefined;
};

const compactScores = (scores?: Record<string, number>): Record<string, number> | undefined => {
  if (!scores) return undefined;
  const entries = Object.entries(scores)
    .map(([key, value]) => [key, roundScore(value)] as const)
    .filter((entry): entry is readonly [string, number] => typeof entry[1] === 'number');
  return entries.length ? Object.fromEntries(entries) : undefined;
};

const compactResult = (lead: LeadRecord) => {
  const result = lead.result as Partial<CompassResult> | undefined;
  const strengths = result?.strengths
    ?.map((item) => ({ construct: item.construct, score: roundScore(item.score) ?? item.score }))
    .slice(0, 5);
  const vulnerabilities = result?.vulnerabilities
    ?.map((item) => ({ construct: item.construct, score: roundScore(item.score) ?? item.score }))
    .slice(0, 5);
  const riskSignals = result?.riskSignals
    ?.map((item) => ({ tag: item.tag, severity: item.severity, construct: item.construct }))
    .slice(0, 8);

  return {
    composites: compactScores(result?.composites as Record<string, number> | undefined),
    strengths: strengths?.length ? strengths : undefined,
    vulnerabilities: vulnerabilities?.length ? vulnerabilities : undefined,
    riskSignals: riskSignals?.length ? riskSignals : undefined,
  };
};

const referrerFromMeta = (meta?: SubmissionMeta): string | undefined => {
  if (!meta?.referrerHost) return undefined;
  return `https://${meta.referrerHost}${meta.referrerPath || ''}`.slice(0, 1000);
};

const tagList = (lead: LeadRecord): string[] => {
  const raw = [
    'lifex',
    'neogogy',
    'neogogy-assessment',
    lead.role,
    lead.archetypeId,
    lead.stage ? `stage-${lead.stage}` : undefined,
  ];
  return [...new Set(raw.map((tag) => text(tag, 120)).filter((tag): tag is string => Boolean(tag)))];
};

export function isLifePortalWebhookEnabled(): boolean {
  if (process.env.LIFE_PORTAL_WEBHOOK_ENABLED === 'false') return false;
  return Boolean(process.env.LIFE_PORTAL_WEBHOOK_SECRET);
}

export function buildLifePortalContactPayload(
  lead: LeadRecord,
  context: SendContext = {},
  config?: LifePortalWebhookConfig,
): LifePortalWebhookPayload {
  const meta = lead.meta || {};
  const resultSummary = compactResult(lead);
  const source = text(meta.utmSource, 120) || config?.utmSource || process.env.LIFE_PORTAL_UTM_SOURCE || 'lifex';
  const medium = text(meta.utmMedium, 120) || config?.utmMedium || process.env.LIFE_PORTAL_UTM_MEDIUM || 'webhook';
  const campaign = text(meta.utmCampaign, 160) || config?.utmCampaign || process.env.LIFE_PORTAL_UTM_CAMPAIGN || 'lifex-neogogy-assessment';
  const content = text(meta.utmContent, 160) || `neogogy-${lead.role || 'assessment'}`;
  const term = text(meta.utmTerm, 160) || config?.utmTerm || process.env.LIFE_PORTAL_UTM_TERM || 'lifex';
  const mobilePhone = text(lead.mobilePhone, 40);

  return {
    external_id: `neogogy-assessment-${lead.id}`,
    event_type: 'contact.created',
    occurred_at: lead.createdAt,
    sender: {
      id: 'neogogy-assessment',
      name: EXPERIENCE_LABEL,
      type: 'assessment_app',
    },
    experience: EXPERIENCE,
    experience_label: EXPERIENCE_LABEL,
    profile_type: lead.role,
    archetype: lead.archetypeId,
    archetype_name: lead.archetypeName || lead.personaName,
    program_interest: DEFAULT_PROGRAM_INTEREST,
    contact: {
      full_name: lead.name,
      first_name: text(lead.firstName, 100),
      last_name: text(lead.lastName, 100),
      email: lead.email,
      phone: mobilePhone,
      mobile_phone: mobilePhone,
      program_code: config?.programCode || text(process.env.LIFE_PORTAL_PROGRAM_CODE, 120),
      academic_term_code: config?.academicTermCode || text(process.env.LIFE_PORTAL_ACADEMIC_TERM_CODE, 120),
      stage_code: config?.stageCode || text(process.env.LIFE_PORTAL_STAGE_CODE, 120) || 'inquiry',
      source_of_origin_code: config?.sourceOfOriginCode || text(process.env.LIFE_PORTAL_SOURCE_OF_ORIGIN_CODE, 120),
      first_inquiry_source_code: config?.firstInquirySourceCode || text(process.env.LIFE_PORTAL_FIRST_INQUIRY_SOURCE_CODE, 120) || 'neogogy_assessment',
      tags: tagList(lead),
    },
    attribution: {
      source,
      medium,
      utmSource: source,
      utmMedium: medium,
      utmCampaign: campaign,
      utmContent: content,
      utmTerm: term,
      landingPage: text(meta.landingPath, 1000),
      pageUrl: text(context.pageUrl, 1000),
      referrer: text(context.referrer, 1000) || referrerFromMeta(meta),
      clickId: text(meta.clickId, 160),
    },
    assessment: {
      leadId: lead.id,
      submittedAt: lead.createdAt,
      role: lead.role,
      profileType: lead.role,
      experience: EXPERIENCE,
      experienceLabel: EXPERIENCE_LABEL,
      programInterest: DEFAULT_PROGRAM_INTEREST,
      assessmentPersona: lead.role,
      archetypeId: lead.archetypeId,
      archetypeName: lead.archetypeName || lead.personaName,
      stage: lead.stage,
      stageName: lead.stageName,
      developmentalIndex: roundScore(lead.overall),
      confidence: lead.confidence,
      usage: lead.usageVal ?? null,
      dimensions: compactScores(lead.dimensions),
      composites: resultSummary.composites,
      strengths: resultSummary.strengths,
      vulnerabilities: resultSummary.vulnerabilities,
      riskSignals: resultSummary.riskSignals,
      heardFrom: text(lead.heardFrom, 120),
      marketingConsent: lead.consent,
      business: meta.business,
      location: {
        country: meta.country,
        countryCode: meta.countryCode,
        region: meta.region,
        city: meta.city,
        timezone: meta.timezone || meta.ipTimezone,
      },
      device: {
        device: meta.device,
        deviceClass: meta.deviceClass,
        browser: meta.browser,
        os: meta.os,
        language: meta.language,
      },
    },
  };
}

export async function sendLifePortalContactLead(
  lead: LeadRecord,
  context: SendContext = {},
): Promise<LifePortalWebhookResult> {
  const config = await resolveLifePortalWebhookSettings();
  if (!config.enabled) {
    return { sent: false, reason: 'disabled' };
  }

  const signingSecret = config.secret;
  if (!signingSecret) {
    return { sent: false, reason: 'not_configured' };
  }

  const endpoint = config.url || DEFAULT_ENDPOINT;
  const payload = buildLifePortalContactPayload(lead, context, config);
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac('sha256', signingSecret)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-life-portal-timestamp': timestamp,
        'x-life-portal-signature': `sha256=${signature}`,
      },
      body,
      signal: controller.signal,
    });
    const responseText = await response.text();
    let responseBody: unknown = null;
    try {
      responseBody = responseText ? JSON.parse(responseText) : null;
    } catch {
      responseBody = responseText;
    }

    if (!response.ok) {
      throw new Error(`Life Portal webhook failed: ${response.status} ${responseText}`);
    }

    return { sent: true, status: response.status, response: responseBody };
  } finally {
    clearTimeout(timeout);
  }
}
