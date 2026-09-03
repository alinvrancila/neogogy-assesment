/**
 * The group reading.
 *
 * Everything here is aggregation. It computes nothing new about a person and it
 * writes no prose about one: it takes results the engine has already produced
 * and answers the questions a school, a department or an owner actually asks.
 * Where is this group standing, how widely is it spread, what is holding most
 * of it, and what would move it up.
 *
 * Four rules hold it honest.
 *
 * A group is not a person. The centre is a count of where most people stand,
 * never ten dimensions averaged into a respondent who does not exist, and a
 * spread is printed beside every middle.
 *
 * Counts lead and decimals describe. Below thirty respondents there are no
 * confidence intervals and no correlations, because at that size they would
 * dress noise as a finding.
 *
 * Nobody is named, ranked or singled out. There is no furthest respondent and
 * no per-person row anywhere in this module or in what it feeds.
 *
 * Nothing is invented to fill a page. Every practice offered to a group is one
 * the engine already gave to people inside it, tallied.
 */

import { ARCHETYPES } from './archetypes';
import { CONSTRUCTS, SCORING, STAGES, VERSIONS } from './config';
import type { CompassResult, ConstructId, Persona } from './types';
import { stageName } from './display';

/** Plain labels for a cover and a legend. The engine keeps its own, short. */
const PERSONA_LABEL: Record<Persona, string> = {
  student: 'Student', teacher: 'Teacher', parent: 'Parent',
  administrator: 'Leader / Administrator', pastor: 'Minister / Preacher',
  business: 'Business Owner',
  professional: 'Professional',
};

/* -------------------------------------------------------------- the inputs */

export interface GroupMember {
  /** Pseudonymous. Held only so a person is counted once, never printed. */
  key: string;
  persona: Persona;
  result: CompassResult;
  takenAt: string;
  /** Reported use band, 1 to 5, from the respondent's own answer. */
  usage: number;
  /** The two unscored calibration answers, 1 to 5, when they were given. */
  felt?: number | null;
  predicted?: number | null;
  /** Index movement between a person's first and latest attempt. */
  indexDelta?: number;
  /** Their earlier stage, for the transition matrix. */
  priorStage?: number;
  /** Segment keys. Only what the platform already knows, until the cohort
   *  modules in the collection layer are collecting more. */
  segments?: Record<string, string>;
}

/* ------------------------------------------------------------ the vocabulary */

/** One canonical band table per scoring version, printed in the appendix. */
export const BANDS = {
  strength: SCORING.strengthFloor,
  vulnerability: SCORING.vulnerabilityCeiling,
  strong: SCORING.microStrong,
  watch: SCORING.microWatch,
} as const;

/** Descriptive figures need seven, anything sensitive needs ten. */
export const SUPPRESSION = { descriptive: 7, sensitive: 10 } as const;

/** Below this, no confidence intervals and no correlations. */
export const INFERENCE_FLOOR = 30;

export interface Spread {
  n: number; median: number; q1: number; q3: number; min: number; max: number;
  /** Available for the export. Never the headline. */
  mean: number; sd: number; range: number;
  /** A ninety five percent interval on the median, at n of thirty or more. */
  ci?: { low: number; high: number };
}

export interface BandShares {
  strong: { n: number; share: number };
  developing: { n: number; share: number };
  watch: { n: number; share: number };
}

export interface GroupDimension {
  construct: ConstructId;
  name: string;
  /** Dependency Risk is stored canonically and read low-is-healthier. */
  lowerIsHealthier: boolean;
  spread: Spread;
  bands: BandShares;
  /** Both a strength and a vulnerability present: coach in segments, not as one. */
  polarised: boolean;
  /** Nobody strong and the middle below the vulnerability line: one shared practice. */
  uniformlyLow: boolean;
  evidence: { median: number; min: number };
  confidence: Record<string, number>;
}

export interface GroupCount { n: number; share: number }

export interface Quadrant { key: string; label: string; n: number; share: number; action: string }

export interface SegmentReading {
  dimension: string;
  value: string;
  n: number;
  /** Withheld rather than shown when a cell could identify somebody. */
  suppressed: boolean;
  index?: Spread;
  modalStage?: { stage: number; stageName: string; n: number };
  constraint?: { name: string; n: number };
}

