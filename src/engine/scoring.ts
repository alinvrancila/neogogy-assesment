/**
 * Multidimensional scoring engine.
 *
 * v1 problems this file fixes:
 * - §4.5 triangulation discarded → behavior weighted above claims; a flagged
 *   consistency gap discounts the claim and shifts the score toward behavior.
 * - §4.1 abstention lockout → usage never multiplies scores; it shapes
 *   confidence and the underexposure composite instead.
 * - §4.2 lattice instability → continuous weighted scores.
 * - §4.7 dual band ladders → one ladder (config.CALIBRATION.bands).
 * - B2 unused → calibration gap computed alongside the desirability gap.
 */
import type {
  Answers, CompassResult, ConfidenceLevel, ConstructId, DimensionResult, Item,
  Persona, RiskSignal, Submission, UsageProfile, CalibrationResult,
} from "./types";
import { CONSTRUCT_IDS } from "./types";
import { SCORING, USAGE, CONFIDENCE, CALIBRATION } from "./config";
import { STUDENT_ITEMS } from "../items/student";
import { TEACHER_ITEMS } from "../items/teacher";
import { PARENT_ITEMS } from "../items/parent";
import { ADMINISTRATOR_ITEMS } from "../items/administrator";
import { BUSINESS_ITEMS } from "../items/business";
import { PASTOR_ITEMS } from "../items/pastor";
import { PROFESSIONAL_ITEMS } from "../items/professional";
import {
  OUTCOME_ITEMS, LOW_USE_REASON, HIGH_USE_PROBES, USAGE_ITEM, BASELINE_ITEMS,
  BUSINESS_USAGE_ITEM, BUSINESS_BASELINE_ITEMS, BUSINESS_LOW_USE_REASON, BUSINESS_HIGH_USE_PROBES,
  PASTOR_USAGE_ITEM, PASTOR_BASELINE_ITEMS, PASTOR_LOW_USE_REASON, PASTOR_HIGH_USE_PROBES,
} from "../items/shared";

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const PERSONA_BANKS: Record<Persona, Item[]> = {
  student: STUDENT_ITEMS,
  teacher: TEACHER_ITEMS,
  parent: PARENT_ITEMS,
  administrator: ADMINISTRATOR_ITEMS,
  business: BUSINESS_ITEMS,
  pastor: PASTOR_ITEMS,
  professional: PROFESSIONAL_ITEMS,
};

/**
 * Shared items reworded for a persona. The Business Owner asks about a
 * business rather than a person, and carries its own ten impact items, so the
 * three generic outcome items about the respondent's own learning do not apply.
 */
const SHARED_FOR = (persona: Persona) => (persona === "pastor"
  ? {
    usage: PASTOR_USAGE_ITEM, baselines: PASTOR_BASELINE_ITEMS,
    outcomes: [] as Item[], lowUse: PASTOR_LOW_USE_REASON, highUse: PASTOR_HIGH_USE_PROBES,
  }
  : persona === "business"
  ? {
    usage: BUSINESS_USAGE_ITEM, baselines: BUSINESS_BASELINE_ITEMS,
    outcomes: [] as Item[], lowUse: BUSINESS_LOW_USE_REASON, highUse: BUSINESS_HIGH_USE_PROBES,
  }
  : {
    usage: USAGE_ITEM, baselines: BASELINE_ITEMS,
    outcomes: OUTCOME_ITEMS, lowUse: LOW_USE_REASON, highUse: HIGH_USE_PROBES,
  });

/** Items applicable to a submission, honoring adaptive triggers (§13). */
export function applicableItems(persona: Persona, usage: number): Item[] {
  const shared = SHARED_FOR(persona);
  const items = [...PERSONA_BANKS[persona], ...shared.outcomes];
  if (usage <= USAGE.lowUseMax) items.push(shared.lowUse);
  if (usage >= USAGE.highUseMin) items.push(...shared.highUse);
  return items;
}

