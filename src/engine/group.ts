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
import { PATTERN_RULES } from './patterns';
import { CONSTRUCTS, GROUP, SCORING, STAGES, VERSIONS } from './config';
import { DIMENSIONS, type HealthyDirection } from './dictionary';
import type { HumanAdvantageResult, ConstructId, PatternHit, Persona } from './types';
import { riskLean, stageName } from './display';

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
  result: HumanAdvantageResult;
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
  /** What scored this reading. Undefined on records written before it was stored. */
  versions?: { instrument: string; scoring: string; scenario: string; language: string };
}

/* ------------------------------------------------------------ the vocabulary */

/** One canonical band table per scoring version, printed in the appendix. */
export const BANDS = {
  strength: SCORING.strengthFloor,
  vulnerability: SCORING.vulnerabilityCeiling,
  strong: SCORING.microStrong,
  watch: SCORING.microWatch,
} as const;

/**
 * Which editions can raise each pattern, read off the rules themselves.
 *
 * Undefined means every edition can. Derived rather than retyped so a new
 * persona-scoped pattern cannot quietly get the wrong denominator.
 */
const PATTERN_PERSONAS: Record<string, Persona[] | undefined> = Object.fromEntries(
  PATTERN_RULES.map((r) => [r.id, r.personas]),
);

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
  /**
   * Which way healthier runs on the values in `spread`.
   *
   * Always "higher" for a dimension, because every dimension is aggregated from
   * the canonical score and the canonical scale is healthy-high without
   * exception. This used to be `!!def.reportedAsRisk`, which set it on the
   * reliance dimension and made the page print "Independent Capability (lower
   * is healthier)" over values where higher was healthier, with the healthy end
   * painted in the warning colour. Composites still carry both directions,
   * because two of them genuinely run the other way.
   */
  healthyDirection: HealthyDirection;
  spread: Spread;
  bands: BandShares;
  /** The engine's own name, for the appendix and the small print on a card. */
  canonicalName: string;
  /** Count and share at or below the vulnerability line, in any band. */
  vulnerable: GroupCount;
  /** Count and share within five points of the next band threshold. */
  nearThreshold: GroupCount;
  /** Share of readings on this dimension that rest on fewer answers than usual. */
  preliminary: GroupCount;
  /** Both a strength and a vulnerability present: coach in segments, not as one. */
  polarised: boolean;
  /** Nobody strong and the middle below the vulnerability line: one shared practice. */
  uniformlyLow: boolean;
  evidence: { median: number; min: number };
  confidence: Record<string, number>;
}

export interface GroupCount { n: number; share: number }

export interface PatternTally {
  id: string; label: string; n: number;
  /** Share of the people who could have fired it, not of the whole cohort. */
  share: number;
  base: number;
}

export interface Quadrant { key: string; label: string; n: number; share: number; action: string }

/** Which way the group is off the path, by the platform's own rule. */
export interface LeanReading {
  towardsDisconnection: GroupCount;
  balanced: GroupCount;
  towardsDependence: GroupCount;
  /** Which response leads, or both when the two sides are within one person. */
  response: 'more real, bounded practice' | 'guardrails and deliberate unaided practice'
    | 'both, run for different people';
}

/** One practice gate, and how far the group is from clearing it. */
export interface GateReading {
  stage: number;
  stageName: string;
  construct: ConstructId;
  name: string;
  required: number;
  /** People this gate is currently holding. */
  held: GroupCount;
  /** Median reading on the gating dimension among those it holds. */
  currentMedian: number;
  /** Points between that median and the requirement. */
  gap: number;
  /** Of those held, how many are within five points of clearing it. */
  closeToClearing: number;
}

/** Why the people who are not meeting healthy adoption are not meeting it. */
export interface AdoptionBlockers {
  /** In order: use, judgment, responsible use, independent capability. */
  byCriterion: Array<{ criterion: string; failing: GroupCount }>;
  /** How many fail exactly one criterion, and which one that most often is. */
  failingExactlyOne: GroupCount;
  singleMostCommonBlocker?: { criterion: string; n: number };
}