export interface GroupResult {
  label: string;
  n: number;
  generatedAt: string;
  window: { first: string; last: string };
  versions: typeof VERSIONS;
  bands: typeof BANDS;

  personas: Array<{ persona: Persona; label: string; n: number; share: number }>;

  /* placement */
  index: Spread;
  distribution: Array<{ stage: number; stageName: string; n: number; share: number }>;
  centre: { stage: number; stageName: string; n: number; share: number };
  shape: 'tight' | 'moderate' | 'spread' | 'two groups';
  earlyRoute: GroupCount;
  gateHeld: { total: GroupCount; byGate: Array<{ construct: ConstructId; name: string; n: number }> };
  movableMiddle: Array<{ from: number; into: number; intoName: string; n: number }>;

  /* dimensions and composites */
  dimensions: GroupDimension[];
  composites: Array<{ id: string; label: string; lowerIsHealthier: boolean; spread: Spread }>;
  strengths: GroupDimension[];
  watchlist: GroupDimension[];
  correlations: Array<{ a: string; b: string; rho: number; n: number }>;

  /* profile */
  archetypes: Array<{ id: string; name: string; n: number; share: number }>;
  patterns: { help: Array<{ id: string; label: string; n: number; share: number }>;
    harm: Array<{ id: string; label: string; n: number; share: number }>;
    noHarm: GroupCount };

  /* calibration */
  calibration: {
    felt: { healthier: GroupCount; matched: GroupCount; lessHealthy: GroupCount; medianGap: number; n: number };
    predicted: { accurate: GroupCount; withinOne: GroupCount; wider: GroupCount; n: number };
  };

  /* what holds the group, and what moves it */
  constraints: Array<{ construct: ConstructId; name: string; n: number; share: number }>;
  lowestScores: Array<{ construct: ConstructId; name: string; n: number; share: number }>;
  concentration: { share: number; reading: 'one intervention reaches most' | 'mixed' | 'fragmented' };
  moves: Array<{ capability: string; change: string; practice: string; priority: string; n: number; share: number }>;
  stagePlan: Array<{ stage: number; stageName: string; n: number; movable: number; into: number; intoName: string; requirements: string[] }>;
  nextStage: { stage: number; stageName: string; requirements: string[] };

  /* crosses */
  quadrants: { capabilityUse: Quadrant[]; fluencyJudgment: Quadrant[]; deliberateNonUse: GroupCount };

  /* governance readings the assessment itself carries */
  governance: Array<{ construct: ConstructId; name: string; atOrBelowVulnerability: GroupCount }>;

  /* headline */
  headline: {
    healthyAdoption: GroupCount & { components: string[] };
    notCollected: string[];
  };

  flags: {
    gated: GroupCount; underexposed: GroupCount; eroding: GroupCount;
    lowConfidence: GroupCount; intentionalLowUse: GroupCount;
  };

  segments: SegmentReading[];

  movement: {
    repeatTakers: number; improved: number; declined: number; held: number; medianDelta: number;
    transitions: Array<{ from: number; into: number; n: number }>;
  };

  confidence: { level: 'indicative' | 'workable' | 'firm'; note: string };
}

/* ------------------------------------------------------------------ helpers */

const round1 = (n: number) => Math.round(n * 10) / 10;
const shareOf = (n: number, total: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);
const count = (hits: number, total: number): GroupCount => ({ n: hits, share: shareOf(hits, total) });

export function spreadOf(values: number[]): Spread {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return { n: 0, median: 0, q1: 0, q3: 0, min: 0, max: 0, mean: 0, sd: 0, range: 0 };
  const at = (q: number) => v[Math.min(v.length - 1, Math.max(0, Math.round(q * (v.length - 1))))];
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length);
  const s: Spread = {
    n: v.length, median: round1(at(0.5)), q1: round1(at(0.25)), q3: round1(at(0.75)),
    min: round1(v[0]), max: round1(v[v.length - 1]), mean: round1(mean), sd: round1(sd),
    range: round1(v[v.length - 1] - v[0]),
  };
  if (v.length >= INFERENCE_FLOOR) {
    // Distribution free interval on the median: the usual order statistic rule.
    const k = Math.floor((v.length - 1.96 * Math.sqrt(v.length)) / 2);
    const lo = Math.max(0, k), hi = Math.min(v.length - 1, v.length - 1 - k);
    s.ci = { low: round1(v[lo]), high: round1(v[hi]) };
  }
  return s;
}