export function allItems(persona: Persona): Item[] {
  const shared = SHARED_FOR(persona);
  return [shared.usage, ...shared.baselines, ...PERSONA_BANKS[persona], ...shared.outcomes,
    shared.lowUse, ...shared.highUse];
}

// ---------------------------------------------------------------------------
// Item-level scoring
// ---------------------------------------------------------------------------

/** Normalize a raw answer to healthy-is-high 1..5. Returns undefined if unanswered / N/A. */
export function healthyValue(item: Item, raw: number | undefined): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (item.type === "outcome") {
    if (raw === 0) return undefined; // "not enough experience to judge"
    return raw;                       // outcome scale is already directional
  }
  if (item.type === "reverse") return 6 - raw;
  return raw; // claims, scenarios (options are directional), branches
}

/**
 * A healthy value on to the 0..100 scale, normalised by the item's own top
 * value. Every item on a five point scale is unaffected. Business impact items
 * offer four substantive anchors plus "not enough experience to say", and
 * without this their best available answer would score 75 rather than 100.
 */
const to100 = (v: number, top = 5) => ((v - 1) / Math.max(1, top - 1)) * 100;

/** The highest scoring value an item actually offers. */
const topValue = (item: Item): number => {
  if (!item.options?.length) return 5;
  const values = item.options.map((o) => o.value).filter((v) => v > 0);
  return values.length ? Math.max(...values) : 5;
};

interface Contribution { construct: ConstructId; score100: number; weight: number; itemId: string; type: Item["type"]; }

