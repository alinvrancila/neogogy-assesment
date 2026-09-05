/**
 * All tunable constants live here (v1 problem §4.7: undefended magic numbers
 * scattered through code). Every threshold is named, documented, and in one place
 * so it can later be calibrated against real respondent data.
 */
import type { ConstructDef, ConstructId } from "./types";

// ---------------------------------------------------------------------------
// Constructs
// ---------------------------------------------------------------------------

/**
 * What produced a reading.
 *
 * A comparison across waves is only valid when all four match, so a group
 * report prints them and a wave-on-wave comparison checks them.
 */
export const VERSIONS = {
  instrument: '2.3',
  scoring: '2.1',
  scenario: '2.0',
  language: 'en-GB',
} as const;

export const CONSTRUCTS: Record<ConstructId, ConstructDef> = {
  agency: {
    id: "agency", name: "Human Agency",
    principle: "The person remains the author of the work and the owner of the decision.",
    continuumWeight: 0.14,
  },
  verification: {
    id: "verification", name: "Verification & Judgment",
    principle: "Trust is earned through checking, not granted to confident output.",
    continuumWeight: 0.13,
  },
  dependencySafety: {
    id: "dependencySafety", name: "Independent Capability", reportedAsRisk: true,
    principle: "Capability without AI is preserved while capability with AI grows.",
    continuumWeight: 0.12,
  },
  fluency: {
    id: "fluency", name: "AI Fluency",
    principle: "Skillful use is learned, not assumed.",
    continuumWeight: 0.12,
  },
  transfer: {
    id: "transfer", name: "Learning Transfer",
    principle: "Assisted success must become human capability.",
    continuumWeight: 0.11,
  },
  amplification: {
    id: "amplification", name: "Cognitive Amplification",
    principle: "AI should make the thinking better, not just the output faster.",
    continuumWeight: 0.09,
  },
  skillGrowth: {
    id: "skillGrowth", name: "Skill Growth",
    principle: "Foundational skills keep developing under AI support.",
    continuumWeight: 0.09,
  },
  adaptability: {
    id: "adaptability", name: "Adaptive Growth",
    principle: "The person keeps learning as the tools change.",
    continuumWeight: 0.08,
  },
  responsibleUse: {
    id: "responsibleUse", name: "Responsible Use",
    principle: "Assistance remains honest, private where it must be, and humane.",
    continuumWeight: 0.07,
  },
  creativity: {
    id: "creativity", name: "Creative Leverage",
    principle: "AI widens imagination rather than narrowing it.",
    continuumWeight: 0.05,
  },
};

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export const SCORING = {
  /** Behavior is weighted above self-report (fixes v1 §4.5: triangulation discarded). */
  itemTypeWeights: { claim: 1.0, reverse: 1.0, scenario: 1.6, outcome: 1.2, branch: 1.0 },
  /** claim - behavior divergence at or beyond this flags a consistency gap. */
  consistencyGapThreshold: 2,
  /**
   * When a consistency gap is flagged, the claim item's weight is reduced by this
   * factor for that dimension, shifting the score toward behavioral evidence.
   * The gap therefore now carries real weight (Part V, item 1).
   */
  claimDiscountOnGap: 0.5,
  /** Fewer scored inputs than this on a dimension drops its confidence a level. */
  minInputsForFullConfidence: 3,
  /** Micro-state cutoffs. */
  /** Part B3: strong >= 65, developing 40..64.9, watch < 40. */
  microStrong: 65, microWatch: 40,
  /** A dimension needs this many answered scored items before it is reported. */
  minInputsForDimension: 2,
  /** A dimension counts as a genuine strength / vulnerability only past these. */
  strengthFloor: 65, vulnerabilityCeiling: 45,
};

// ---------------------------------------------------------------------------
// Usage handling (fixes v1 §4.1: abstention lockout)
// ---------------------------------------------------------------------------

export const USAGE = {
  /** usage <= this is "low use" and triggers the low-use branch. */
  lowUseMax: 2,
  /** usage >= this triggers the high-use dependency probes. */
  highUseMin: 4,
  /**
   * Low use no longer multiplies any score. Instead:
   * 1) experiential constructs get a confidence cap ("preliminary"), and
   * 2) the underexposure composite rises unless low use is intentional-selective.
   * No classification is foreclosed by the usage answer alone.
   */
  experientialConstructs: ["fluency", "transfer", "adaptability", "amplification"] as ConstructId[],
  /** Verification+agency at/above this with a deliberate reason = intentional selective use. */
  intentionalJudgmentFloor: 60,
};

// ---------------------------------------------------------------------------
// Continuum (§26-§37)
// ---------------------------------------------------------------------------