/** Spearman's rho, used only where the cohort is large enough to carry it. */
export function spearman(xs: number[], ys: number[]): number {
  const n = xs.length;
  const rank = (arr: number[]) => {
    const idx = arr.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
    const out = new Array<number>(n);
    let i = 0;
    while (i < n) {
      let j = i;
      while (j + 1 < n && idx[j + 1][0] === idx[i][0]) j++;
      const r = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) out[idx[k][1]] = r;
      i = j + 1;
    }
    return out;
  };
  const rx = rank(xs), ry = rank(ys);
  const mx = rx.reduce((a, b) => a + b, 0) / n, my = ry.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (rx[i] - mx) * (ry[i] - my);
    dx += (rx[i] - mx) ** 2;
    dy += (ry[i] - my) ** 2;
  }
  return dx && dy ? Math.round((num / Math.sqrt(dx * dy)) * 100) / 100 : 0;
}

const bandsOf = (scores: number[]): BandShares => {
  const n = scores.length;
  const strong = scores.filter((s) => s >= BANDS.strong).length;
  const watch = scores.filter((s) => s < BANDS.watch).length;
  return {
    strong: count(strong, n),
    developing: count(n - strong - watch, n),
    watch: count(watch, n),
  };
};

const minIndexOf = (stage: number) => STAGES.find((s) => s.stage === stage)?.minIndex ?? 0;

/* ------------------------------------------------------------- the reading */

