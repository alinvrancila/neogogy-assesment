/**
 * The organisation report's one aggregate object.
 *
 * Page components never interrogate raw submissions. This adapter turns the
 * completed assessments for one organisation into a single safe object, and
 * every web and print component consumes only that. Suppression happens here,
 * so a suppressed cut never leaves the function: it is built without its
 * values rather than filtered afterwards, which is the difference between a
 * value that is hidden and a value that was never carried.
 *
 * It builds on `buildGroupResult`, which does the distributions, the bands, the
 * matrices, the gates and the derived readings, and adds the constructs that
 * only the organisation report needs: the readiness map, developmental
 * cohorts, the priority score, the practice portfolio, the ninety day roadmap,
 * the trend or baseline state, the measurement modules that are not collected,
 * and the record of what was withheld and why.
 */

import { buildGroupResult, GroupTooSmallError, SUPPRESSION, type GroupMember, type GroupResult, type GroupCount } from './group';
import { DIMENSIONS, COMPOSITES, bandOf } from './dictionary';
import { GROUP, SCORING, STAGES } from './config';
import type { ConstructId } from './types';

const shareOf = (n: number, total: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);
const count = (hits: number, total: number): GroupCount => ({ n: hits, share: shareOf(hits, total) });
const round1 = (n: number) => Math.round(n * 10) / 10;

/* ------------------------------------------------------------ the shapes */

export interface MatrixCell {
  key: string; title: string; subtitle: string; response: string;
  n: number; share: number;
}

export interface CohortReading {
  id: string; name: string; description: string;
  n: number; share: number;
  primaryNeed: string;
  tier: string;
  /** Set when a cohort under the segment threshold was folded into this one. */
  mergedFrom?: string[];
}

export interface PortfolioEntry {
  tag: string; capability: string; change: string; practice: string;
  priority: string;
  evidenceOfProgress: string; riskToMonitor: string;
  n: number; share: number;
  theme: string;
  /** Stages this practice's dimension can unlock, from the dictionary. */
  unlocks: number[];
}

export interface PriorityItem {
  tag: string; capability: string;
  /** Count affected. The x axis. */
  reach: number; reachShare: number;
  /** Computed from priority level, gate role and vulnerability. The y axis. */
  importance: number;
  /** Median distance from the gate or the threshold. The bubble. */
  distance: number;
  region: 'act now' | 'target' | 'scale' | 'monitor';
  metricToMove: string;
}

export interface RoadmapBand {
  title: string; window: string; note: string;
  actions: Array<{
    capability: string; change: string; practice: string; priority: string;
    reach: number; reachShare: number; leadingIndicator: string; metricToMove: string;
  }>;
}

export interface MeasurementModule {
  id: string; name: string; whatItWouldAdd: string; collected: false;
}

export interface PrivacyNote {
  cut: string;
  state: 'shown' | 'withheld';
  reason?: string;
  /** How many more respondents this cut would need. */
  needs?: number;
}

export interface OrganisationReportAnalytics {
  group: GroupResult;
  readinessProtectionMatrix: { cells: MatrixCell[]; base: number };
  developmentCohorts: { cohorts: CohortReading[]; merged: string[] };
  practicePortfolio: { themes: Array<{ theme: string; entries: PortfolioEntry[] }>; total: number };
  priorities: PriorityItem[];
  roadmap: RoadmapBand[];
  trend: { comparable: false; reason: string; baseline: true } | { comparable: true; baseline: false };
  futureMeasurement: MeasurementModule[];
  privacyState: PrivacyNote[];
}

/* --------------------------------------------------- readiness x protection */

/**
 * The flagship map.
 *
 * Protection is all three of the healthy adoption protection criteria, not two
 * of three, so this chapter and the adoption funnel describe the same people.
 * A two of three rule would place somebody in "scale and lead" who fails a
 * criterion the adoption chapter counts as a blocker, and a reader holding both
 * pages would find them contradicting each other.
 */
const CELLS: Array<{ key: string; title: string; subtitle: string; response: string;
  cap: boolean; prot: boolean }> = [
  { key: 'hh', title: 'Scale and lead', cap: true, prot: true,
    subtitle: 'High capability, high protection.',
    response: 'The strongest foundation you have for sophisticated AI-enabled work. Scale what these people do, use them as peer exemplars, and keep the capability-retention safeguards in place as their work gets harder.' },
  { key: 'hl', title: 'Powerful but exposed', cap: true, prot: false,
    subtitle: 'High capability, low protection.',
    response: 'Productive users whose checking, ownership, boundaries or independence have not kept pace. The response is not more tool training. Judgment, verification, decision ownership and dependence protection come first.' },
  { key: 'lh', title: 'Protected but under-activated', cap: false, prot: true,
    subtitle: 'Low capability, high protection.',
    response: 'Healthy human foundations with thin practical fluency. Give them bounded practical experience on their own real work, and do not read their restraint as resistance.' },
  { key: 'll', title: 'Build the foundation', cap: false, prot: false,
    subtitle: 'Low capability, low protection.',
    response: 'These people need both the skill and the safeguards. Foundational training with structured practice, and the guardrails taught alongside the fluency rather than after it.' },
];

