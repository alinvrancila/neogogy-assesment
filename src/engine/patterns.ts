/**
 * Cross-dimensional pattern logic (§19) and the help/harm framework (§21).
 * All narratives use non-causal, evidence-hedged language ("your responses are
 * consistent with...") per §21.
 */
import type { CompassResult, ConstructId, DimensionResult, PatternHit, UsageProfile } from "./types";

type Dims = Record<ConstructId, DimensionResult>;

interface PatternRule {
  id: string; label: string; kind: PatternHit["kind"];
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
];

export function detectPatterns(dims: Dims, up: UsageProfile): PatternHit[] {
  return PATTERN_RULES.filter(r => r.test(dims, up)).map(r => ({
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
