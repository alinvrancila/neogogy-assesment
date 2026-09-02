/**
 * The group reading.
 *
 * Everything here is aggregation. It computes nothing new about a person, and
 * it writes no prose about one: it takes results the engine has already
 * produced and answers the questions a school, a department or an owner
 * actually asks. Where is this group standing, how wide is the spread, what is
 * holding most of them, and what would move the whole group up.
 *
 * Two rules it keeps.
 *
 * A group is not a person. There is no group stage in the way there is a
 * personal stage, because averaging ten dimensions across twenty people and
 * calling the result a stage would invent a respondent who does not exist. The
 * centre reported here is where most people are standing, which is a count, and
 * the spread around it is reported beside it every time.
 *
 * Nothing is invented to fill a page. Every move offered to a group is one the
 * engine already gave to people inside it, counted, so a group recommendation
 * is a tally of individual findings rather than a new claim.
 */

import { CONSTRUCTS, STAGES } from './config';
import type { CompassResult, ConstructId, Persona } from './types';
import { PERSONA_DISPLAY, stageName } from './display';

export interface GroupMember {
  name: string;
  email: string;
  persona: Persona;
  result: CompassResult;
  takenAt: string;
  /** Index movement between a person's first and latest attempt. */
  indexDelta?: number;
}

export interface Spread {
  n: number; mean: number; median: number; p25: number; p75: number; min: number; max: number;
  /** Population standard deviation, which is what "how wide is this" means here. */
  sd: number;
}

export interface GroupDimension {
  construct: ConstructId;
  name: string;
  reportedAsRisk: boolean;
  spread: Spread;
  /** How many are in the watch band on this dimension, and their share. */
  watch: { n: number; share: number };
  strong: { n: number; share: number };
}

export interface GroupCount { n: number; share: number }

export interface GroupResult {
  /** The organisation, class or team this reading covers. */
  label: string;
  n: number;
  generatedAt: string;
  /** Which assessments the members took, largest first. */
  personas: Array<{ persona: Persona; label: string; n: number; share: number }>;
  index: Spread;
  /** Every stage with at least one person, in route order. */
  distribution: Array<{ stage: number; stageName: string; n: number; share: number }>;
  /** Where most people are standing. A count, never an average dressed as one. */
  centre: { stage: number; stageName: string; n: number; share: number };
  /** The range the group actually covers, and how far apart its ends are. */
  extremes: {
    top: { label: string; index: number; stage: number; stageName: string };
    bottom: { label: string; index: number; stage: number; stageName: string };
    span: number;
  };
  dimensions: GroupDimension[];
  strengths: GroupDimension[];
  watchlist: GroupDimension[];
  /** What is binding people, counted from each person's own constraint. */
  constraints: Array<{ construct: ConstructId; name: string; n: number; share: number }>;
  flags: {
    gated: GroupCount;
    underexposed: GroupCount;
    eroding: GroupCount;
    lowConfidence: GroupCount;
    intentionalLowUse: GroupCount;
  };
  movement: { repeatTakers: number; improved: number; declined: number; held: number; meanDelta: number };
  /** Where the centre of the group goes next, from the engine's own route. */
  nextStage: { stage: number; stageName: string; requirements: string[] };
  /** How to move the group up: each one counted from members' own plans. */
  moves: Array<{ capability: string; change: string; practice: string; n: number; share: number }>;
  /** What this reading can and cannot carry, given how many people are in it. */
  confidence: { level: 'indicative' | 'workable' | 'firm'; note: string };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const shareOf = (n: number, total: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);

export function spreadOf(values: number[]): Spread {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return { n: 0, mean: 0, median: 0, p25: 0, p75: 0, min: 0, max: 0, sd: 0 };
  const at = (q: number) => v[Math.min(v.length - 1, Math.max(0, Math.round(q * (v.length - 1))))];
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length);
  return {
    n: v.length, mean: round1(mean), median: round1(at(0.5)), p25: round1(at(0.25)),
    p75: round1(at(0.75)), min: round1(v[0]), max: round1(v[v.length - 1]), sd: round1(sd),
  };
}