function readinessProtection(members: GroupMember[]) {
  const capable = (m: GroupMember) => m.result.composites.futureReadiness >= SCORING.strengthFloor;
  const protectedBy = (m: GroupMember) =>
    m.result.composites.judgment >= SCORING.strengthFloor
    && m.result.dimensions.responsibleUse.score >= SCORING.strengthFloor
    && m.result.dimensions.dependencySafety.score >= SCORING.strengthFloor;
  const cells = CELLS.map((c) => {
    const hits = members.filter((m) => capable(m) === c.cap && protectedBy(m) === c.prot).length;
    return { key: c.key, title: c.title, subtitle: c.subtitle, response: c.response,
      n: hits, share: shareOf(hits, members.length) };
  });
  return { cells, base: members.length };
}

/* ------------------------------------------------------ developmental cohorts */

const THEME_OF: Record<ConstructId, string> = {
  fluency: 'Fluency development', adaptability: 'Fluency development',
  verification: 'Judgment and verification', responsibleUse: 'Judgment and verification',
  agency: 'Agency and independence', dependencySafety: 'Agency and independence',
  amplification: 'Amplification and strategic use', creativity: 'Amplification and strategic use',
  transfer: 'Transfer and skill preservation', skillGrowth: 'Transfer and skill preservation',
};

const COHORT_META: Record<string, { description: string; primaryNeed: string; tier: string }> = {
  'Foundations': {
    description: 'Early on the route, or early on both use and capability.',
    primaryNeed: 'Practical fluency and safe exposure, starting with one real task.',
    tier: 'Foundational' },
  'Fluency development': {
    description: 'Using AI, with capabilities still inconsistent from task to task.',
    primaryNeed: 'Real workflow fluency on their own recurring work.',
    tier: 'Practitioner' },
  'Judgment and verification': {
    description: 'Already using AI, and needing stronger evaluation and firmer boundaries.',
    primaryNeed: 'Checking proportional to what is at stake, and a line that holds under pressure.',
    tier: 'Critical' },
  'Agency and independence': {
    description: 'Output may be strong while ownership or unaided capability is thinning.',
    primaryNeed: 'Decisions that stay with a person, and work that survives without the tool.',
    tier: 'Human advantage' },
  'Transfer and skill preservation': {
    description: 'Assisted work is not yet becoming capability they keep.',
    primaryNeed: 'Reconstructing assisted work unaided, so training compounds.',
    tier: 'Human advantage' },
  'Amplification and strategic use': {
    description: 'Producing faster without yet reasoning better.',
    primaryNeed: 'Moving from faster output to better thinking and deliberate role allocation.',
    tier: 'Strategic' },
  'Advanced human-AI integration': {
    description: 'Ready to redesign workflows and to teach others.',
    primaryNeed: 'Scope to redesign, and to be asked to teach.',
    tier: 'Strategic and adaptive' },
};

/** Exactly one primary cohort per person, by the rule validated in 01-plan.md I.4. */
export function cohortOf(m: GroupMember): string {
  const r = m.result;
  const earlyOnBoth = r.stage.rawIndex < GROUP.capableIndex && m.usage < 4;
  if (r.stage.stage <= 3 || earlyOnBoth) return 'Foundations';
  if (r.stage.stage >= 7 && !r.stage.gated) return 'Advanced human-AI integration';
  const b = r.bottleneck;
  if (!b || b.saturated) return 'Advanced human-AI integration';
  return THEME_OF[b.construct];
}

