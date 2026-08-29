/**
 * Cohort analytics over stored submissions.
 *
 * Pure functions over LeadRecord[]: no I/O, no scoring. Everything here reads
 * results the engine already produced, so a change in scoring changes these
 * numbers without any change here.
 *
 * Every figure carries its own n, because a mean over three people is not the
 * same claim as a mean over three hundred and the admin needs to see which
 * it is looking at.
 */
import type { LeadRecord, SubmissionMeta } from '@/lib/storage';
import type { CompassResult } from '@/engine';
import type { ConstructId } from '@/engine/types';
import { CONSTRUCTS, STAGES } from '@/engine/config';

export const CONSTRUCT_IDS = Object.keys(CONSTRUCTS) as ConstructId[];

/** Free and disposable domains never represent an organisation. */
const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com', 'hotmail.com', 'outlook.com',
  'live.com', 'msn.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'proton.me',
  'protonmail.com', 'gmx.com', 'mail.com', 'zoho.com', 'yandex.com', 'qq.com', '163.com',
]);

export interface Attempt {
  id: string;
  email: string;
  name: string;
  persona: string;
  createdAt: string;
  result: CompassResult;
  rescored: boolean;
  /** Everything asked of the respondent outside the scored items. */
  heardFrom: string;
  consent: boolean;
  hasPhone: boolean;
  answers: Record<string, number>;
  baseline: { b1: number; b2: number } | null;
  meta?: SubmissionMeta;
}

/** One person, with every attempt they have made, oldest first. */
export interface Person {
  email: string;
  name: string;
  domain: string;
  isOrganisational: boolean;
  attempts: Attempt[];
  latest: Attempt;
  first: Attempt;
  /** Index movement between first and latest, when there is more than one. */
  indexDelta?: number;
  stageDelta?: number;
  direction: 'improved' | 'declined' | 'held' | 'single';
}

const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const round1 = (n: number) => Math.round(n * 10) / 10;

export const domainOf = (email: string): string => {
  const at = (email || '').trim().toLowerCase().split('@');
  return at.length === 2 ? at[1] : '';
};

export const isOrgDomain = (domain: string) =>
  !!domain && !PERSONAL_DOMAINS.has(domain);

