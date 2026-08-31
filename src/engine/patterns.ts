/**
 * Cross-dimensional pattern logic (§19) and the help/harm framework (§21).
 * All narratives use non-causal, evidence-hedged language ("your responses are
 * consistent with...") per §21.
 */
import type { CompassResult, ConstructId, DimensionResult, PatternHit, Persona, UsageProfile } from "./types";

type Dims = Record<ConstructId, DimensionResult>;

interface PatternRule {
  id: string; label: string; kind: PatternHit["kind"];
  /** When set, the rule only applies to these personas. */
  personas?: Persona[];
  test: (d: Dims, u: UsageProfile) => boolean;
  narrative: (d: Dims, u: UsageProfile) => string;
  evidence: (d: Dims) => string[];
}

const s = (d: Dims, c: ConstructId) => d[c].score;

export const PATTERN_RULES: PatternRule[] = [
  {
    id: "sophisticated_augmentation", label: "Sophisticated augmentation", kind: "help",
    test: (d, u) => u.usage >= 3 && s(d, "agency") >= 65 && s(d, "verification") >= 65 && s(d, "fluency") >= 60,
    narrative: () => "High use combined with high agency and active verification. Your responses are consistent with AI functioning as a genuine amplifier: you use it heavily, you check it, and you remain the author.",
    evidence: d => ["fluency", "agency", "verification"].map(c => d[c as ConstructId].construct),
  },
  {
    id: "dependency_pattern", label: "Dependency pattern", kind: "harm",
    test: (d, u) => u.usage >= 3 && s(d, "dependencySafety") < 45,
    narrative: d => `Frequent use alongside weakening independent capability. Your responses suggest that some tasks may no longer be fully yours to perform without the tool (independent capability measured at ${d.dependencySafety.score}).`,
    evidence: d => ["dependencySafety"],
  },
  {
    id: "intentional_selective", label: "Intentional selective use", kind: "neutral",
    test: (d, u) => u.intentionalSelectiveUse,
    narrative: () => "Low use paired with strong judgment and a deliberate rationale. This pattern is consistent with mature selectivity rather than avoidance; the open question is whether your hands-on fluency keeps pace with the contexts where AI competence will matter.",
    evidence: () => ["verification", "agency"],
  },
  {
    id: "underexposure_vulnerability", label: "Future-readiness vulnerability", kind: "harm",
    test: (d, u) => u.underexposed,
    narrative: () => "Low use, low practical fluency, and limited experimentation together. Nothing here suggests AI is harming you; the risk runs the other way: several competencies that increasingly matter are not yet being formed.",
    evidence: () => ["fluency", "adaptability"],
  },
  {
    id: "efficiency_learning_tradeoff", label: "Efficiency without learning", kind: "harm",
    test: (d, u) => u.usage >= 3 && s(d, "fluency") >= 60 && s(d, "transfer") < 45,
    narrative: () => "Strong practical fluency alongside weak learning transfer. Your responses are consistent with AI helping you finish more than it helps you learn: output rises while durable capability lags behind it.",
    evidence: () => ["fluency", "transfer"],
  },
  {
    id: "overconfidence_risk", label: "Overconfidence risk", kind: "harm",
    test: d => s(d, "fluency") >= 65 && s(d, "verification") < 50,
    narrative: d => `AI fluency (${d.fluency.score}) substantially exceeds verification discipline (${d.verification.score}). You can produce sophisticated AI-assisted work faster than your current validation habits can reliably evaluate it.`,
    evidence: () => ["fluency", "verification"],
  },
  {
    id: "cautious_underleveraged", label: "Cautious but underleveraged", kind: "mixed",
    test: (d, u) => s(d, "verification") >= 65 && s(d, "adaptability") < 45 && u.usage <= 3,
    narrative: () => "Strong verification habits alongside limited experimentation. Your caution is an asset; applied to a wider range of real workflows, it would become leverage rather than a brake.",
    evidence: () => ["verification", "adaptability"],
  },
  {
    id: "originality_concern", label: "Creativity without ownership", kind: "harm",
    test: d => s(d, "creativity") >= 60 && s(d, "agency") < 45,
    narrative: () => "Creative range is expanding while ownership weakens. Your responses suggest AI is supplying ideas faster than you are claiming and shaping them; over time that pattern tends to flatten a personal voice.",
    evidence: () => ["creativity", "agency"],
  },
  {
    id: "amplified_thinker", label: "Genuine cognitive amplification", kind: "help",
    test: d => s(d, "amplification") >= 65 && s(d, "transfer") >= 60 && s(d, "dependencySafety") >= 55,
    narrative: () => "AI is improving the thinking, not just the output: amplification, transfer, and independent capability are all holding together. This is the pattern the whole instrument is oriented toward.",
    evidence: () => ["amplification", "transfer", "dependencySafety"],
  },
  {
    id: "erosion_under_success", label: "Capability thinning behind good output", kind: "harm",
    test: (d, u) => u.usage >= 3 && s(d, "fluency") >= 60 && (s(d, "skillGrowth") < 45 || s(d, "dependencySafety") < 50),
    narrative: () => "Skilled, productive use in front; thinning foundations behind. The work looks strong and probably is; the question your answers raise is whether you would still be this strong with the tools switched off.",
    evidence: () => ["fluency", "skillGrowth", "dependencySafety"],
  },

  /* ------------------------------------------------ Business Owner only */
  {
    id: "fragile_automation", label: "Fragile automation", kind: "harm",
    personas: ["business"],
    test: (d, u) => u.usage >= 4 && s(d, "dependencySafety") <= 40 && s(d, "transfer") <= 45,
    narrative: d => `Output is rising on a base that would not survive a vendor change. Your responses suggest core work now runs through AI (continuity measured at ${d.dependencySafety.score}) while little of it is documented outside those tools (knowledge capture at ${d.transfer.score}).`,
    evidence: () => ["dependencySafety", "transfer"],
  },
  {
    id: "shadow_ai_blindspot", label: "Governance blind spot", kind: "harm",
    personas: ["business"],
    test: (d, u) => u.usage >= 3 && s(d, "responsibleUse") <= 45,
    narrative: () => "Regular use across the business without governance keeping pace. Your answers suggest exposure you would not currently be able to see, which is the ordinary shape of this problem rather than an unusual one: research through 2026 consistently finds owners overestimate their visibility into staff tool use.",
    evidence: () => ["responsibleUse"],
  },
  {
    id: "trust_exposure", label: "Customer trust exposure", kind: "harm",
    personas: ["business"],
    test: (d, u) => u.usage >= 3 && s(d, "verification") <= 45 && s(d, "creativity") <= 45,
    narrative: () => "Unverified and undifferentiated content reaching customers together. Your responses are consistent with material going out that is neither checked nor distinctly yours, which is the combination customers notice first and discount fastest.",
    evidence: () => ["verification", "creativity"],
  },
  {
    id: "pilot_theater", label: "Activity without measurement", kind: "harm",
    personas: ["business"],
    test: (d, u) => u.usage >= 3 && s(d, "adaptability") <= 40 && s(d, "fluency") >= 55,
    narrative: () => "Capable adoption without a measured result. Your responses suggest workflows running on the strength of how they feel rather than what they moved, which is the condition MIT's 2025 study associated with pilots that never reached the profit and loss account.",
    evidence: () => ["adaptability", "fluency"],
  },
  {
    id: "advantaged_operator", label: "Compounding operating advantage", kind: "help",
    personas: ["business"],
    test: (d, u) => u.usage >= 3 && s(d, "agency") >= 65 && s(d, "verification") >= 65
      && s(d, "amplification") >= 65 && s(d, "adaptability") >= 65,
    narrative: () => "Decision quality, checking, and review are holding together at volume. Your responses are consistent with AI compounding the quality of decisions on a governed base, which is the arrangement that produces a durable advantage rather than a temporary speed gain.",
    evidence: () => ["agency", "verification", "amplification", "adaptability"],
  },

  /* --------------------------------------------- Pastor and Preacher only */
  {
    id: "outsourced_pulpit", label: "The message is increasingly the tool's", kind: "harm",
    personas: ["pastor"],
    test: (d, u) => u.usage >= 4 && s(d, "agency") <= 45 && s(d, "dependencySafety") <= 45,
    narrative: () => "Heavy use alongside thinning authorship and capacity. Your answers are consistent with the tool carrying more of the message than you would choose if you were choosing it fresh. This is a common place to arrive under load rather than a verdict on your ministry, and the way back is small and repeatable.",
    evidence: () => ["agency", "dependencySafety"],
  },
  {
    id: "unverified_authority", label: "Confident errors may be reaching the pulpit", kind: "harm",
    personas: ["pastor"],
    test: (d, u) => u.usage >= 3 && s(d, "verification") <= 45,
    narrative: () => "Regular use with the checking loosened. Your responses suggest material may be reaching your people that has not been confirmed. The errors that survive are the plausible ones, which is why one habit, never preaching an unverified quotation, catches most of them.",
    evidence: () => ["verification"],
  },
  {
    id: "presence_displacement", label: "Presence receding", kind: "harm",
    personas: ["pastor"],
    test: (d, u) => u.usage >= 3 && s(d, "responsibleUse") <= 45,
    narrative: () => "Your answers suggest parts of pastoral care that used to happen in your own presence and your own words are moving toward the tool. The right use of it gives a pastor more time with people, and this reading points the other way.",
    evidence: () => ["responsibleUse"],
  },
  {
    id: "thinning_voice", label: "Fluent, and less like you", kind: "harm",
    personas: ["pastor"],
    test: (d) => s(d, "creativity") <= 45 && s(d, "fluency") >= 55,
    narrative: () => "Skilled use alongside a thinning voice. Your responses are consistent with sermons that are competent and could be preached unchanged somewhere else. Your congregation usually feels this before anyone can name it.",
    evidence: () => ["creativity", "fluency"],
  },
  {
    id: "fed_shepherd", label: "The tool deepens the study, and the preacher stays fed", kind: "help",
    personas: ["pastor"],
    test: (d, u) => u.usage >= 3 && s(d, "agency") >= 65 && s(d, "transfer") >= 65
      && s(d, "amplification") >= 65 && s(d, "dependencySafety") >= 65,
    narrative: () => "Authorship, retained formation, deeper study, and unaided capacity are holding together at real usage. Your responses are consistent with the arrangement this check hopes to find: the tool goes further into the text with you, and what you learn stays in you.",
    evidence: () => ["agency", "transfer", "amplification", "dependencySafety"],
  },
];

export function detectPatterns(dims: Dims, up: UsageProfile, persona?: Persona): PatternHit[] {
  return PATTERN_RULES
    .filter(r => !r.personas || (persona ? r.personas.includes(persona) : false))
    .filter(r => r.test(dims, up))
    .map(r => ({
      id: r.id, label: r.label, kind: r.kind,
      narrative: r.narrative(dims, up), evidence: r.evidence(dims),
    }));
}

/** §21: split detected evidence into help vs risk for the report. */
export function helpHarm(patterns: PatternHit[]) {
  return {
    helping: patterns.filter(p => p.kind === "help"),
    harming: patterns.filter(p => p.kind === "harm"),
    mixed: patterns.filter(p => p.kind === "mixed" || p.kind === "neutral"),
  };
}
