/**
 * Archetypes (§20): derived from multidimensional patterns, never from a single
 * threshold. Rules are ordered; the first match wins. A default always exists,
 * but unlike the v1 residual bucket it does not absorb two thirds of respondents: the rules above it
 * absorb the meaningfully distinct profiles first (verified in tests).
 */
import type { CompassResult, ConstructId, DimensionResult, UsageProfile } from "./types";

type Dims = Record<ConstructId, DimensionResult>;
const s = (d: Dims, c: ConstructId) => d[c].score;

export interface ArchetypeDef {
  id: string; name: string; tagline: string;
  test: (d: Dims, u: UsageProfile) => boolean;
  narrative: string;
}

export const ARCHETYPES: ArchetypeDef[] = [
  {
    id: "strategic_integrator", name: "The Strategic Integrator",
    tagline: "Deliberate, verified, high-leverage collaboration with AI.",
    test: (d, u) => u.usage >= 3 && s(d, "fluency") >= 68 && s(d, "agency") >= 65 && s(d, "verification") >= 65 && s(d, "dependencySafety") >= 60,
    narrative: "You choose where AI belongs and where it does not, you check what it gives you, and you would still be strong with the tools switched off. Your remaining growth is outward and structural: workflow redesign, and building these habits in others.",
  },
  {
    id: "grounded_selectivist", name: "The Grounded Selectivist",
    tagline: "Low use by deliberate choice, backed by real judgment.",
    test: (d, u) => u.intentionalSelectiveUse,
    narrative: "You limit AI on purpose and your judgment scores back that up: this is selectivity, not avoidance. Your one exposure is drift: the competencies of hands-on collaboration are formed by practice, and deliberate non-practice still forgoes them. Bounded, chosen experiments would keep your selectivity current.",
  },
  {
    id: "augmented_thinker", name: "The Augmented Thinker",
    tagline: "AI is measurably improving how you think, not just what you produce.",
    test: d => s(d, "amplification") >= 65 && s(d, "agency") >= 58 && s(d, "transfer") >= 58 && s(d, "dependencySafety") >= 52,
    narrative: "Your responses show AI functioning as a thinking partner: it widens your options, challenges your assumptions, and what you learn with it survives without it. Protect this by keeping verification and unaided practice in the loop as your volume of use grows.",
  },
  {
    id: "capable_but_unexposed", name: "The Capable Traditionalist",
    tagline: "Strong human foundation; the AI-shaped competencies are not yet formed.",
    test: (d, u) => u.usage <= 2 && s(d, "dependencySafety") >= 60 && s(d, "fluency") < 55,
    narrative: "Nothing suggests AI is harming you; your independent capability is solid. The risk runs the other way: collaborating with AI, evaluating its output, and integrating it into real work are becoming distinct competencies, and your responses show limited practice in them. Your priority is exposure, not restraint.",
  },
  {
    id: "dependent_operator", name: "The Dependent Operator",
    tagline: "Fluent and fast, with the underlying capability thinning.",
    test: (d, u) => u.usage >= 3 && s(d, "fluency") >= 55 && s(d, "dependencySafety") < 45,
    narrative: "You can move quickly with AI, and the work is probably good. Your responses raise one serious question: how much of it could you still do alone? The pattern here is the one this instrument exists to catch, because it feels like success while it develops.",
  },
  {
    id: "uncritical_consumer", name: "The Uncritical Consumer",
    tagline: "Regular use with the checking switched off.",
    test: (d, u) => u.usage >= 3 && s(d, "verification") < 45,
    narrative: "AI is in your routine, but your responses show confident output being accepted largely as received. Fluency without verification compounds quietly: every unchecked claim that happens to be right trains the habit that will eventually pass along the one that is not.",
  },
  {
    id: "curious_explorer", name: "The Curious Explorer",
    tagline: "Real experimentation under way; habits and evaluation still forming.",
    test: (d, u) => u.usage >= 2 && s(d, "adaptability") >= 50 && s(d, "fluency") >= 40 && s(d, "fluency") < 68,
    narrative: "You are genuinely in motion: trying tools, finding uses, building skill. What is not yet formed is the frame around the motion: where AI is allowed, what always gets checked, and how assisted work becomes unaided capability. Adding that frame converts exploration into development.",
  },
  {
    id: "hesitant_starter", name: "The Hesitant Starter",
    tagline: "Early, uncertain, and largely unformed AI habits.",
    // Part B7 defines this as low usage AND low fluency AND not intentional.
    // Testing usage alone made it a catch-all for every light user, including
    // highly competent ones, which contradicts Part A: usage is not maturity.
    test: (d, u) => u.usage <= 2 && s(d, "fluency") < 45 && !u.intentionalSelectiveUse,
    narrative: "Your relationship with AI is at its beginning, and your responses show more uncertainty than pattern, which is honest and common. The next step is small and concrete: one real task of your own, taken through an AI tool end to end, with attention to what it did well and where it failed.",
  },
  {
    id: "forming_practitioner", name: "The Forming Practitioner",
    tagline: "Moderate, broadly balanced use; the pattern is forming but not yet distinct.",
    test: () => true,
    narrative: "Your profile is genuinely mixed: no dimension is collapsing and none is yet a signature strength. That is a real position, not a failure; the report's dimension-level findings below matter more for you than any single label, because your next step is specific to your weakest link rather than to a type.",
  },
];

export function classify(dims: Dims, up: UsageProfile) {
  const a = ARCHETYPES.find(r => r.test(dims, up))!;
  return { id: a.id, name: a.name, tagline: a.tagline, narrative: a.narrative };
}

/** §38: compact profile fingerprint. */
export function fingerprint(dims: Dims, comp: { futureReadiness: number; dependencyIndex: number }): string[] {
  const level = (n: number) => n >= 70 ? "HIGH" : n >= 50 ? "MODERATE" : n >= 35 ? "LOW-MODERATE" : "LOW";
  return [
    `${level(dims.fluency.score)} AI FLUENCY`,
    `${level(dims.dependencySafety.score)} INDEPENDENT FOUNDATION`,
    `${level(dims.verification.score)} VERIFICATION`,
    `${level(dims.amplification.score)} AMPLIFICATION`,
    `${dims.agency.score >= 70 ? "STRONG" : dims.agency.score >= 50 ? "STABLE" : "WEAK"} AGENCY`,
    `${comp.dependencyIndex >= 60 ? "ELEVATED" : comp.dependencyIndex >= 40 ? "MODERATE" : "LOW"} DEPENDENCY`,
    `${level(comp.futureReadiness)} FUTURE READINESS`,
  ];
}