/** Said against chosen, per dimension, across the group. */
export interface SaidVsChosenReading {
  construct: ConstructId;
  name: string;
  aligned: GroupCount;
  /** Their situations were healthier than their self-description. */
  healthierInSituations: GroupCount;
  /** Their self-description was healthier than their situations. */
  weakerInSituations: GroupCount;
  /** Median absolute gap, on the one to five healthy scale. */
  medianMagnitude: number;
}

/** How many people are actually within reach of the next stage, and why not. */
export interface MobilityReading {
  stage: number;
  stageName: string;
  n: number;
  into: number;
  intoName: string;
  /** Within five index points and no gate in the way. */
  immediatelyMovable: number;
  /** The index is there; a gate is not. */
  gateConstrained: number;
  /** Neither: the index has further to travel. */
  developmentRequired: number;
}

export interface SegmentReading {
  dimension: string;
  value: string;
  /**
   * Absent when the cut is withheld.
   *
   * A suppressed row used to carry its exact size out of here, and all three
   * output formats printed it: the PDF set "2" beside the words "withheld: too
   * few people to report without identifying them", and the CSV and the JSON
   * did the same. In a ten person organisation "two Teachers" is the
   * identifying fact, and the remainder rule that withholds the large cell then
   * hands the reader both halves. What is suppressed does not leave this
   * function.
   */
  n?: number;
  /** Withheld rather than shown when a cell could identify somebody. */
  suppressed: boolean;
  /** How many more respondents this cut would need before it could be shown. */
  needs?: number;
  index?: Spread;
  modalStage?: { stage: number; stageName: string; n: number };
  constraint?: { name: string; n: number };
}

export interface GroupResult {
  label: string;
  n: number;
  /** What was counted, what was left out, and under which rule. */
  cohort: {
    attemptsRule: string;
    exclusions: Array<{ reason: string; n: number }>;
    /** True below the stronger-caveat threshold. */
    smallCohort: boolean;
  };
  generatedAt: string;
  window: { first: string; last: string };
  /** The versions in force in the running code. */
  versions: typeof VERSIONS;
  /**
   * What actually produced the readings in this cohort.
   *
   * `comparable` is true only when every record carries the same four versions,
   * which is the condition a wave on wave comparison needs. Records written
   * before versions were stored make it false, and say so rather than being
   * assumed to match.
   */
  provenance: {
    comparable: boolean;
    recorded: number;
    notRecorded: number;
    distinct: Array<{ versions: typeof VERSIONS; n: number }>;
    note: string;
  };
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
  patterns: {
    help: PatternTally[]; harm: PatternTally[]; mixed: PatternTally[]; neutral: PatternTally[];
    noHarm: GroupCount;
  };

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

  /* the derived readings */
  lean: LeanReading;
  gateAnalysis: GateReading[];
  adoptionBlockers: AdoptionBlockers;
  saidVsChosen: SaidVsChosenReading[];
  mobility: MobilityReading[];
  /** Median points between a person's constraint and what would clear it. */
  constraintGap: Array<{ construct: ConstructId; name: string; n: number; medianGap: number }>;
  consistency: { widthOfMiddleHalf: number; label: 'high' | 'moderate' | 'low'; reading: string };