export interface StageDef {
  stage: number; id: string; name: string;
  short: string;
  /** entry criteria on the developmental index */
  minIndex: number;
  /** §36 gating: minimum construct scores required to hold this stage or above */
  gates?: Partial<Record<ConstructId, number>>;
  transitionRequirements: string[];
}

export const STAGES: StageDef[] = [
  { stage: 1, id: "detached", name: "AI Detached", minIndex: 0,
    short: "AI plays no meaningful role, and the shape of its relevance is not yet visible.",
    transitionRequirements: ["Name three concrete tasks in your own week where AI plausibly helps or harms", "Complete one guided first session with a modern AI system"] },
  { stage: 2, id: "aware", name: "AI Aware", minIndex: 12,
    short: "AI is on the radar conceptually, but there is little or no hands-on practice.",
    transitionRequirements: ["Run one real task of your own through an AI tool, end to end", "Write down what it did well and where it failed"] },
  { stage: 3, id: "curious", name: "AI Curious", minIndex: 24,
    short: "Occasional experimentation without stable habits or evaluation criteria.",
    transitionRequirements: ["Repeat one useful AI workflow until it is routine", "Adopt one simple check you always apply to AI output"] },
  { stage: 4, id: "exploring", name: "AI Exploring", minIndex: 35,
    short: "Regular experimentation; use is broad but evaluation and boundaries are thin.",
    transitionRequirements: ["Decide in advance where AI is allowed and where it is not for one week", "Verify one consequential claim per session against an external source"] },
  { stage: 5, id: "functional", name: "AI Functional", minIndex: 46,
    short: "AI reliably completes real tasks; judgment and independence are developing.",
    gates: { fluency: 35 },
    transitionRequirements: ["Do an unaided version of one AI-assisted task and compare the results", "Move from one-shot prompts to iterative, context-rich collaboration"] },
  { stage: 6, id: "integrating", name: "AI Integrating", minIndex: 56,
    short: "AI is woven into workflows with active verification and retained authorship.",
    gates: { agency: 45, verification: 45, fluency: 45 },
    transitionRequirements: ["Reconstruct AI-assisted learning independently after each significant session", "Deliberately allocate roles: what stays human, what goes to AI, and why"] },
  { stage: 7, id: "strategic", name: "AI Strategic", minIndex: 66,
    short: "Task selection is deliberate; AI is used where it creates real leverage and withheld where it erodes formation.",
    gates: { agency: 55, verification: 55, dependencySafety: 50, responsibleUse: 50 },
    transitionRequirements: ["Redesign one whole workflow (not one task) around human-AI role allocation", "Show transfer: apply an AI-assisted insight in a context with no AI present"] },
  { stage: 8, id: "augmented", name: "AI Augmented", minIndex: 75,
    short: "AI functions as a genuine cognitive amplifier; unaided capability is stable or growing.",
    gates: { agency: 60, verification: 60, dependencySafety: 55, responsibleUse: 55, transfer: 55 },
    transitionRequirements: ["Use AI to challenge your assumptions, not only to extend your drafts", "Mentor one other person into healthier AI habits"] },
  { stage: 9, id: "adaptive", name: "AI Adaptive", minIndex: 84,
    short: "Practices survive tool churn; new systems are absorbed quickly without losing judgment.",
    gates: { agency: 65, verification: 65, dependencySafety: 60, responsibleUse: 60, transfer: 60 },
    transitionRequirements: ["Periodically re-audit your own AI habits as tools change", "Contribute to the norms of your community, class, family, or institution"] },
  { stage: 10, id: "generative", name: "Future-ready / Generative", minIndex: 92,
    short: "Mature human-AI collaboration that also builds capability in others.",
    gates: { agency: 70, verification: 70, dependencySafety: 65, responsibleUse: 65, transfer: 65 },
    transitionRequirements: ["Sustain the pattern as tools, roles, and institutions change around you"] },
];

export const CONTINUUM = {
  /** within this distance of a stage boundary the result is marked borderline (§4.2 fix) */
  borderlineBand: 3,
  /** substage cut points within a stage's index band */
  substageEarly: 0.33, substageEstablished: 0.75,
};

// ---------------------------------------------------------------------------
// Confidence & calibration
// ---------------------------------------------------------------------------

export const CONFIDENCE = {
  minAnsweredForHigh: 0.9,   // fraction of applicable items
  minAnsweredForModerate: 0.75,
  minAnsweredForPreliminary: 0.6,
  maxGapsForHigh: 2,         // consistency flags
};

export const CALIBRATION = {
  /** measured band ladder, one ladder only (fixes v1 §4.7 dual ladders) */
  bands: [80, 62, 44, 26],   // >=80→5, >=62→4, >=44→3, >=26→2, else 1
  overconfident: 2,          // B gap >= this
  selfCritical: -1,          // B gap <= this
};
