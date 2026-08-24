/**
 * Neogogy Formation Compass v2 — core type system.
 *
 * Design decisions this file encodes (see docs/ARCHITECTURE.md):
 * - Ten measured constructs, all scored internally as "healthy = high" on 0..100.
 *   dependencySafety is reported to users as Dependency Risk = 100 - dependencySafety.
 * - Item metadata model per master spec §22: one answer can affect multiple
 *   constructs with weights (§17), items carry risk signals and recommendation tags.
 * - Continuous scores everywhere. The v1 13-value lattice is gone.
 */

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------

export type Persona = "student" | "teacher" | "parent" | "administrator";

// ---------------------------------------------------------------------------
// Constructs (measured dimensions)
// ---------------------------------------------------------------------------

export type ConstructId =
  | "fluency"          // AI Fluency: competent, adaptive tool use
  | "agency"           // Human Agency: authorship, final judgment, ownership
  | "amplification"    // Cognitive Amplification: AI makes thinking better
  | "dependencySafety" // Inverse of Dependency Risk: independent capability retained
  | "verification"     // Verification & Epistemic Judgment
  | "skillGrowth"      // Skill Preservation and Growth
  | "creativity"       // Creative range, originality, voice
  | "responsibleUse"   // Ethics, privacy, disclosure, relational balance
  | "transfer"         // Learning Transfer: assisted work becomes human capability
  | "adaptability";    // Adaptive Growth and experimentation

export const CONSTRUCT_IDS: ConstructId[] = [
  "fluency", "agency", "amplification", "dependencySafety", "verification",
  "skillGrowth", "creativity", "responsibleUse", "transfer", "adaptability",
];

export interface ConstructDef {
  id: ConstructId;
  name: string;          // user-facing name
  reportedAsRisk?: boolean; // dependencySafety renders as Dependency Risk
  principle: string;     // one-line formation principle
  continuumWeight: number; // contribution to the developmental index (sums to 1)
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export type ItemType =
  | "claim"      // positively worded self-rating (consistency-pair member)
  | "reverse"    // negatively worded, inverted at scoring
  | "scenario"   // behavioral scenario, custom anchored options (consistency-pair member)
  | "outcome"    // "since using AI, X has..." change item, balanced scale + N/A
  | "branch"     // adaptive follow-up (low-use reasons, high-use probes)
  | "baseline";  // B1 desirability, B2 prediction (unscored, gap layer only)

export type ScaleKey = "agreement" | "frequency" | "confidence" | "outcome";

export interface ItemOption {
  value: number;          // 1..5 (or 0 = "not enough experience" on outcome items)
  label: string;
  /** Optional per-option overrides of secondary construct effects. */
  effects?: Partial<Record<ConstructId, number>>; // additive nudges in 0..100 space
}

export interface SecondaryEffect {
  construct: ConstructId;
  weight: number; // relative to primary weight of 1.0; may be negative
}

export interface Item {
  id: string;
  persona: Persona | "shared";
  type: ItemType;
  construct?: ConstructId;        // primary construct (absent for baseline/branch)
  secondary?: SecondaryEffect[];  // §17: one answer, multiple weighted effects
  prompt: string;
  /** Optional plain-language clarification shown under the prompt. Use it when
   *  the question could be read more than one way; never to argue for an answer. */
  context?: string;
  scale?: ScaleKey;               // for claim/reverse/outcome items
  options?: ItemOption[];         // for scenario/branch items
  weight?: number;                // default 1.0; scenarios default 1.5 (behavior > claim)
  riskSignal?: string;            // signal tag emitted when answer is unhealthy
  recommendationTags?: string[];
  pairId?: string;                // links claim <-> scenario for the consistency gap
  adaptiveTrigger?: { when: "usageLow" | "usageHigh" };
  version: number;
}

// ---------------------------------------------------------------------------
// Answers
// ---------------------------------------------------------------------------

export interface Answers {
  [itemId: string]: number | undefined; // raw option value
}

export interface Submission {
  persona: Persona;
  usage: number;        // 1..5 usage frequency
  b1?: number;          // felt-health desirability baseline (1..5)
  b2?: number;          // predicted-result baseline (1..5)  — calibration input
  answers: Answers;
  modalityFocus?: string;
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export type ConfidenceLevel = "high" | "moderate" | "preliminary" | "insufficient";

export interface DimensionResult {
  construct: ConstructId;
  score: number;              // 0..100 continuous, healthy = high
  reportedScore: number;      // dependencySafety inverted for display
  confidence: ConfidenceLevel;
  evidenceCount: number;      // scored inputs that informed this dimension
  consistencyGap?: {          // claim vs behavior divergence (kept AND weighted)
    claim: number; behavior: number; gap: number; flagged: boolean;
  };
  microState: "strong" | "developing" | "watch";
}

export interface PatternHit {
  id: string;
  label: string;
  kind: "help" | "harm" | "mixed" | "neutral";
  narrative: string;
  evidence: string[]; // item ids / signal tags supporting the pattern
}

export interface RiskSignal {
  tag: string;
  construct?: ConstructId;
  severity: "watch" | "elevated" | "high";
  evidence: string[];
}

export interface StageResult {
  index: number;              // continuous developmental index 0..100
  rawIndex: number;           // before gating
  stage: number;              // 1..10
  stageId: string;
  stageName: string;
  substage: "early" | "established" | "transitioning";
  borderline?: { adjacentStage: number; distance: number }; // §4.2 fix
  gated?: { cappedFrom: number; reasons: string[] };        // §36 gating
}

export interface Bottleneck {
  construct: ConstructId;
  reason: string;             // why THIS is the constraint (may not be lowest score)
  viaGate: boolean;
  saturated?: boolean; // no meaningful deficit remains; skip bottleneck-driven advice
}

export interface Recommendation {
  tag: string;
  priority: "immediate" | "important" | "developmental" | "advanced";
  capability: string;
  behaviorChange: string;
  practice: string;
  evidenceOfProgress: string;
  riskToMonitor: string;
}

export interface CalibrationResult {
  desirabilityGap?: number;   // B1 vs measured band (v1 "illusion", kept, no longer distorted by damping)
  calibrationGap?: number;    // B2 predicted vs actual band (§4.7 fix: B2 finally used)
  note: string;
}

export interface UsageProfile {
  usage: number;
  category: "minimal" | "light" | "regular" | "heavy";
  lowUseReason?: string;      // from adaptive branch
  intentionalSelectiveUse: boolean; // §4 of master spec: mature low use is possible
  underexposed: boolean;
}

export interface CompassResult {
  persona: Persona;
  usageProfile: UsageProfile;
  dimensions: Record<ConstructId, DimensionResult>;
  composites: {
    futureReadiness: number;
    augmentation: number;
    judgment: number;
    capabilityTransfer: number;
    underexposure: number;    // 0..100, high = concern
    dependencyIndex: number;  // 0..100, high = concern
  };
  patterns: PatternHit[];
  riskSignals: RiskSignal[];
  strengths: { construct: ConstructId; score: number }[];   // only genuinely strong dims
  vulnerabilities: { construct: ConstructId; score: number }[]; // only genuinely weak dims
  stage: StageResult;
  nextTarget: { stage: number; stageName: string; requirements: string[] };
  bottleneck: Bottleneck;
  archetype: { id: string; name: string; tagline: string; narrative: string };
  fingerprint: string[];      // §38 compact profile fingerprint
  recommendations: Recommendation[];
  calibration: CalibrationResult;
  overallConfidence: ConfidenceLevel;
  confidenceNotes: string[];
}