export function buildGroupResult(
  label: string, members: GroupMember[], now = new Date()
): GroupResult {
  if (!members.length) throw new Error('A group reading needs at least one member.');

  const n = members.length;
  const results = members.map((m) => m.result);
  const some = (pred: (r: CompassResult) => boolean) => count(results.filter(pred).length, n);

  const dates = members.map((m) => m.takenAt).sort();
  const window = { first: dates[0], last: dates[dates.length - 1] };

  const byPersona = new Map<Persona, number>();
  for (const m of members) byPersona.set(m.persona, (byPersona.get(m.persona) ?? 0) + 1);
  const personas = [...byPersona.entries()]
    .map(([persona, c]) => ({
      persona, label: PERSONA_LABEL[persona] ?? persona, n: c, share: shareOf(c, n),
    }))
    .sort((a, b) => b.n - a.n);
  const lead = personas[0].persona;

  /* ---- placement */
  const index = spreadOf(results.map((r) => r.stage.rawIndex));

  const stageCounts = new Map<number, number>();
  for (const r of results) stageCounts.set(r.stage.stage, (stageCounts.get(r.stage.stage) ?? 0) + 1);
  const distribution = [...stageCounts.entries()]
    .map(([stage, c]) => ({ stage, stageName: stageName(lead, stage), n: c, share: shareOf(c, n) }))
    .sort((a, b) => a.stage - b.stage);
  const centre = [...distribution].sort((a, b) => b.n - a.n || a.stage - b.stage)[0];

  // Two groups: a gap of three or more empty stages between occupied camps.
  const occupied = distribution.map((d) => d.stage);
  const biggestGap = occupied.reduce((g, s, i) => (i ? Math.max(g, s - occupied[i - 1]) : 0), 0);
  const shape: GroupResult['shape'] = biggestGap >= 4 ? 'two groups'
    : index.sd < 10 ? 'tight' : index.sd < 18 ? 'moderate' : 'spread';

  const earlyRoute = some((r) => r.stage.stage <= 3);

  const gateCounts = new Map<ConstructId, number>();
  for (const r of results) {
    for (const reason of r.stage.gated?.reasons ?? []) {
      const hit = (Object.keys(CONSTRUCTS) as ConstructId[])
        .find((c) => reason.toLowerCase().includes(CONSTRUCTS[c].name.toLowerCase().split(' ')[0].toLowerCase()));
      if (hit) gateCounts.set(hit, (gateCounts.get(hit) ?? 0) + 1);
    }
  }
  const gateHeld = {
    total: some((r) => !!r.stage.gated),
    byGate: [...gateCounts.entries()]
      .map(([construct, c]) => ({ construct, name: CONSTRUCTS[construct].name, n: c }))
      .sort((a, b) => b.n - a.n),
  };

  // Within five index points of the next camp, or gated with every shortfall close.
  const movableBy = new Map<number, { into: number; n: number }>();
  for (const r of results) {
    const next = r.stage.stage + 1;
    if (next > STAGES.length) continue;
    const close = minIndexOf(next) - r.stage.rawIndex <= 5;
    if (close || r.stage.gated) {
      const hit = movableBy.get(r.stage.stage) ?? { into: next, n: 0 };
      hit.n += 1;
      movableBy.set(r.stage.stage, hit);
    }
  }
  const movableMiddle = [...movableBy.entries()]
    .map(([from, v]) => ({ from, into: v.into, intoName: stageName(lead, v.into), n: v.n }))
    .sort((a, b) => a.from - b.from);

  /* ---- dimensions */
  const dimensions: GroupDimension[] = (Object.keys(CONSTRUCTS) as ConstructId[]).map((c) => {
    const def = CONSTRUCTS[c];
    const scores = results.map((r) => r.dimensions[c]?.score ?? 0);
    const spread = spreadOf(scores);
    const conf: Record<string, number> = {};
    for (const r of results) {
      const k = r.dimensions[c]?.confidence ?? 'insufficient';
      conf[k] = (conf[k] ?? 0) + 1;
    }
    const ev = results.map((r) => r.dimensions[c]?.evidenceCount ?? 0);
    const hasStrength = scores.some((s) => s >= BANDS.strength);
    const hasVulnerability = scores.some((s) => s <= BANDS.vulnerability);
    return {
      construct: c,
      name: def.name,
      lowerIsHealthier: !!def.reportedAsRisk,
      spread,
      bands: bandsOf(scores),
      polarised: hasStrength && hasVulnerability,
      uniformlyLow: !hasStrength && spread.median <= BANDS.vulnerability,
      evidence: { median: spreadOf(ev).median, min: Math.min(...ev) },
      confidence: conf,
    };
  });
  const byMedian = [...dimensions].sort((a, b) => b.spread.median - a.spread.median);
  const strengths = byMedian.slice(0, 3);
  const watchlist = [...byMedian].reverse().slice(0, 3);

  const COMPOSITES: Array<{ id: keyof CompassResult['composites']; label: string; low: boolean }> = [
    { id: 'futureReadiness', label: 'Future readiness', low: false },
    { id: 'augmentation', label: 'Augmentation', low: false },
    { id: 'judgment', label: 'Judgment', low: false },
    { id: 'capabilityTransfer', label: 'Capability transfer', low: false },
    { id: 'dependencyIndex', label: 'Dependency index', low: true },
    { id: 'underexposure', label: 'Underexposure', low: true },
  ];
  const composites = COMPOSITES.map((c) => ({
    id: c.id, label: c.label, lowerIsHealthier: c.low,
    spread: spreadOf(results.map((r) => r.composites[c.id])),
  }));

  const correlations = n >= INFERENCE_FLOOR ? [
    ['fluency', 'dependencySafety', 'AI Fluency', 'Independent Capability'],
    ['fluency', 'verification', 'AI Fluency', 'Verification & Judgment'],
  ].map(([a, b, an, bn]) => ({
    a: an, b: bn, n,
    rho: spearman(
      results.map((r) => r.dimensions[a as ConstructId].score),
      results.map((r) => r.dimensions[b as ConstructId].score),
    ),
  })).concat([{
    a: 'Developmental index', b: 'Judgment composite', n,
    rho: spearman(results.map((r) => r.stage.rawIndex), results.map((r) => r.composites.judgment)),
  }]) : [];

  /* ---- profile */
  const archCounts = new Map<string, number>();
  for (const r of results) archCounts.set(r.archetype.id, (archCounts.get(r.archetype.id) ?? 0) + 1);
  const archetypes = ARCHETYPES.map((a) => ({
    id: a.id, name: a.name, n: archCounts.get(a.id) ?? 0, share: shareOf(archCounts.get(a.id) ?? 0, n),
  })).sort((a, b) => b.n - a.n);

  const tally = (kind: 'help' | 'harm') => {
    const m = new Map<string, { label: string; n: number }>();
    for (const r of results) {
      for (const p of r.patterns) {
        if (p.kind !== kind) continue;
        const hit = m.get(p.id) ?? { label: p.label, n: 0 };
        hit.n += 1;
        m.set(p.id, hit);
      }
    }
    return [...m.entries()].map(([id, v]) => ({ id, label: v.label, n: v.n, share: shareOf(v.n, n) }))
      .sort((a, b) => b.n - a.n);
  };
  const patterns = {
    help: tally('help'),
    harm: tally('harm'),
    noHarm: some((r) => !r.patterns.some((p) => p.kind === 'harm')),
  };

  /* ---- calibration */
  const measuredBand = (i: number) => (i >= 80 ? 5 : i >= 62 ? 4 : i >= 44 ? 3 : i >= 26 ? 2 : 1);
  const feltGaps: number[] = [];
  let feltHealthier = 0, feltMatched = 0, feltLess = 0;
  let predAccurate = 0, predWithin = 0, predWider = 0, predN = 0;
  for (const m of members) {
    const band = measuredBand(m.result.stage.rawIndex);
    if (typeof m.felt === 'number') {
      const gap = m.felt - band;
      feltGaps.push(gap);
      if (gap > 0) feltHealthier++; else if (gap === 0) feltMatched++; else feltLess++;
    }
    if (typeof m.predicted === 'number') {
      predN++;
      const gap = Math.abs(m.predicted - band);
      if (gap === 0) predAccurate++; else if (gap === 1) predWithin++; else predWider++;
    }
  }
  const feltN = feltGaps.length;
  const calibration = {
    felt: {
      healthier: count(feltHealthier, feltN || 1), matched: count(feltMatched, feltN || 1),
      lessHealthy: count(feltLess, feltN || 1), medianGap: spreadOf(feltGaps).median, n: feltN,
    },
    predicted: {
      accurate: count(predAccurate, predN || 1), withinOne: count(predWithin, predN || 1),
      wider: count(predWider, predN || 1), n: predN,
    },
  };

  /* ---- what holds the group */
  const tallyBy = (pick: (r: CompassResult) => ConstructId | null) => {
    const m = new Map<ConstructId, number>();
    for (const r of results) {
      const c = pick(r);
      if (c) m.set(c, (m.get(c) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([construct, c]) => ({ construct, name: CONSTRUCTS[construct].name, n: c, share: shareOf(c, n) }))
      .sort((a, b) => b.n - a.n);
  };
  const constraints = tallyBy((r) => (r.bottleneck?.saturated ? null : r.bottleneck?.construct ?? null));
  const lowestScores = tallyBy((r) => (Object.keys(CONSTRUCTS) as ConstructId[])
    .reduce((lo, c) => (r.dimensions[c].score < r.dimensions[lo].score ? c : lo), 'agency' as ConstructId));
  const topShare = constraints[0]?.share ?? 0;
  const concentration = {
    share: topShare,
    reading: (topShare > 50 ? 'one intervention reaches most'
      : topShare >= 33 ? 'mixed' : 'fragmented') as GroupResult['concentration']['reading'],
  };

  const moveCounts = new Map<string, { capability: string; change: string; practice: string; priority: string; n: number }>();
  for (const r of results) {
    for (const rec of r.recommendations) {
      const key = `${rec.capability}::${rec.behaviorChange}`;
      const hit = moveCounts.get(key);
      if (hit) hit.n += 1;
      else moveCounts.set(key, {
        capability: rec.capability, change: rec.behaviorChange, practice: rec.practice,
        priority: rec.priority, n: 1,
      });
    }
  }
  const moves = [...moveCounts.values()].sort((a, b) => b.n - a.n).slice(0, 8)
    .map((m) => ({ ...m, share: shareOf(m.n, n) }));

  const stagePlan = distribution.map((d) => {
    const into = Math.min(d.stage + 1, STAGES.length);
    const def = STAGES.find((s) => s.stage === d.stage);
    const example = results.find((r) => r.stage.stage === d.stage);
    return {
      stage: d.stage, stageName: d.stageName, n: d.n,
      movable: movableMiddle.find((m) => m.from === d.stage)?.n ?? 0,
      into, intoName: stageName(lead, into),
      requirements: d.stage >= STAGES.length
        ? ['Hold the practice. The route treats the final stage as something maintained rather than reached.']
        : (example?.nextTarget.requirements ?? def?.transitionRequirements ?? []).filter(Boolean),
    };
  });
  const centreNext = results.find((r) => r.stage.stage === centre.stage)?.nextTarget;
  const atSummit = centre.stage >= STAGES.length;
  const nextStage = {
    stage: atSummit ? STAGES.length : centre.stage + 1,
    stageName: stageName(lead, atSummit ? STAGES.length : centre.stage + 1),
    requirements: atSummit
      ? ['The centre of this group is at the final stage. From here the work is holding it.']
      : (centreNext?.requirements ?? []).filter(Boolean),
  };

  /* ---- crosses */
  const deliberate = members.filter((m) => m.result.usageProfile.intentionalSelectiveUse);
  const scored = members.filter((m) => !m.result.usageProfile.intentionalSelectiveUse);
  const highUse = (m: GroupMember) => m.usage >= 4;
  const highCap = (m: GroupMember) => m.result.stage.rawIndex >= 55;
  const cell = (key: string, label: string, pred: (m: GroupMember) => boolean, action: string): Quadrant => {
    const c = scored.filter(pred).length;
    return { key, label, n: c, share: shareOf(c, n), action };
  };
  const capabilityUse = [
    cell('hh', 'Capable and using it', (m) => highCap(m) && highUse(m), 'Scale what they do and protect it.'),
    cell('hl', 'Capable, using little', (m) => highCap(m) && !highUse(m), 'Check access, relevance and whether the restraint is deliberate.'),
    cell('lh', 'Using it heavily, capability thin', (m) => !highCap(m) && highUse(m), 'The first development and control priority.'),
    cell('ll', 'Early on both', (m) => !highCap(m) && !highUse(m), 'Build safe foundations before pushing adoption.'),
  ];
  const fluencyJudgment = [
    cell('fu', 'Fluent and unprotected', (m) => m.result.dimensions.fluency.score >= BANDS.strength && m.result.composites.judgment < BANDS.strength, 'Judgment work, not tool training.'),
    cell('fw', 'Fluent, unprotected, watch', (m) => m.result.dimensions.fluency.score >= BANDS.strength && m.result.composites.judgment < 55, 'The subset to act on first.'),
    cell('fp', 'Fluent and protected', (m) => m.result.dimensions.fluency.score >= BANDS.strength && m.result.composites.judgment >= BANDS.strength, 'Where the practice is working.'),
    cell('nf', 'Not yet fluent', (m) => m.result.dimensions.fluency.score < BANDS.strength, 'Fluency first, with the guardrails taught alongside.'),
  ];
  const quadrants = { capabilityUse, fluencyJudgment, deliberateNonUse: count(deliberate.length, n) };

  /* ---- governance readings the assessment already carries */
  const governance = (['responsibleUse', 'verification', 'agency'] as ConstructId[]).map((c) => ({
    construct: c, name: CONSTRUCTS[c].name,
    atOrBelowVulnerability: some((r) => r.dimensions[c].score <= BANDS.vulnerability),
  }));

  /* ---- headline */
  const healthy = members.filter((m) => (m.usage >= 3 || m.result.usageProfile.intentionalSelectiveUse)
    && m.result.composites.judgment >= BANDS.strength
    && m.result.dimensions.responsibleUse.score >= BANDS.strength
    && m.result.dimensions.dependencySafety.score >= BANDS.strength).length;
  const headline = {
    healthyAdoption: {
      ...count(healthy, n),
      components: ['Regular or deliberately selective use', `Judgment composite at ${BANDS.strength} or above`,
        `Responsible Use at ${BANDS.strength} or above`, `Independent Capability at ${BANDS.strength} or above`],
    },
    notCollected: [
      'Verification coverage, disclosure and sign-off rates',
      'Task time, quality and rework against a baseline',
      'Capability retention from a matched task experiment',
      'Net task value, which needs licence and incident costs',
      'Team climate and training exposure',
      'Intervention lift',
    ],
  };

  const flags = {
    gated: some((r) => !!r.stage.gated),
    underexposed: some((r) => r.usageProfile.underexposed),
    eroding: some((r) => r.composites.dependencyIndex >= 55 && r.composites.futureReadiness >= 55),
    lowConfidence: some((r) => r.overallConfidence === 'preliminary' || r.overallConfidence === 'insufficient'),
    intentionalLowUse: some((r) => r.usageProfile.intentionalSelectiveUse),
  };

  /* ---- segments, suppressed where a cell could identify somebody */
  const segments: SegmentReading[] = [];
  const dims = new Map<string, Map<string, GroupMember[]>>();
  const put = (dim: string, value: string, m: GroupMember) => {
    if (!value) return;
    if (!dims.has(dim)) dims.set(dim, new Map());
    const d = dims.get(dim)!;
    d.set(value, [...(d.get(value) ?? []), m]);
  };
  for (const m of members) {
    put('Assessment', PERSONA_LABEL[m.persona] ?? m.persona, m);
    put('Reported use', m.usage >= 4 ? 'Weekly or more' : m.usage >= 3 ? 'Occasional' : 'Rare or none', m);
    for (const [k, v] of Object.entries(m.segments ?? {})) put(k, v, m);
  }
  for (const [dimension, values] of dims) {
    for (const [value, group] of values) {
      const rest = n - group.length;
      const suppressed = group.length < SUPPRESSION.descriptive || (rest > 0 && rest < SUPPRESSION.descriptive);
      if (suppressed) {
        segments.push({ dimension, value, n: group.length, suppressed: true });
        continue;
      }
      const sub = buildSegment(group, lead);
      segments.push({ dimension, value, n: group.length, suppressed: false, ...sub });
    }
  }

  /* ---- movement */
  const deltas = members.map((m) => m.indexDelta).filter((d): d is number => typeof d === 'number');
  const trans = new Map<string, number>();
  for (const m of members) {
    if (typeof m.priorStage !== 'number') continue;
    const k = `${m.priorStage}>${m.result.stage.stage}`;
    trans.set(k, (trans.get(k) ?? 0) + 1);
  }
  const movement = {
    repeatTakers: deltas.length,
    improved: deltas.filter((d) => d > 1).length,
    declined: deltas.filter((d) => d < -1).length,
    held: deltas.filter((d) => Math.abs(d) <= 1).length,
    medianDelta: spreadOf(deltas).median,
    transitions: [...trans.entries()].map(([k, c]) => {
      const [from, into] = k.split('>').map(Number);
      return { from, into, n: c };
    }).sort((a, b) => a.from - b.from || a.into - b.into),
  };

  const level = n >= INFERENCE_FLOOR ? 'firm' : n >= SUPPRESSION.sensitive ? 'workable' : 'indicative';
  const confidence = {
    level: level as GroupResult['confidence']['level'],
    note: n >= INFERENCE_FLOOR
      ? `Read across ${n} people. The shape of this group is stable enough to plan against, and intervals and correlations are reported.`
      : n >= SUPPRESSION.sensitive
        ? `Read across ${n} people. Counts and shares are usable; below ${INFERENCE_FLOOR} respondents no confidence intervals or correlations are reported.`
        : `Read across only ${n} ${n === 1 ? 'person' : 'people'}. Treat every figure as indicative, and note that segment cuts are suppressed below ${SUPPRESSION.descriptive}.`,
  };

  return {
    label, n, generatedAt: now.toISOString(), window, versions: VERSIONS, bands: BANDS,
    personas, index, distribution, centre, shape, earlyRoute, gateHeld, movableMiddle,
    dimensions, composites, strengths, watchlist, correlations,
    archetypes, patterns, calibration,
    constraints, lowestScores, concentration, moves, stagePlan, nextStage,
    quadrants, governance, headline, flags, segments, movement, confidence,
  };
}

/** The three figures a segment carries, once it is large enough to show. */
function buildSegment(group: GroupMember[], lead: Persona) {
  const index = spreadOf(group.map((m) => m.result.stage.rawIndex));
  const stages = new Map<number, number>();
  for (const m of group) stages.set(m.result.stage.stage, (stages.get(m.result.stage.stage) ?? 0) + 1);
  const [stage, c] = [...stages.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
  const cons = new Map<ConstructId, number>();
  for (const m of group) {
    const b = m.result.bottleneck;
    if (b && !b.saturated) cons.set(b.construct, (cons.get(b.construct) ?? 0) + 1);
  }
  const top = [...cons.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    index,
    modalStage: { stage, stageName: stageName(lead, stage), n: c },
    constraint: top ? { name: CONSTRUCTS[top[0]].name, n: top[1] } : undefined,
  };
}