  /* crosses */
  quadrants: {
    capabilityUse: Quadrant[]; capabilityUseBase: number;
    fluencyJudgment: Quadrant[]; fluencyJudgmentBase: number;
    fluentAndAtWatch: GroupCount; deliberateNonUse: GroupCount;
  };

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

/** Thrown rather than returned, so no caller can render a reading by accident. */
export class GroupTooSmallError extends Error {
  readonly n: number;
  readonly minimum = GROUP.minimumForReport;
  constructor(n: number) {
    super(n === 0
      ? 'There are no completed assessments in this selection.'
      : `A group report needs at least ${GROUP.minimumForReport} respondents. This selection has ${n}, and at that size the figures would describe individuals rather than a workforce.`);
    this.name = 'GroupTooSmallError';
    this.n = n;
  }
}

/* ------------------------------------------------------------------ helpers */

const round1 = (n: number) => Math.round(n * 10) / 10;
const shareOf = (n: number, total: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);
const count = (hits: number, total: number): GroupCount => ({ n: hits, share: shareOf(hits, total) });

/**
 * The quantile rule, stated once.
 *
 * Linear interpolation between order statistics, which is the rule the reading
 * guide describes: with an even number of people the median sits halfway
 * between the two in the middle. The previous rule took the nearest rank, so on
 * an even group it returned one person's actual score, and because JavaScript
 * rounds halves upward it leaned to the higher of the two every time. On eight
 * people spanning 0.4 to 99.6 it reported a median of 75 where the midpoint was
 * 62.5, and no reader could have reproduced that by hand from the definition
 * the report gave them.
 */
const quantile = (sorted: number[], q: number): number => {
  if (sorted.length === 1) return sorted[0];
  const pos = q * (sorted.length - 1);
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
};

export function spreadOf(values: number[]): Spread {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return { n: 0, median: 0, q1: 0, q3: 0, min: 0, max: 0, mean: 0, sd: 0, range: 0 };
  const at = (q: number) => quantile(v, q);
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
  label: string, members: GroupMember[], now = new Date(),
  exclusions?: Array<{ reason: string; n: number }>,
): GroupResult {
  //
  // A group of one is an individual report with the person's name taken off and
  // their employer's name put on the cover. Every median is that person's own
  // score, the range pins them exactly, and the constraint chapter names the
  // capability they are weakest on. The guard used to be "at least one member",
  // which is a guard against an empty array rather than against identifying
  // somebody, so a one person organisation got a full twelve page reading of
  // itself. Three is the floor; between three and six the cover and the
  // executive answer carry the stronger caveat.
  //
  if (members.length < GROUP.minimumForReport) {
    throw new GroupTooSmallError(members.length);
  }

  const n = members.length;
  const results = members.map((m) => m.result);
  const some = (pred: (r: HumanAdvantageResult) => boolean) => count(results.filter(pred).length, n);

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
    // The gate carries the construct it failed on. This used to search the
    // reason sentence for the first word of a canonical name, and the first
    // word of "AI Fluency" is "AI", which appears in almost every stage name a
    // reason quotes, so nearly every gate in a group report was counted as AI
    // Fluency whatever had actually failed.
    for (const construct of r.stage.gated?.constructs ?? []) {
      gateCounts.set(construct, (gateCounts.get(construct) ?? 0) + 1);
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
    const entry = DIMENSIONS[c];
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
    const near = scores.filter((s) => {
      const d = [BANDS.watch, BANDS.vulnerability, BANDS.strength]
        .map((t) => Math.abs(s - t));
      return Math.min(...d) <= GROUP.nearThreshold;
    }).length;
    const prelim = results.filter((r) => {
      const lvl = r.dimensions[c]?.confidence;
      return lvl === 'preliminary' || lvl === 'insufficient';
    }).length;
    return {
      construct: c,
      // One vocabulary in the body, the engine's own name kept for the appendix.
      name: entry.executiveName,
      canonicalName: def.name,
      healthyDirection: entry.healthyDirection,
      spread,
      bands: bandsOf(scores),
      vulnerable: count(scores.filter((s) => s <= BANDS.vulnerability).length, n),
      nearThreshold: count(near, n),
      preliminary: count(prelim, n),
      polarised: hasStrength && hasVulnerability,
      uniformlyLow: !hasStrength && spread.median <= BANDS.vulnerability,
      evidence: { median: spreadOf(ev).median, min: ev.reduce((a, b) => Math.min(a, b), Infinity) },
      confidence: conf,
    };
  });
  // A strength is a dimension the group is actually strong on, and a watchlist
  // item is one it is actually weak on. These used to be the top three and the
  // bottom three by median with no reference to a threshold at all, so a
  // uniformly strong group was handed three watchlist items sitting ten points
  // above the strength floor, and a uniformly weak one was congratulated on
  // three strengths it did not have. The individual report has always filtered
  // these at 65 and 45; this is the same rule, applied to the median.
  const byMedian = [...dimensions].sort((a, b) => b.spread.median - a.spread.median);
  const strengths = byMedian.filter((d) => d.spread.median >= BANDS.strength).slice(0, 3);
  const watchlist = [...byMedian].reverse()
    .filter((d) => d.spread.median <= BANDS.vulnerability).slice(0, 3);