/** Turn stored records into attempts, dropping anything without a v2 result. */
export function toAttempts(leads: LeadRecord[]): Attempt[] {
  return leads
    .filter((l) => l.engineVersion === 2 && l.result)
    .map((l) => ({
      id: l.id,
      email: (l.email || '').trim().toLowerCase(),
      name: l.name || '',
      persona: l.role || (l.result as CompassResult).persona || 'unknown',
      createdAt: l.createdAt || '',
      result: l.result as CompassResult,
      rescored: !!l.rescoredFrom,
      heardFrom: (l.heardFrom || '').trim(),
      consent: !!l.consent,
      hasPhone: !!(l.mobilePhone || '').trim(),
      answers: (l.answers || {}) as Record<string, number>,
      baseline: l.baseline ?? null,
      meta: l.meta,
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Group attempts into people, keyed by email. */
export function toPeople(attempts: Attempt[]): Person[] {
  const byEmail = new Map<string, Attempt[]>();
  for (const a of attempts) {
    if (!a.email) continue;
    const list = byEmail.get(a.email) ?? [];
    list.push(a);
    byEmail.set(a.email, list);
  }
  const people: Person[] = [];
  for (const [email, list] of byEmail) {
    const sorted = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const first = sorted[0];
    const latest = sorted[sorted.length - 1];
    const domain = domainOf(email);
    let direction: Person['direction'] = 'single';
    let indexDelta: number | undefined;
    let stageDelta: number | undefined;
    if (sorted.length > 1) {
      indexDelta = round1(latest.result.stage.rawIndex - first.result.stage.rawIndex);
      stageDelta = latest.result.stage.stage - first.result.stage.stage;
      direction = indexDelta > 1 ? 'improved' : indexDelta < -1 ? 'declined' : 'held';
    }
    people.push({
      email,
      name: latest.name || first.name,
      domain,
      isOrganisational: isOrgDomain(domain),
      attempts: sorted,
      first,
      latest,
      indexDelta,
      stageDelta,
      direction,
    });
  }
  return people.sort((a, b) => b.latest.createdAt.localeCompare(a.latest.createdAt));
}

/* ------------------------------------------------------------- statistics */

export interface Spread { n: number; mean: number; median: number; p25: number; p75: number; min: number; max: number }

export function spread(values: number[]): Spread {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return { n: 0, mean: 0, median: 0, p25: 0, p75: 0, min: 0, max: 0 };
  const at = (q: number) => v[Math.min(v.length - 1, Math.max(0, Math.floor(q * (v.length - 1))))];
  return {
    n: v.length,
    mean: round1(v.reduce((a, b) => a + b, 0) / v.length),
    median: round1(at(0.5)),
    p25: round1(at(0.25)),
    p75: round1(at(0.75)),
    min: round1(v[0]),
    max: round1(v[v.length - 1]),
  };
}

/** Pearson correlation, with the n it was computed over. */
export function correlate(xs: number[], ys: number[]): { r: number; n: number } {
  const pairs = xs.map((x, i) => [x, ys[i]] as const).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  const n = pairs.length;
  if (n < 3) return { r: 0, n };
  const mx = pairs.reduce((a, p) => a + p[0], 0) / n;
  const my = pairs.reduce((a, p) => a + p[1], 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of pairs) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
  const d = Math.sqrt(sxx * syy);
  return { r: d === 0 ? 0 : Math.round((sxy / d) * 100) / 100, n };
}

/* ------------------------------------------------------------- the cohort */

export interface DimensionStat { construct: ConstructId; name: string; reportedAsRisk: boolean; stat: Spread; watchShare: number }

export interface RiskSegment { id: string; label: string; description: string; emails: string[]; share: number }

export interface CohortReport {
  n: number;
  people: number;
  repeatTakers: number;
  generatedAt: string;
  index: Spread;
  /** Distributions, always with counts rather than only percentages. */
  stages: Array<{ stage: number; name: string; count: number }>;
  archetypes: Array<{ id: string; name: string; count: number }>;
  personas: Array<{ persona: string; count: number }>;
  usage: Array<{ level: number; count: number }>;
  confidence: Array<{ level: string; count: number }>;
  dimensions: DimensionStat[];
  /** Mean of each dimension within each persona, for the heatmap. */
  byPersona: Array<{ persona: string; n: number; index: number; dims: Record<string, number> }>;
  composites: Record<string, Spread>;
  /** Health and harm indicators, each as a share of the cohort. */
  indicators: Array<{ id: string; label: string; count: number; share: number; tone: 'good' | 'watch' | 'bad'; note: string }>;
  segments: RiskSegment[];
  correlations: Array<{ label: string; r: number; n: number; note: string }>;
  patterns: Array<{ id: string; label: string; kind: string; count: number }>;
  movement: { tracked: number; improved: number; declined: number; held: number; meanDelta: number };
  calibration: { predictedWithinOneBand: number; tracked: number; feltHealthierThanMeasured: number };
  timeline: Array<{ month: string; count: number; meanIndex: number }>;
}

const shareOf = (count: number, total: number) => (total ? Math.round((count / total) * 1000) / 10 : 0);

export function buildCohortReport(attempts: Attempt[], people: Person[], now = new Date()): CohortReport {
  // One attempt per person (their latest) so a keen retaker cannot skew a cohort.
  const latest = people.map((p) => p.latest);
  const n = latest.length;
  const results = latest.map((a) => a.result);

  const countBy = <T extends string | number>(arr: T[]) => {
    const m = new Map<T, number>();
    for (const v of arr) m.set(v, (m.get(v) ?? 0) + 1);
    return m;
  };

  const stageCounts = countBy(results.map((r) => r.stage.stage));
  const archCounts = countBy(results.map((r) => r.archetype.id));
  const archNames = new Map(results.map((r) => [r.archetype.id, r.archetype.name]));
  const personaCounts = countBy(latest.map((a) => a.persona));
  const usageCounts = countBy(results.map((r) => r.usageProfile.usage));
  const confCounts = countBy(results.map((r) => r.overallConfidence));

  const dimValue = (r: CompassResult, c: ConstructId) => num(r.dimensions[c]?.score);

  const dimensions: DimensionStat[] = CONSTRUCT_IDS.map((c) => {
    const vals = results.map((r) => dimValue(r, c));
    const watch = results.filter((r) => r.dimensions[c]?.microState === 'watch').length;
    return {
      construct: c,
      name: CONSTRUCTS[c].reportedAsRisk ? 'Dependency Risk' : CONSTRUCTS[c].name,
      reportedAsRisk: !!CONSTRUCTS[c].reportedAsRisk,
      stat: spread(vals),
      watchShare: shareOf(watch, n),
    };
  });

  const personaKeys = [...new Set(latest.map((a) => a.persona))];
  const byPersona = personaKeys.map((persona) => {
    const rows = latest.filter((a) => a.persona === persona);
    const dims: Record<string, number> = {};
    for (const c of CONSTRUCT_IDS) dims[c] = spread(rows.map((a) => dimValue(a.result, c))).mean;
    return {
      persona,
      n: rows.length,
      index: spread(rows.map((a) => a.result.stage.rawIndex)).mean,
      dims,
    };
  }).sort((a, b) => b.n - a.n);

  const composites: Record<string, Spread> = {};
  for (const key of ['futureReadiness', 'augmentation', 'judgment', 'capabilityTransfer', 'dependencyIndex', 'underexposure'] as const) {
    composites[key] = spread(results.map((r) => num(r.composites[key])));
  }

  // Indicators: the questions an administrator actually needs answered.
  const count = (fn: (r: CompassResult) => boolean) => results.filter(fn).length;
  const ind = (id: string, label: string, c: number, tone: 'good' | 'watch' | 'bad', note: string) =>
    ({ id, label, count: c, share: shareOf(c, n), tone, note });

  const indicators = [
    ind('depRisk', 'Elevated dependency risk', count((r) => r.composites.dependencyIndex >= 55), 'bad',
      'More of their capability depends on the tool being present.'),
    ind('lowVerify', 'Verification below 45', count((r) => num(r.dimensions.verification?.score) < 45), 'bad',
      'Confident output is being accepted without checking.'),
    ind('lowIndependence', 'Independent capability below 45', count((r) => num(r.dimensions.dependencySafety?.score) < 45), 'bad',
      'Work would be hard to reproduce without AI.'),
    ind('erosionRisk', 'Capable but eroding', count((r) =>
      num(r.dimensions.fluency?.score) >= 60 && num(r.dimensions.dependencySafety?.score) <= 45), 'bad',
      'Skilled with the tools while the underlying capability thins. The pattern this instrument exists to catch.'),
    ind('underexposed', 'Underexposed', count((r) => r.usageProfile.underexposed), 'watch',
      'Limited hands-on practice, a different risk from dependency.'),
    ind('gated', 'Held below their index by a gate', count((r) => !!r.stage.gated), 'watch',
      'Their score would reach a higher stage but a safety practice is short.'),
    ind('gapFlagged', 'Self-description ran ahead of behaviour', count((r) =>
      Object.values(r.dimensions).some((d) => d.consistencyGap?.flagged)), 'watch',
      'On at least one dimension, what they said and what they would do diverged.'),
    ind('lowConfidence', 'Preliminary or insufficient confidence', count((r) =>
      r.overallConfidence === 'preliminary' || r.overallConfidence === 'insufficient'), 'watch',
      'Thin evidence. Read these profiles cautiously.'),
    ind('healthy', 'Strong judgment and retained independence', count((r) =>
      num(r.dimensions.verification?.score) >= 65 && num(r.dimensions.dependencySafety?.score) >= 60), 'good',
      'Checking habits and independent capability both hold.'),
  ];

  // Named segments, with the emails so an administrator can act on them.
  const seg = (id: string, label: string, description: string, fn: (a: Attempt) => boolean): RiskSegment => {
    const emails = latest.filter(fn).map((a) => a.email);
    return { id, label, description, emails, share: shareOf(emails.length, n) };
  };
  const segments = [
    seg('eroding', 'Capable but eroding',
      'Fluent with AI, thin independent capability. Feels like success while it develops.',
      (a) => num(a.result.dimensions.fluency?.score) >= 60 && num(a.result.dimensions.dependencySafety?.score) <= 45),
    seg('uncritical', 'Using without checking',
      'Regular use with verification below the line.',
      (a) => a.result.usageProfile.usage >= 3 && num(a.result.dimensions.verification?.score) < 45),
    seg('underexposed', 'Underexposed',
      'Little hands-on practice and low fluency. The risk runs toward being unprepared rather than dependent.',
      (a) => a.result.usageProfile.underexposed),
    seg('selective', 'Deliberately selective',
      'Low use by choice, backed by judgment. Not the same as avoidance.',
      (a) => a.result.usageProfile.intentionalSelectiveUse),
    seg('strong', 'Healthy profile',
      'Judgment and independent capability both hold, with real fluency.',
      (a) => num(a.result.dimensions.verification?.score) >= 65
        && num(a.result.dimensions.dependencySafety?.score) >= 60
        && num(a.result.dimensions.fluency?.score) >= 55),
  ].filter((s) => s.emails.length > 0);

  // Relationships worth watching across a population.
  const col = (c: ConstructId) => results.map((r) => dimValue(r, c));
  const correlations = [
    { label: 'Usage against independent capability', ...correlate(results.map((r) => r.usageProfile.usage), col('dependencySafety')),
      note: 'Negative would mean heavier users retain less unaided capability.' },
    { label: 'Fluency against verification', ...correlate(col('fluency'), col('verification')),
      note: 'Low or negative would mean skill with the tools is not bringing checking with it.' },
    { label: 'Fluency against independent capability', ...correlate(col('fluency'), col('dependencySafety')),
      note: 'The erosion question: does getting better with AI cost unaided ability.' },
    { label: 'Transfer against skill growth', ...correlate(col('transfer'), col('skillGrowth')),
      note: 'Expected to be positive: work that transfers tends to build skill.' },
    { label: 'Agency against verification', ...correlate(col('agency'), col('verification')),
      note: 'Judgment tends to move together.' },
  ];

  const patternCounts = new Map<string, { label: string; kind: string; count: number }>();
  for (const r of results) {
    for (const p of r.patterns) {
      const prev = patternCounts.get(p.id);
      patternCounts.set(p.id, { label: p.label, kind: p.kind, count: (prev?.count ?? 0) + 1 });
    }
  }

  const tracked = people.filter((p) => p.attempts.length > 1);
  const movement = {
    tracked: tracked.length,
    improved: tracked.filter((p) => p.direction === 'improved').length,
    declined: tracked.filter((p) => p.direction === 'declined').length,
    held: tracked.filter((p) => p.direction === 'held').length,
    meanDelta: spread(tracked.map((p) => num(p.indexDelta))).mean,
  };

  const withCal = results.filter((r) => r.calibration.calibrationGap !== undefined);
  const calibration = {
    tracked: withCal.length,
    predictedWithinOneBand: withCal.filter((r) => Math.abs(num(r.calibration.calibrationGap)) <= 1).length,
    feltHealthierThanMeasured: results.filter((r) => num(r.calibration.desirabilityGap) >= 2).length,
  };

  const byMonth = new Map<string, number[]>();
  for (const a of latest) {
    const m = (a.createdAt || '').slice(0, 7);
    if (!m) continue;
    const list = byMonth.get(m) ?? [];
    list.push(a.result.stage.rawIndex);
    byMonth.set(m, list);
  }
  const timeline = [...byMonth.entries()].sort()
    .map(([month, vals]) => ({ month, count: vals.length, meanIndex: spread(vals).mean }));

  return {
    n,
    people: people.length,
    repeatTakers: tracked.length,
    generatedAt: now.toISOString(),
    index: spread(results.map((r) => r.stage.rawIndex)),
    stages: STAGES.map((s) => ({ stage: s.stage, name: s.name, count: stageCounts.get(s.stage) ?? 0 })),
    archetypes: [...archCounts.entries()]
      .map(([id, c]) => ({ id, name: archNames.get(id) ?? id, count: c }))
      .sort((a, b) => b.count - a.count),
    personas: [...personaCounts.entries()].map(([persona, c]) => ({ persona, count: c })).sort((a, b) => b.count - a.count),
    usage: [1, 2, 3, 4, 5].map((level) => ({ level, count: usageCounts.get(level) ?? 0 })),
    confidence: [...confCounts.entries()].map(([level, c]) => ({ level, count: c })),
    dimensions,
    byPersona,
    composites,
    indicators,
    segments,
    correlations,
    patterns: [...patternCounts.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.count - a.count),
    movement,
    calibration,
    timeline,
  };
}

/* --------------------------------------------------------- organisations */

export interface OrgReport {
  domain: string;
  people: number;
  attempts: number;
  index: Spread;
  dims: Record<string, number>;
  topArchetype: string;
  atRisk: number;
  underexposed: number;
  improved: number;
  declined: number;
}

/** Roll people up by email domain, excluding personal providers. */
export function buildOrgReports(people: Person[], minPeople = 2): OrgReport[] {
  const byDomain = new Map<string, Person[]>();
  for (const p of people) {
    if (!p.isOrganisational) continue;
    const list = byDomain.get(p.domain) ?? [];
    list.push(p);
    byDomain.set(p.domain, list);
  }
  const out: OrgReport[] = [];
  for (const [domain, members] of byDomain) {
    if (members.length < minPeople) continue;
    const results = members.map((m) => m.latest.result);
    const dims: Record<string, number> = {};
    for (const c of CONSTRUCT_IDS) dims[c] = spread(results.map((r) => num(r.dimensions[c]?.score))).mean;
    const archCount = new Map<string, number>();
    for (const r of results) archCount.set(r.archetype.name, (archCount.get(r.archetype.name) ?? 0) + 1);
    const topArchetype = [...archCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    out.push({
      domain,
      people: members.length,
      attempts: members.reduce((a, m) => a + m.attempts.length, 0),
      index: spread(results.map((r) => r.stage.rawIndex)),
      dims,
      topArchetype,
      atRisk: results.filter((r) =>
        num(r.dimensions.fluency?.score) >= 60 && num(r.dimensions.dependencySafety?.score) <= 45).length,
      underexposed: results.filter((r) => r.usageProfile.underexposed).length,
      improved: members.filter((m) => m.direction === 'improved').length,
      declined: members.filter((m) => m.direction === 'declined').length,
    });
  }
  return out.sort((a, b) => b.people - a.people);
}


/* ------------------------------------------------- audience and quality */

export interface AudienceReport {
  /** Where people say they heard about it. Asked at the gate, never shown before. */
  heardFrom: Array<{ label: string; count: number }>;
  /** Where the browser says they came from, which often disagrees with the above. */
  referrers: Array<{ label: string; count: number }>;
  campaigns: Array<{ label: string; count: number }>;
  devices: Array<{ label: string; count: number }>;
  /** Local hour of submission, for scheduling reminders. */
  hours: Array<{ hour: number; count: number }>;
  consentRate: number;
  phoneRate: number;
  /** Why light users say their use is low. Collected since v2, never surfaced. */
  lowUseReasons: Array<{ label: string; count: number }>;
  known: number;
}

const LOW_USE_LABELS: Record<number, string> = {
  1: 'Deliberately selective',
  2: 'Access, cost or rules limit me',
  3: 'Privacy or trust concerns',
  4: 'Do not know how or where it helps',
  5: 'Tried it and did not find it useful',
};

const tally = (values: string[]): Array<{ label: string; count: number }> => {
  const m = new Map<string, number>();
  for (const v of values) { if (v) m.set(v, (m.get(v) ?? 0) + 1); }
  return [...m.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
};

export function buildAudienceReport(latest: Attempt[]): AudienceReport {
  const n = latest.length;
  const hourCounts = new Map<number, number>();
  for (const a of latest) {
    const h = a.meta?.localHour;
    if (typeof h === 'number') hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1);
  }
  return {
    heardFrom: tally(latest.map((a) => a.heardFrom || 'Not answered')),
    referrers: tally(latest.map((a) => a.meta?.referrerHost || '').filter(Boolean)),
    campaigns: tally(latest.map((a) => [a.meta?.utmSource, a.meta?.utmCampaign].filter(Boolean).join(' / ')).filter(Boolean)),
    devices: tally(latest.map((a) => a.meta?.device || '').filter(Boolean)),
    hours: [...hourCounts.entries()].sort((a, b) => a[0] - b[0]).map(([hour, count]) => ({ hour, count })),
    consentRate: shareOfPublic(latest.filter((a) => a.consent).length, n),
    phoneRate: shareOfPublic(latest.filter((a) => a.hasPhone).length, n),
    lowUseReasons: tally(latest
      .map((a) => a.answers.lowuse_reason)
      .filter((v): v is number => typeof v === 'number')
      .map((v) => LOW_USE_LABELS[v] ?? `Option ${v}`)),
    known: latest.filter((a) => a.meta).length,
  };
}

const shareOfPublic = (count: number, total: number) => (total ? Math.round((count / total) * 1000) / 10 : 0);

export interface QualityReport {
  /** Completion time, where it was recorded. */
  duration: Spread;
  durationKnown: number;
  fastCount: number;
  revisions: Spread;
  /** Longest run of identical answers, a proxy for straight-lining. */
  straightLining: Spread;
  suspect: Array<{ email: string; reason: string }>;
  notApplicableRate: number;
  lowConfidenceRate: number;
}

/** Longest run of the same answer, walking the items in presentation order. */
export function longestRun(answers: Record<string, number>, keys: string[]): number {
  let best = 0, run = 0, prev: number | undefined;
  for (const k of keys) {
    const v = answers[k];
    if (v === undefined) continue;
    run = v === prev ? run + 1 : 1;
    prev = v;
    if (run > best) best = run;
  }
  return best;
}

export function buildQualityReport(latest: Attempt[], minutesFloor = 3): QualityReport {
  const durations = latest.map((a) => a.meta?.durationMs).filter((v): v is number => typeof v === 'number');
  const runs = latest.map((a) => longestRun(a.answers, Object.keys(a.answers)));
  const suspect: Array<{ email: string; reason: string }> = [];

  latest.forEach((a, i) => {
    const mins = a.meta?.durationMs ? a.meta.durationMs / 60000 : undefined;
    const reasons: string[] = [];
    if (mins !== undefined && mins < minutesFloor) reasons.push(`finished in ${mins.toFixed(1)} minutes`);
    if (runs[i] >= 12) reasons.push(`${runs[i]} identical answers in a row`);
    if (a.result.overallConfidence === 'insufficient') reasons.push('insufficient evidence');
    if (reasons.length) suspect.push({ email: a.email, reason: reasons.join(', ') });
  });

  const outcomeKeys = ['out_begin', 'out_explain', 'out_persist'];
  let outcomeAnswered = 0, outcomeNa = 0;
  for (const a of latest) {
    for (const k of outcomeKeys) {
      const v = a.answers[k];
      if (v === undefined) continue;
      outcomeAnswered++;
      if (v === 0) outcomeNa++;
    }
  }

  return {
    duration: spread(durations.map((d) => Math.round((d / 60000) * 10) / 10)),
    durationKnown: durations.length,
    fastCount: durations.filter((d) => d / 60000 < minutesFloor).length,
    revisions: spread(latest.map((a) => a.meta?.revisions ?? 0)),
    straightLining: spread(runs),
    suspect: suspect.slice(0, 40),
    notApplicableRate: shareOfPublic(outcomeNa, outcomeAnswered),
    lowConfidenceRate: shareOfPublic(
      latest.filter((a) => a.result.overallConfidence === 'preliminary' || a.result.overallConfidence === 'insufficient').length,
      latest.length),
  };
}

/* ---------------------------------------------------------- item review */

export interface ItemStat {
  id: string;
  construct: string;
  type: string;
  n: number;
  mean: number;
  /** Share choosing each option, so a dead option is visible. */
  distribution: Array<{ value: number; count: number }>;
  /**
   * How strongly the item tracks its own dimension. A near-zero value means
   * the question is not distinguishing anyone and is a candidate for rewriting.
   */
  discrimination: number;
}

/**
 * Item level review, computed from stored raw answers.
 *
 * This is what tells you whether a question is earning its place: a flat
 * distribution with near-zero discrimination is a question everyone answers
 * the same way, which costs a respondent time and tells you nothing.
 */
export function buildItemStats(latest: Attempt[], itemMeta: Array<{ id: string; construct?: string; type: string }>): ItemStat[] {
  const out: ItemStat[] = [];
  for (const item of itemMeta) {
    const rows = latest.filter((a) => a.answers[item.id] !== undefined);
    if (rows.length < 3) continue;
    const values = rows.map((a) => a.answers[item.id]);
    const dist = new Map<number, number>();
    for (const v of values) dist.set(v, (dist.get(v) ?? 0) + 1);
    const dimScores = item.construct
      ? rows.map((a) => num((a.result.dimensions as Record<string, { score: number }>)[item.construct!]?.score))
      : [];
    out.push({
      id: item.id,
      construct: item.construct ?? '',
      type: item.type,
      n: rows.length,
      mean: spread(values).mean,
      distribution: [...dist.entries()].sort((a, b) => a[0] - b[0]).map(([value, count]) => ({ value, count })),
      discrimination: item.construct ? correlate(values, dimScores).r : 0,
    });
  }
  return out.sort((a, b) => Math.abs(a.discrimination) - Math.abs(b.discrimination));
}