/** A member's display label: their name if we have one, otherwise the local part. */
const labelOf = (m: GroupMember) =>
  (m.name || '').trim() || (m.email || '').split('@')[0] || 'A member';

/**
 * The reading itself.
 *
 * `label` is the organisation, class or team. Members must already be one
 * attempt each, the latest, which is the caller's job because only the caller
 * knows whether a person retook it.
 */
export function buildGroupResult(
  label: string, members: GroupMember[], now = new Date()
): GroupResult {
  if (!members.length) throw new Error('A group reading needs at least one member.');

  const n = members.length;
  const results = members.map((m) => m.result);

  // ---- who is in it
  const byPersona = new Map<Persona, number>();
  for (const m of members) byPersona.set(m.persona, (byPersona.get(m.persona) ?? 0) + 1);
  const personas = [...byPersona.entries()]
    .map(([persona, count]) => ({
      persona,
      label: PERSONA_DISPLAY[persona]?.reportTitle ?? persona,
      n: count,
      share: shareOf(count, n),
    }))
    .sort((a, b) => b.n - a.n);

  // ---- where the group is standing
  const index = spreadOf(results.map((r) => r.stage.rawIndex));

  const stageCounts = new Map<number, number>();
  for (const r of results) stageCounts.set(r.stage.stage, (stageCounts.get(r.stage.stage) ?? 0) + 1);
  const lead = personas[0].persona;
  const distribution = [...stageCounts.entries()]
    .map(([stage, count]) => ({
      stage, stageName: stageName(lead, stage), n: count, share: shareOf(count, n),
    }))
    .sort((a, b) => a.stage - b.stage);

  // Where most people are: the largest camp, and the lowest stage if two tie,
  // because a tie resolved upward flatters the group.
  const centre = [...distribution].sort((a, b) => b.n - a.n || a.stage - b.stage)[0];

  const sortedByIndex = [...members].sort((a, b) => a.result.stage.rawIndex - b.result.stage.rawIndex);
  const low = sortedByIndex[0], high = sortedByIndex[sortedByIndex.length - 1];
  const brief = (m: GroupMember) => ({
    label: labelOf(m),
    index: m.result.stage.rawIndex,
    stage: m.result.stage.stage,
    stageName: stageName(m.persona, m.result.stage.stage),
  });
  const extremes = {
    top: brief(high), bottom: brief(low),
    span: round1(high.result.stage.rawIndex - low.result.stage.rawIndex),
  };

  // ---- the ten dimensions across the group
  const dimensions: GroupDimension[] = (Object.keys(CONSTRUCTS) as ConstructId[]).map((c) => {
    const def = CONSTRUCTS[c];
    const scores = results.map((r) => r.dimensions[c]?.score ?? 0);
    const states = results.map((r) => r.dimensions[c]?.microState);
    const watch = states.filter((s) => s === 'watch').length;
    const strong = states.filter((s) => s === 'strong').length;
    return {
      construct: c,
      name: def.name,
      reportedAsRisk: !!def.reportedAsRisk,
      spread: spreadOf(scores),
      watch: { n: watch, share: shareOf(watch, n) },
      strong: { n: strong, share: shareOf(strong, n) },
    };
  });
  const byMean = [...dimensions].sort((a, b) => b.spread.mean - a.spread.mean);
  const strengths = byMean.slice(0, 3);
  const watchlist = [...byMean].reverse().slice(0, 3);

  // ---- what is actually holding people, from their own constraint
  const constraintCounts = new Map<ConstructId, number>();
  for (const r of results) {
    if (r.bottleneck?.saturated) continue;
    const c = r.bottleneck?.construct;
    if (c) constraintCounts.set(c, (constraintCounts.get(c) ?? 0) + 1);
  }
  const constraints = [...constraintCounts.entries()]
    .map(([construct, count]) => ({
      construct, name: CONSTRUCTS[construct].name, n: count, share: shareOf(count, n),
    }))
    .sort((a, b) => b.n - a.n);

  // ---- the flags a group owner has to know about
  const count = (pred: (r: CompassResult) => boolean): GroupCount => {
    const hits = results.filter(pred).length;
    return { n: hits, share: shareOf(hits, n) };
  };
  const flags = {
    gated: count((r) => !!r.stage.gated),
    underexposed: count((r) => r.usageProfile.underexposed),
    // high capability sitting on thin protection: the pattern this instrument exists to catch
    eroding: count((r) => r.composites.dependencyIndex >= 55 && r.composites.futureReadiness >= 55),
    lowConfidence: count((r) => r.overallConfidence === 'preliminary' || r.overallConfidence === 'insufficient'),
    intentionalLowUse: count((r) => r.usageProfile.intentionalSelectiveUse),
  };

  // ---- movement, for anyone who has taken it more than once
  const deltas = members.map((m) => m.indexDelta).filter((d): d is number => typeof d === 'number');
  const movement = {
    repeatTakers: deltas.length,
    improved: deltas.filter((d) => d > 1).length,
    declined: deltas.filter((d) => d < -1).length,
    held: deltas.filter((d) => Math.abs(d) <= 1).length,
    meanDelta: deltas.length ? round1(deltas.reduce((a, b) => a + b, 0) / deltas.length) : 0,
  };

  // ---- where the centre goes next, straight off the route
  const nextDef = STAGES.find((s) => s.stage === Math.min(centre.stage + 1, STAGES.length));
  const atSummit = centre.stage >= STAGES.length;
  const centreNext = results.find((r) => r.stage.stage === centre.stage)?.nextTarget;
  const nextStage = {
    stage: atSummit ? STAGES.length : centre.stage + 1,
    stageName: stageName(lead, atSummit ? STAGES.length : centre.stage + 1),
    requirements: atSummit
      ? ['The centre of this group is at the final stage. From here the work is holding it, which the route treats as a practice rather than a destination.']
      : (centreNext?.requirements ?? [nextDef?.short ?? '']).filter(Boolean),
  };

  // ---- how to move the group up: the members' own plans, counted
  const moveCounts = new Map<string, { capability: string; change: string; practice: string; n: number }>();
  for (const r of results) {
    for (const rec of r.recommendations) {
      if (rec.priority !== 'immediate' && rec.priority !== 'important') continue;
      const key = `${rec.capability}::${rec.behaviorChange}`;
      const hit = moveCounts.get(key);
      if (hit) hit.n += 1;
      else moveCounts.set(key, {
        capability: rec.capability, change: rec.behaviorChange, practice: rec.practice, n: 1,
      });
    }
  }
  const moves = [...moveCounts.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 6)
    .map((m) => ({ ...m, share: shareOf(m.n, n) }));

  // ---- what this reading can carry
  const level = n >= 25 ? 'firm' : n >= 8 ? 'workable' : 'indicative';
  const confidence = {
    level: level as GroupResult['confidence']['level'],
    note: n >= 25
      ? `Read across ${n} people, the shape of this group is stable enough to plan against. Individual movement still needs the individual reports.`
      : n >= 8
        ? `Read across ${n} people. The centre and the spread are usable; a single unusual result still moves the averages, so read the range beside every mean.`
        : `Read across only ${n} ${n === 1 ? 'person' : 'people'}. Treat every number here as indicative. One more respondent would visibly change most of them.`,
  };

  return {
    label, n, generatedAt: now.toISOString(), personas, index, distribution, centre, extremes,
    dimensions, strengths, watchlist, constraints, flags, movement, nextStage, moves, confidence,
  };
}