function contributionsFor(item: Item, raw: number | undefined, claimDiscounted: Set<string>): Contribution[] {
  const hv = healthyValue(item, raw);
  if (hv === undefined || !item.construct) return [];
  const typeW = SCORING.itemTypeWeights[item.type as keyof typeof SCORING.itemTypeWeights] ?? 1.0;
  let w = (item.weight ?? 1.0) * typeW;
  if (item.type === "claim" && claimDiscounted.has(item.id)) w *= SCORING.claimDiscountOnGap;

  const top = topValue(item);
  const out: Contribution[] = [{ construct: item.construct, score100: to100(hv, top), weight: w, itemId: item.id, type: item.type }];

  // §17: declared secondary construct effects (proportional to the same answer)
  for (const sec of item.secondary ?? []) {
    out.push({ construct: sec.construct, score100: to100(hv, top), weight: w * Math.abs(sec.weight) * Math.sign(sec.weight),
      itemId: item.id, type: item.type });
  }
  // §17: per-option effect nudges on scenarios (additive in 0..100 space)
  if (item.type === "scenario" && raw !== undefined) {
    const opt = item.options?.find(o => o.value === raw);
    for (const [c, delta] of Object.entries(opt?.effects ?? {})) {
      out.push({ construct: c as ConstructId, score100: 50 + (delta as number) * 5, weight: 0.3, itemId: item.id, type: item.type });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Consistency gaps (Layer 1 triangulation, now load-bearing)
// ---------------------------------------------------------------------------

interface GapInfo { construct: ConstructId; claim: number; behavior: number; gap: number; flagged: boolean; claimItemId: string; }

function computeGaps(items: Item[], answers: Answers): GapInfo[] {
  const byPair = new Map<string, { claim?: Item; scen?: Item }>();
  for (const it of items) {
    if (!it.pairId) continue;
    const e = byPair.get(it.pairId) ?? {};
    if (it.type === "claim") e.claim = it;
    if (it.type === "scenario") e.scen = it;
    byPair.set(it.pairId, e);
  }
  const gaps: GapInfo[] = [];
  for (const { claim: c, scen } of byPair.values()) {
    if (!c?.construct || !scen) continue;
    const cv = healthyValue(c, answers[c.id]);
    const sv = healthyValue(scen, answers[scen.id]);
    if (cv === undefined || sv === undefined) continue;
    const gap = cv - sv;
    gaps.push({ construct: c.construct, claim: cv, behavior: sv, gap,
      flagged: gap >= SCORING.consistencyGapThreshold, claimItemId: c.id });
  }
  return gaps;
}

// ---------------------------------------------------------------------------
// Usage profile (§4 of the master spec: four low/high-use interpretations)
// ---------------------------------------------------------------------------

const LOW_USE_REASON_LABELS: Record<number, string> = {
  1: "deliberate selectivity", 2: "access or institutional limits", 3: "privacy or trust concerns",
  4: "not knowing how or where AI would help", 5: "tried it and found it unhelpful",
};

const PASTOR_LOW_USE_LABELS: Record<number, string> = {
  1: "a considered decision about where it belongs", 2: "lack of time or access",
  3: "a conviction, or a tradition's guidance, against it in this work",
  4: "not knowing where to start", 5: "tried it and found it unhelpful",
};

export function usageProfile(sub: Submission, dims: Record<ConstructId, DimensionResult>): UsageProfile {
  const usage = sub.usage;
  const category = usage <= 1 ? "minimal" : usage <= 2 ? "light" : usage <= 3 ? "regular" : "heavy";
  const reasonRaw = sub.answers[LOW_USE_REASON.id];
  const labels = sub.persona === "pastor" ? PASTOR_LOW_USE_LABELS : LOW_USE_REASON_LABELS;
  const lowUseReason = usage <= USAGE.lowUseMax && reasonRaw ? labels[reasonRaw] : undefined;
  const judgmentOk = dims.verification.score >= USAGE.intentionalJudgmentFloor
    && dims.agency.score >= USAGE.intentionalJudgmentFloor;
  // A settled conviction against AI in preaching is a formed position, not a
  // gap. For this persona reason 3 counts alongside reason 1.
  const consideredReason = sub.persona === "pastor"
    ? (reasonRaw === 1 || reasonRaw === 3)
    : reasonRaw === 1;
  const intentional = usage <= USAGE.lowUseMax && consideredReason && judgmentOk;
  const underexposed = usage <= USAGE.lowUseMax && !intentional
    && (dims.fluency.score < 55 || reasonRaw === 4 || reasonRaw === 5);
  return { usage, category, lowUseReason, intentionalSelectiveUse: intentional, underexposed };
}

// ---------------------------------------------------------------------------
// Dimension scoring
// ---------------------------------------------------------------------------

export function scoreDimensions(persona: Persona, sub: Submission): {
  dims: Record<ConstructId, DimensionResult>; gaps: GapInfo[]; signals: RiskSignal[];
} {
  const items = applicableItems(persona, sub.usage);
  const gaps = computeGaps(items, sub.answers);
  const claimDiscounted = new Set(gaps.filter(g => g.flagged).map(g => g.claimItemId));

  const buckets: Record<string, Contribution[]> = {};
  for (const it of items) {
    for (const c of contributionsFor(it, sub.answers[it.id], claimDiscounted)) {
      (buckets[c.construct] ??= []).push(c);
    }
  }

  const signals: RiskSignal[] = [];
  for (const it of items) {
    const raw = sub.answers[it.id];
    const hv = healthyValue(it, raw);
    if (it.riskSignal && hv !== undefined && hv <= 2) {
      signals.push({ tag: it.riskSignal, construct: it.construct,
        severity: hv <= 1 ? "high" : "elevated", evidence: [it.id] });
    }
    // an option can expose more than one thing, so it may raise its own tags
    const chosen = it.options?.find((o) => o.value === raw);
    for (const tag of chosen?.signals ?? []) {
      signals.push({ tag, construct: it.construct,
        severity: (hv ?? 5) <= 1 ? "high" : "elevated", evidence: [it.id] });
    }
  }
  // merge duplicate tags, keep max severity
  const order = { watch: 0, elevated: 1, high: 2 } as const;
  const merged = new Map<string, RiskSignal>();
  for (const s of signals) {
    const prev = merged.get(s.tag);
    if (!prev) merged.set(s.tag, s);
    else {
      prev.evidence.push(...s.evidence);
      if (order[s.severity] > order[prev.severity]) prev.severity = s.severity;
    }
  }

  const dims = {} as Record<ConstructId, DimensionResult>;
  for (const cid of CONSTRUCT_IDS) {
    const contribs = buckets[cid] ?? [];
    const primaryCount = contribs.filter(c => ["claim", "reverse", "scenario", "outcome"].includes(c.type)).length;
    // A dimension is reported only when at least two of its scored items were
    // answered. One answer is an anecdote, and a whole dimension built on it
    // then flows into the index, the gates and the constraint as though it were
    // a reading. Below the minimum it holds the neutral prior for display and
    // carries an evidence count of zero, which is what excludes it downstream.
    const meetsMinimum = primaryCount >= SCORING.minInputsForDimension;
    let score = 50; // neutral prior only when there is not enough evidence
    if (contribs.length > 0 && meetsMinimum) {
      const wsum = contribs.reduce((a, c) => a + Math.abs(c.weight), 0);
      score = contribs.reduce((a, c) => a + c.score100 * c.weight, 0) / (wsum || 1);
      score = Math.max(0, Math.min(100, score));
    }
    const gap = gaps.find(g => g.construct === cid);
    // Confidence follows the same minimum, so a dimension cannot report
    // "preliminary" while carrying no evidence downstream. Below the minimum it
    // is insufficient, which is what the report prints as not enough evidence.
    let confidence: ConfidenceLevel = !meetsMinimum ? "insufficient"
      : primaryCount >= SCORING.minInputsForFullConfidence ? "high"
      : primaryCount >= 2 ? "moderate"
      : "preliminary";
    if (gap?.flagged && confidence === "high") confidence = "moderate";
    // Low usage caps confidence on experiential constructs instead of penalizing the score (§4.1 fix)
    if (sub.usage <= USAGE.lowUseMax && USAGE.experientialConstructs.includes(cid)
      && confidence !== "insufficient") {
      confidence = "preliminary";
    }
    dims[cid] = {
      construct: cid,
      score: round1(score),
      reportedScore: cid === "dependencySafety" ? round1(100 - score) : round1(score),
      confidence,
      // Zero when the minimum was not met, so the index, the gates and the
      // constraint all skip it by the same rule.
      evidenceCount: meetsMinimum ? primaryCount : 0,
      consistencyGap: gap ? { claim: gap.claim, behavior: gap.behavior, gap: gap.gap, flagged: gap.flagged } : undefined,
      microState: score >= SCORING.microStrong ? "strong" : score >= SCORING.microWatch ? "developing" : "watch",
    };
  }
  return { dims, gaps, signals: [...merged.values()] };
}

// ---------------------------------------------------------------------------
// Composites (§18), implemented deliberately, not blindly
// ---------------------------------------------------------------------------

export function composites(dims: Record<ConstructId, DimensionResult>, up: UsageProfile) {
  const d = (c: ConstructId) => dims[c].score;
  // Experimentation proxy: adaptability + fluency behavior
  const experimentation = (d("adaptability") + d("fluency")) / 2;
  const augmentation = round1(0.35 * d("amplification") + 0.25 * d("agency") + 0.2 * d("transfer") + 0.2 * d("fluency"));
  const judgment = round1(0.5 * d("verification") + 0.3 * d("agency") + 0.2 * d("responsibleUse"));
  const capabilityTransfer = round1(0.55 * d("transfer") + 0.25 * d("skillGrowth") + 0.2 * d("dependencySafety"));
  const dependencyIndex = round1(Math.max(0, Math.min(100,
    (100 - d("dependencySafety")) * 0.6 + (100 - d("agency")) * 0.2 + (up.usage >= 4 ? 12 : up.usage >= 3 ? 6 : 0))));
  // Underexposure (§18): low practical capability + low experimentation, tempered by intentionality
  let underexposure = Math.max(0, Math.min(100,
    (100 - d("fluency")) * 0.45 + (100 - experimentation) * 0.3 + (up.usage <= 2 ? 25 : up.usage <= 3 ? 8 : 0)));
  if (up.intentionalSelectiveUse) underexposure *= 0.45; // mature selective use is not naive avoidance
  underexposure = round1(underexposure);
  const futureReadiness = round1(Math.max(0, Math.min(100,
    0.3 * d("fluency") + 0.25 * d("adaptability") + 0.2 * d("transfer") + 0.15 * d("verification") + 0.1 * d("amplification")
    - Math.max(0, underexposure - 50) * 0.3)));
  return { futureReadiness, augmentation, judgment, capabilityTransfer, underexposure, dependencyIndex };
}

// ---------------------------------------------------------------------------
// Calibration (B1 desirability + B2 prediction, §4.4 and §4.7 fixes)
// ---------------------------------------------------------------------------

export function measuredBand(index: number): number {
  const [b5, b4, b3, b2] = CALIBRATION.bands;
  return index >= b5 ? 5 : index >= b4 ? 4 : index >= b3 ? 3 : index >= b2 ? 2 : 1;
}

export function calibration(sub: Submission, index: number): CalibrationResult {
  const band = measuredBand(index);
  const desirabilityGap = sub.b1 !== undefined ? sub.b1 - band : undefined;
  const calibrationGap = sub.b2 !== undefined ? sub.b2 - band : undefined;
  let note: string;
  if (calibrationGap !== undefined && Math.abs(calibrationGap) <= 1) {
    note = "Your prediction of your own result was close to accurate: a sign of healthy self-knowledge about your AI habits.";
  } else if (desirabilityGap !== undefined && desirabilityGap >= CALIBRATION.overconfident) {
    note = "Your relationship with AI feels noticeably healthier to you than it measured. That pattern is worth attention: fluent output can make habits feel stronger than they are.";
  } else if (desirabilityGap !== undefined && desirabilityGap <= CALIBRATION.selfCritical) {
    note = "You judged your habits more harshly than they measured. Your practices are stronger than they feel from the inside.";
  } else {
    note = "Your sense of your own habits and the measurement broadly agree.";
  }
  return { desirabilityGap, calibrationGap, note };
}

// ---------------------------------------------------------------------------
// Overall confidence (§15)
// ---------------------------------------------------------------------------

export function overallConfidence(persona: Persona, sub: Submission, gapsFlagged: number): { level: ConfidenceLevel; notes: string[] } {
  const items = applicableItems(persona, sub.usage);
  const scoreable = items.filter(i => i.construct);
  const answered = scoreable.filter(i => {
    const v = sub.answers[i.id];
    return v !== undefined && !(i.type === "outcome" && v === 0);
  }).length;
  const frac = answered / scoreable.length;
  const notes: string[] = [];
  let level: ConfidenceLevel;
  if (frac < CONFIDENCE.minAnsweredForPreliminary) {
    level = "insufficient";
    notes.push("Too few questions were answered for a stable profile; treat everything here as tentative.");
  } else if (frac < CONFIDENCE.minAnsweredForModerate) {
    level = "preliminary";
    notes.push("Several questions were skipped or marked as outside your experience, so this profile is preliminary.");
  } else if (frac < CONFIDENCE.minAnsweredForHigh || gapsFlagged > CONFIDENCE.maxGapsForHigh) {
    level = "moderate";
    if (gapsFlagged > CONFIDENCE.maxGapsForHigh) {
      notes.push("On several dimensions, what you said about yourself and how you answered the situational questions diverged. We weighted the situational answers more heavily and lowered the certainty of those dimensions.");
    }
  } else {
    level = "high";
  }
  if (sub.usage <= USAGE.lowUseMax) {
    notes.push("Because your current AI exposure is limited, the dimensions that depend on hands-on experience (fluency, transfer, amplification, adaptability) are marked preliminary rather than penalized.");
  }
  return { level, notes };
}

export const round1 = (n: number) => Math.round(n * 10) / 10;