  const COMPOSITES: Array<{ id: keyof HumanAdvantageResult['composites']; label: string; low: boolean }> = [
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

  //
  // Twenty patterns are defined and only ten of them can fire for a given
  // person: five belong to the Business Owner edition and five to the Minister
  // edition. Dividing every count by the whole cohort therefore reported a
  // pattern that fired for every Minister present as a small share of the
  // workforce. The denominator is the people who could have fired it.
  //
  // "mixed" and "neutral" used to be dropped entirely, which is why no group
  // report has ever shown intentional selective use or cautious but
  // underleveraged, two readings a manager needs precisely because they are not
  // problems.
  //
  const eligibleFor = (id: string) => results.filter((r) =>
    PATTERN_PERSONAS[id] === undefined || PATTERN_PERSONAS[id]!.includes(r.persona)).length;
  const tally = (kind: PatternHit['kind']) => {
    const m = new Map<string, { label: string; n: number }>();
    for (const r of results) {
      for (const p of r.patterns) {
        if (p.kind !== kind) continue;
        const hit = m.get(p.id) ?? { label: p.label, n: 0 };
        hit.n += 1;
        m.set(p.id, hit);
      }
    }
    return [...m.entries()].map(([id, v]) => {
      const base = eligibleFor(id);
      return { id, label: v.label, n: v.n, share: shareOf(v.n, base), base };
    }).sort((a, b) => b.n - a.n);
  };
  const patterns = {
    help: tally('help'),
    harm: tally('harm'),
    mixed: tally('mixed'),
    neutral: tally('neutral'),
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
  // Shares are of the people who answered the calibration questions, which is
  // why each block carries its own n. With nobody answering, the share is zero
  // over zero: report it as zero rather than dividing by a fabricated one, and
  // let the n beside it say the difference between "nobody was miscalibrated"
  // and "nobody answered".
  const calibration = {
    felt: {
      healthier: count(feltHealthier, feltN), matched: count(feltMatched, feltN),
      lessHealthy: count(feltLess, feltN), medianGap: spreadOf(feltGaps).median, n: feltN,
    },
    predicted: {
      accurate: count(predAccurate, predN), withinOne: count(predWithin, predN),
      wider: count(predWider, predN), n: predN,
    },
  };

  /* ---- what holds the group */
  const tallyBy = (pick: (r: HumanAdvantageResult) => ConstructId | null) => {
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


  /* ---- which way the group is off the path */
  //
  // The individual report has named this for every respondent since it shipped,
  // using riskLean() in four different components. The group report has never
  // asked. It is the reading that decides whether a workforce needs more
  // practice or more guardrails, and those are opposite programmes.
  //
  let dis = 0, bal = 0, dep = 0;
  for (const r of results) {
    const l = riskLean(r.composites.dependencyIndex, r.composites.underexposure);
    if (l === 'disconnection') dis++; else if (l === 'dependence') dep++; else bal++;
  }
  const lean: LeanReading = {
    towardsDisconnection: count(dis, n), balanced: count(bal, n), towardsDependence: count(dep, n),
    response: Math.abs(dis - dep) <= 1 ? 'both, run for different people'
      : dis > dep ? 'more real, bounded practice' : 'guardrails and deliberate unaided practice',
  };

  /* ---- the gates, with the distance to each one */
  const gateAnalysis: GateReading[] = [];
  for (const stageDef of STAGES) {
    if (!stageDef.gates) continue;
    for (const [c, min] of Object.entries(stageDef.gates)) {
      const construct = c as ConstructId;
      const required = min as number;
      // Held by this gate: below the requirement, and at or past the index that
      // would otherwise carry them into the stage.
      const heldBy = results.filter((r) => r.dimensions[construct].score < required
        && r.stage.rawIndex >= stageDef.minIndex);
      if (!heldBy.length) continue;
      const scores = heldBy.map((r) => r.dimensions[construct].score);
      const med = spreadOf(scores).median;
      gateAnalysis.push({
        stage: stageDef.stage, stageName: stageName(lead, stageDef.stage),
        construct, name: DIMENSIONS[construct].executiveName, required,
        held: count(heldBy.length, n), currentMedian: med, gap: round1(required - med),
        closeToClearing: scores.filter((v) => required - v <= GROUP.nearThreshold).length,
      });
    }
  }
  gateAnalysis.sort((a, b) => b.held.n - a.held.n || a.stage - b.stage);

  /* ---- why the rest are not meeting healthy adoption */
  //
  // "13 per cent meet the standard" is a fact. "Here is what stops the other 87
  // per cent, and 30 of them are stopped by one thing" is a plan.
  //
  const CRITERIA: Array<{ criterion: string; met: (m: GroupMember) => boolean }> = [
    { criterion: 'Regular or deliberately selective use',
      met: (m) => m.usage >= 3 || m.result.usageProfile.intentionalSelectiveUse },
    { criterion: `Judgment composite at ${BANDS.strength} or above`,
      met: (m) => m.result.composites.judgment >= BANDS.strength },
    { criterion: `${DIMENSIONS.responsibleUse.executiveName} at ${BANDS.strength} or above`,
      met: (m) => m.result.dimensions.responsibleUse.score >= BANDS.strength },
    { criterion: `${DIMENSIONS.dependencySafety.executiveName} at ${BANDS.strength} or above`,
      met: (m) => m.result.dimensions.dependencySafety.score >= BANDS.strength },
  ];
  const notHealthy = members.filter((m) => !CRITERIA.every((c) => c.met(m)));
  const failingOne = notHealthy.filter((m) => CRITERIA.filter((c) => !c.met(m)).length === 1);
  const soleCounts = new Map<string, number>();
  for (const m of failingOne) {
    const only = CRITERIA.find((c) => !c.met(m))!;
    soleCounts.set(only.criterion, (soleCounts.get(only.criterion) ?? 0) + 1);
  }
  const topSole = [...soleCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const adoptionBlockers: AdoptionBlockers = {
    byCriterion: CRITERIA.map((c) => ({
      criterion: c.criterion,
      failing: count(notHealthy.filter((m) => !c.met(m)).length, notHealthy.length || 1),
    })),
    failingExactlyOne: count(failingOne.length, notHealthy.length || 1),
    singleMostCommonBlocker: topSole ? { criterion: topSole[0], n: topSole[1] } : undefined,
  };

  /* ---- said against chosen */
  //
  // Every one of the ten dimensions carries a signed delta for every persona,
  // and no group report has ever read one. Note the sign convention: the stored
  // gap is self-description minus situations, so a positive gap means the
  // person described themselves more favourably than their own answers to
  // situations did.
  //
  const saidVsChosen: SaidVsChosenReading[] = (Object.keys(CONSTRUCTS) as ConstructId[]).map((c) => {
    const gaps = results
      .map((r) => r.dimensions[c]?.consistencyGap?.gap)
      .filter((g): g is number => typeof g === 'number');
    const base = gaps.length || 1;
    return {
      construct: c,
      name: DIMENSIONS[c].executiveName,
      aligned: count(gaps.filter((g) => Math.abs(g) < SCORING.consistencyGapThreshold).length, base),
      healthierInSituations: count(gaps.filter((g) => g <= -SCORING.consistencyGapThreshold).length, base),
      weakerInSituations: count(gaps.filter((g) => g >= SCORING.consistencyGapThreshold).length, base),
      medianMagnitude: spreadOf(gaps.map((g) => Math.abs(g))).median,
    };
  });

  /* ---- who can actually move, and what is stopping the rest */
  const mobility: MobilityReading[] = distribution.map((d) => {
    const here = results.filter((r) => r.stage.stage === d.stage);
    const into = Math.min(d.stage + 1, STAGES.length);
    let movable = 0, gated = 0, needsWork = 0;
    for (const r of here) {
      if (d.stage >= STAGES.length) { needsWork++; continue; }
      const close = minIndexOf(into) - r.stage.rawIndex <= GROUP.movableWithin;
      // A gate is only "the" obstacle when the index has already arrived.
      if (r.stage.gated) gated++;
      else if (close) movable++;
      else needsWork++;
    }
    return {
      stage: d.stage, stageName: d.stageName, n: d.n, into, intoName: stageName(lead, into),
      immediatelyMovable: movable, gateConstrained: gated, developmentRequired: needsWork,
    };
  });

  /* ---- how far each constraint has to travel */
  const constraintGap = constraints.map((c) => {
    const holders = results.filter((r) => !r.bottleneck?.saturated
      && r.bottleneck?.construct === c.construct);
    // Against the gate the next stage asks for, or a healthy floor of 60.
    const gaps = holders.map((r) => {
      const next = STAGES.find((st) => st.stage === r.stage.stage + 1);
      const floor = next?.gates?.[c.construct] ?? 60;
      return Math.max(0, floor - r.dimensions[c.construct].score);
    });
    return { construct: c.construct, name: DIMENSIONS[c.construct].executiveName,
      n: c.n, medianGap: spreadOf(gaps).median };
  });

  /* ---- how alike this workforce is */
  const width = round1(index.q3 - index.q1);
  const polarisedCount = dimensions.filter((d) => d.polarised).length;
  const consistencyLabel = width < 10 ? 'high' : width <= 20 ? 'moderate' : 'low';
  const consistency = {
    widthOfMiddleHalf: width,
    label: consistencyLabel as 'high' | 'moderate' | 'low',
    reading: (consistencyLabel === 'high'
      ? 'Workforce consistency is relatively high. Most of your people sit within a narrow developmental range, so a shared programme may work better here than in a dispersed workforce.'
      : consistencyLabel === 'moderate'
        ? 'Workforce consistency is moderate. There is a real difference between your stronger and weaker half, so plan a shared core with separate attention at each end.'
        : 'Workforce consistency is low. Your people operate at substantially different levels, so one universal programme is unlikely to meet the needs of the whole organisation.')
      + (polarisedCount >= 2
        ? ` Your people are split rather than uniformly weak or strong on ${polarisedCount} dimensions.`
        : ''),
  };

  /* ---- crosses */
  //
  // A matrix is a partition or it is not a matrix.
  //
  // Both of these were neither. The fluency cross had "fluent and unprotected"
  // as judgment below 65 and "fluent, unprotected, watch" as judgment below 55,
  // so the second was a strict subset of the first and the four cells summed to
  // twice the group: six people were reported as twelve. The use cross counted
  // only the people whose use is not deliberately selective, then divided by
  // everybody, so with three deliberate non-users in eight the four cells held
  // five people and the shares summed to 62.5 per cent, with no line anywhere
  // saying where the rest had gone.
  //
  // Each set below covers its own population exactly once, each divides by the
  // population it covers, and each carries that population's size so a page can
  // say who is in the picture and who is reported separately.
  //
  const deliberate = members.filter((m) => m.result.usageProfile.intentionalSelectiveUse);
  const scored = members.filter((m) => !m.result.usageProfile.intentionalSelectiveUse);
  const highUse = (m: GroupMember) => m.usage >= 4;
  const highCap = (m: GroupMember) => m.result.stage.rawIndex >= GROUP.capableIndex;
  const fluent = (m: GroupMember) => m.result.dimensions.fluency.score >= BANDS.strength;
  const protectedBy = (m: GroupMember) => m.result.composites.judgment >= BANDS.strength;
  const cellOf = (pool: GroupMember[]) =>
    (key: string, label: string, pred: (m: GroupMember) => boolean, action: string): Quadrant => {
      const c = pool.filter(pred).length;
      return { key, label, n: c, share: shareOf(c, pool.length), action };
    };
  const usageCell = cellOf(scored);
  const capabilityUse = [
    usageCell('hh', 'Capable and using it', (m) => highCap(m) && highUse(m), 'Scale what they do and protect it.'),
    usageCell('hl', 'Capable, using little', (m) => highCap(m) && !highUse(m), 'Check access, relevance and whether the restraint is deliberate.'),
    usageCell('lh', 'Using it heavily, capability thin', (m) => !highCap(m) && highUse(m), 'The first development and control priority.'),
    usageCell('ll', 'Early on both', (m) => !highCap(m) && !highUse(m), 'Build safe foundations before pushing adoption.'),
  ];
  const allCell = cellOf(members);
  const fluencyJudgment = [
    allCell('fp', 'Fluent and protected', (m) => fluent(m) && protectedBy(m), 'Where the practice is working. Scale it.'),
    allCell('fu', 'Fluent and unprotected', (m) => fluent(m) && !protectedBy(m), 'Judgment work, not tool training.'),
    allCell('np', 'Protected, not yet fluent', (m) => !fluent(m) && protectedBy(m), 'The judgment is there. Build the practice on top of it.'),
    allCell('nn', 'Early on both', (m) => !fluent(m) && !protectedBy(m), 'Fluency first, with the guardrails taught alongside.'),
  ];
  const quadrants = {
    capabilityUse,
    /** Who the use matrix covers. The rest are reported as deliberate non-use. */
    capabilityUseBase: scored.length,
    fluencyJudgment,
    fluencyJudgmentBase: members.length,
    /** A subset of "fluent and unprotected", reported as a count and never as a cell. */
    fluentAndAtWatch: count(
      members.filter((m) => fluent(m) && m.result.composites.judgment < GROUP.judgmentWatch).length,
      n,
    ),
    deliberateNonUse: count(deliberate.length, n),
  };

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
        // Neither the size of this cell nor the size of what it leaves behind.
        const shortfall = Math.max(
          SUPPRESSION.descriptive - group.length,
          rest > 0 ? SUPPRESSION.descriptive - rest : 0,
        );
        segments.push({ dimension, value, suppressed: true, needs: Math.max(1, shortfall) });
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

  /* ---- what produced these readings */
  const stampCounts = new Map<string, { versions: typeof VERSIONS; n: number }>();
  let notRecorded = 0;
  for (const m of members) {
    if (!m.versions) { notRecorded++; continue; }
    const key = `${m.versions.instrument}|${m.versions.scoring}|${m.versions.scenario}|${m.versions.language}`;
    const hit = stampCounts.get(key) ?? { versions: m.versions as typeof VERSIONS, n: 0 };
    hit.n += 1;
    stampCounts.set(key, hit);
  }
  const distinct = [...stampCounts.values()].sort((a, b) => b.n - a.n);
  const recorded = n - notRecorded;
  const comparable = notRecorded === 0 && distinct.length === 1;
  const provenance = {
    comparable, recorded, notRecorded, distinct,
    note: comparable
      ? 'Every reading in this group was produced by the same instrument, scoring, scenario and language version, so it can be compared with another wave on the same four.'
      : notRecorded === n
        ? 'These readings were taken before the assessment recorded which version scored them. They can be compared with a later wave only after rescoring, which the platform can do from the stored answers.'
        : `${notRecorded} of ${n} readings do not record which version scored them, and ${distinct.length} different version sets are present. Treat a comparison with another wave as indicative until the cohort is rescored onto one version.`,
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
    label, n,
    cohort: {
      attemptsRule: 'One assessment per person: their most recent completed attempt of that assessment, inside the window shown.',
      exclusions: exclusions ?? [],
      smallCohort: n < GROUP.strongCaveatBelow,
    },
    generatedAt: now.toISOString(), window, versions: VERSIONS, provenance, bands: BANDS,
    personas, index, distribution, centre, shape, earlyRoute, gateHeld, movableMiddle,
    dimensions, composites, strengths, watchlist, correlations,
    archetypes, patterns, calibration,
    constraints, lowestScores, concentration, moves, stagePlan, nextStage,
    lean, gateAnalysis, adoptionBlockers, saidVsChosen, mobility, constraintGap, consistency,
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
