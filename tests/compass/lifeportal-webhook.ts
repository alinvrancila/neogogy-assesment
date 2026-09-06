/**
 * Life Portal CRM webhook payload mapping.
 *
 * These checks stay offline. The live endpoint requires a production signing
 * secret, so the useful regression coverage here is that assessment records
 * become the contact, attribution and assessment metadata Life Portal expects.
 */
import type { LeadRecord } from '@/lib/storage';
import { buildLifePortalContactPayload, isLifePortalWebhookEnabled } from '@/lib/lifePortalWebhook';

let pass = 0; let fail = 0;
const ok = (name: string, cond: boolean, got?: unknown) => {
  if (cond) { pass += 1; console.log('  ok   ', name); }
  else { fail += 1; console.log('  FAIL ', name, got !== undefined ? `got ${JSON.stringify(got)}` : ''); }
};

process.env.LIFE_PORTAL_WEBHOOK_ENABLED = 'true';
delete process.env.LIFE_PORTAL_WEBHOOK_SECRET;

const lead: LeadRecord = {
  id: 'lead-123',
  name: 'Ana Learner',
  firstName: 'Ana',
  lastName: 'Learner',
  email: 'ana@example.edu',
  mobilePhone: '+63 917 123 4567',
  heardFrom: 'LinkedIn',
  role: 'student',
  modality: '',
  consent: true,
  persona: 'reflective-operator',
  personaName: 'Reflective Operator',
  overall: 72.346,
  dimensions: {
    fluency: 77.74,
    agency: 61.21,
  },
  answers: { q1: 5 },
  baseline: { b1: 4, b2: 3 },
  usageVal: 4,
  createdAt: '2026-09-06T05:30:00.000Z',
  engineVersion: 2,
  result: {
    composites: { futureReadiness: 74.44, judgment: 68.12 },
    strengths: [{ construct: 'fluency', score: 77.74 }],
    vulnerabilities: [{ construct: 'agency', score: 61.21 }],
    riskSignals: [{ tag: 'unchecked_output', severity: 'watch', construct: 'verification' }],
  },
  stage: 7,
  stageName: 'AI Integrated',
  archetypeId: 'reflective-operator',
  archetypeName: 'Reflective Operator',
  confidence: 'moderate',
  meta: {
    landingPath: '/student',
    referrerHost: 'linkedin.com',
    referrerPath: '/feed',
    utmSource: 'linkedin',
    utmMedium: 'social',
    utmCampaign: 'fall-open-house',
    utmContent: 'student-assessment',
    clickId: 'li_fat_id',
    country: 'Philippines',
    countryCode: 'PH',
    city: 'Manila',
    timezone: 'Asia/Manila',
    device: 'phone',
    browser: 'Safari',
    os: 'iOS',
    language: 'en-PH',
  },
};

const payload = buildLifePortalContactPayload(lead, {
  pageUrl: 'https://assessment.neogogy.ai/student',
  referrer: 'https://linkedin.com/feed',
});

console.log('\nLife Portal contact payload');
ok('the webhook stays disabled without the server signing secret', !isLifePortalWebhookEnabled());
ok('external id is stable from the lead id', payload.external_id === 'neogogy-assessment-lead-123', payload.external_id);
ok('contact identity maps name and email', payload.contact.full_name === 'Ana Learner' && payload.contact.email === 'ana@example.edu');
ok('mobile maps to both phone fields for CRM matching', payload.contact.phone === '+63 917 123 4567' && payload.contact.mobile_phone === '+63 917 123 4567');
ok('profile fields match Life Portal local assessment vocabulary',
  payload.experience === 'neogogy_assessment'
  && payload.experience_label === 'Neogogy Formation Compass'
  && payload.profile_type === 'student'
  && payload.archetype === 'reflective-operator'
  && payload.archetype_name === 'Reflective Operator'
  && payload.program_interest === 'LifeX Online Certificate',
  payload);
ok('default CRM stage is included without forcing a degree program',
  payload.contact.stage_code === 'inquiry'
  && payload.contact.program_code === undefined
  && payload.contact.academic_term_code === undefined,
  payload.contact);
ok('source of origin is left blank so Life Portal derives from attribution',
  payload.contact.source_of_origin_code === undefined,
  payload.contact);
ok('LifeX and Neogogy tags both travel', payload.contact.tags.includes('lifex') && payload.contact.tags.includes('neogogy'));
ok('browser attribution overrides defaults',
  payload.attribution.utmSource === 'linkedin'
  && payload.attribution.utmMedium === 'social'
  && payload.attribution.utmCampaign === 'fall-open-house',
  payload.attribution);
ok('page and referrer URLs are carried', payload.attribution.pageUrl === 'https://assessment.neogogy.ai/student'
  && payload.attribution.referrer === 'https://linkedin.com/feed');
ok('assessment summary carries result fields',
  payload.assessment.stage === 7
  && payload.assessment.profileType === 'student'
  && payload.assessment.experience === 'neogogy_assessment'
  && payload.assessment.programInterest === 'LifeX Online Certificate'
  && payload.assessment.developmentalIndex === 72.3
  && payload.assessment.dimensions?.fluency === 77.7
  && payload.assessment.composites?.futureReadiness === 74.4,
  payload.assessment);
ok('device and location summaries are mapped',
  payload.assessment.device?.device === 'phone'
  && payload.assessment.location?.countryCode === 'PH',
  payload.assessment);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