function developmentCohorts(members: GroupMember[]) {
  const counts = new Map<string, number>();
  for (const m of members) {
    const c = cohortOf(m);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  // A cohort below the segment threshold is folded into the nearest theme
  // rather than withheld, because a needs-based cohort with nobody in it tells
  // a reader nothing and a cohort of two would be a description of two people.
  const FOLD: Record<string, string> = {
    'Fluency development': 'Foundations',
    'Judgment and verification': 'Agency and independence',
    'Amplification and strategic use': 'Advanced human-AI integration',
    'Transfer and skill preservation': 'Agency and independence',
  };
  const merged: string[] = [];
  const mergedInto = new Map<string, string[]>();
  for (const [name, k] of [...counts.entries()]) {
    if (k >= SUPPRESSION.descriptive) continue;
    const into = FOLD[name];
    if (!into || !counts.has(into)) continue;
    counts.set(into, (counts.get(into) ?? 0) + k);
    counts.delete(name);
    merged.push(name);
    mergedInto.set(into, [...(mergedInto.get(into) ?? []), name]);
  }
  const cohorts: CohortReading[] = [...counts.entries()]
    .map(([name, k]) => ({
      id: name.toLowerCase().replace(/[^a-z]+/g, '-'),
      name,
      description: COHORT_META[name]?.description ?? '',
      primaryNeed: COHORT_META[name]?.primaryNeed ?? '',
      tier: COHORT_META[name]?.tier ?? '',
      n: k, share: shareOf(k, members.length),
      mergedFrom: mergedInto.get(name),
    }))
    .sort((a, b) => b.n - a.n);
  return { cohorts, merged };
}

/* ------------------------------------------------------- practice portfolio */

const PRACTICE_THEME: Record<string, string> = {};
for (const id of Object.keys(DIMENSIONS) as ConstructId[]) {
  PRACTICE_THEME[DIMENSIONS[id].recommendedPractice] = THEME_OF[id];
}

function portfolio(g: GroupResult) {
  const entries: PortfolioEntry[] = g.moves.map((m) => {
    // Which dimension this practice addresses, read back through the dictionary.
    const dim = (Object.keys(DIMENSIONS) as ConstructId[])
      .find((id) => DIMENSIONS[id].recommendedPractice === m.tag);
    return {
      tag: m.tag, capability: m.capability, change: m.change, practice: m.practice,
      priority: m.priority,
      evidenceOfProgress: m.evidenceOfProgress, riskToMonitor: m.riskToMonitor,
      n: m.n, share: m.share,
      theme: (dim && THEME_OF[dim]) ?? 'Other practices',
      unlocks: dim ? DIMENSIONS[dim].practiceGateRole.map((r) => r.stage) : [],
    };
  });
  const byTheme = new Map<string, PortfolioEntry[]>();
  for (const e of entries) byTheme.set(e.theme, [...(byTheme.get(e.theme) ?? []), e]);
  return {
    themes: [...byTheme.entries()]
      .map(([theme, list]) => ({ theme, entries: list.sort((a, b) => b.n - a.n) }))
      .sort((a, b) => b.entries[0].n - a.entries[0].n),
    total: entries.length,
  };
}

/* ------------------------------------------------------------- priorities */

const PRIORITY_WEIGHT: Record<string, number> = {
  immediate: 3, important: 2, developmental: 1, advanced: 0,
};

function priorities(g: GroupResult): PriorityItem[] {
  const reaches = g.moves.map((m) => m.n).sort((a, b) => a - b);
  const medianReach = reaches.length
    ? reaches[Math.floor((reaches.length - 1) / 2)] : 0;
  return g.moves.map((m) => {
    const dim = (Object.keys(DIMENSIONS) as ConstructId[])
      .find((id) => DIMENSIONS[id].recommendedPractice === m.tag);
    const gate = dim ? g.gateAnalysis.find((x) => x.construct === dim) : undefined;
    const dimension = dim ? g.dimensions.find((d) => d.construct === dim) : undefined;
    const vulnerableShare = dimension ? dimension.vulnerable.share : 0;
    // Importance, built from three canonical facts and nothing else.
    let importance = PRIORITY_WEIGHT[m.priority] ?? 0;
    if (gate) importance += 2;
    if (vulnerableShare >= 20) importance += 1;
    const distance = gate ? gate.gap
      : (dim ? (g.constraintGap.find((c) => c.construct === dim)?.medianGap ?? 0) : 0);
    const isStrength = dimension ? dimension.spread.median >= SCORING.strengthFloor : false;
    const region: PriorityItem['region'] = isStrength ? 'scale'
      : importance >= 4 && m.n >= medianReach ? 'act now'
      : importance >= 4 ? 'target'
      : 'monitor';
    return {
      tag: m.tag, capability: m.capability,
      reach: m.n, reachShare: m.share,
      importance, distance: round1(distance), region,
      metricToMove: dim ? DIMENSIONS[dim].executiveName : m.capability,
    };
  }).sort((a, b) => b.importance - a.importance || b.reach - a.reach);
}

/* ---------------------------------------------------------------- roadmap */

function roadmap(g: GroupResult): RoadmapBand[] {
  const byPriority = (p: string) => g.moves.filter((m) => m.priority === p)
    .sort((a, b) => b.n - a.n);
  const topGate = g.gateAnalysis[0];
  const row = (m: GroupResult['moves'][number]) => {
    const dim = (Object.keys(DIMENSIONS) as ConstructId[])
      .find((id) => DIMENSIONS[id].recommendedPractice === m.tag);
    return {
      capability: m.capability, change: m.change, practice: m.practice, priority: m.priority,
      reach: m.n, reachShare: m.share,
      leadingIndicator: m.evidenceOfProgress,
      metricToMove: dim ? DIMENSIONS[dim].executiveName : m.capability,
    };
  };
  return [
    { title: 'Days 1 to 30', window: 'The first month',
      note: 'The highest-reaching immediate needs, and the behaviour changes with the least friction.',
      actions: byPriority('immediate').slice(0, 5).map(row) },
    { title: 'Days 31 to 60', window: 'The second month',
      note: topGate
        ? `Deliberate practice and workflow experiments, alongside the gate holding the most people: ${topGate.name}.`
        : 'Deliberate practice, workflow experiments and verification routines.',
      actions: byPriority('important').slice(0, 5).map(row) },
    { title: 'Days 61 to 90', window: 'The third month',
      note: 'Deeper transfer and workflow redesign, then a retake so the movement is measured rather than assumed.',
      actions: byPriority('developmental').slice(0, 5).map(row) },
  ];
}

/* ------------------------------------------------------ future measurement */

export const MEASUREMENT_MODULES: MeasurementModule[] = [
  { id: 'value', name: 'AI value', collected: false,
    whatItWouldAdd: 'Task time, quality, rework and throughput against a baseline, so a change in practice could be tied to a change in output.' },
  { id: 'retention', name: 'Human capability retention', collected: false,
    whatItWouldAdd: 'Assisted against unaided matched tasks, delayed recall and repeatability, which is the only direct measure of whether capability is being kept.' },
  { id: 'governance', name: 'Governance', collected: false,
    whatItWouldAdd: 'Verification coverage, disclosure, sign-off and incidents, turning the exposure readings here into observed rates.' },
  { id: 'economic', name: 'Economic value', collected: false,
    whatItWouldAdd: 'Licences, training, time saved, rework and incident cost, which together would give a net task value this report deliberately does not estimate.' },
  { id: 'conditions', name: 'Organisational conditions', collected: false,
    whatItWouldAdd: 'Training exposure, manager support, safety around experimenting, AI access and policy clarity, which explain why a capability is where it is.' },
  { id: 'intervention', name: 'Intervention effectiveness', collected: false,
    whatItWouldAdd: 'Baseline, intervention and retake, so movement could be attributed rather than observed.' },
];

/* ------------------------------------------------------------ privacy state */

function privacyState(g: GroupResult): PrivacyNote[] {
  const notes: PrivacyNote[] = g.segments.map((s) => (s.suppressed
    ? { cut: `${s.dimension}: ${s.value}`, state: 'withheld' as const,
        reason: 'Too few people in this cut, or too few left outside it, to report without identifying them.',
        needs: s.needs }
    : { cut: `${s.dimension}: ${s.value}`, state: 'shown' as const }));
  if (g.n < 30) {
    notes.push({ cut: 'Confidence intervals and correlations', state: 'withheld',
      reason: `Not reported below ${30} respondents, where they would dress noise as a finding.`,
      needs: 30 - g.n });
  }
  if (g.n < SUPPRESSION.sensitive) {
    notes.push({ cut: 'Any cut on a sensitive characteristic', state: 'withheld',
      reason: `Sensitive cuts need ${SUPPRESSION.sensitive} respondents. None is currently collected in any case.`,
      needs: SUPPRESSION.sensitive - g.n });
  }
  return notes;
}

/* ------------------------------------------------------------------ build */

export function buildOrganisationAnalytics(
  label: string, members: GroupMember[], now = new Date(),
  exclusions?: Array<{ reason: string; n: number }>,
): OrganisationReportAnalytics {
  const group = buildGroupResult(label, members, now, exclusions);
  return {
    group,
    readinessProtectionMatrix: readinessProtection(members),
    developmentCohorts: developmentCohorts(members),
    practicePortfolio: portfolio(group),
    priorities: priorities(group),
    roadmap: roadmap(group),
    // No record carries a prior wave yet, and section 5.8 forbids comparing
    // across unmatched versions. The trend chapter is the baseline panel until
    // a second wave exists on matching versions.
    trend: group.movement.repeatTakers > 0 && group.provenance.comparable
      ? { comparable: true, baseline: false }
      : { comparable: false, baseline: true,
          reason: group.movement.repeatTakers === 0
            ? 'This is the first wave for this organisation, so there is nothing to compare it with yet.'
            : group.provenance.note },
  futureMeasurement: MEASUREMENT_MODULES,
    privacyState: privacyState(group),
  };
}

export { GroupTooSmallError };
