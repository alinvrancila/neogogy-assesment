/**
 * Business Owner outputs that no other persona produces.
 *
 * The Risk Register turns fired signals and harm patterns into a list an owner
 * can act on: what is exposed, what kind of exposure it is, the evidence behind
 * it, and the action already chosen for it. The ninety day plan sequences those
 * actions so that anything legal or data related is dealt with first.
 *
 * Both are derived, never independently scored, so they cannot disagree with
 * the rest of the report.
 */

import type {
  CompassResult, PatternHit, Recommendation, RiskCategory, RiskRegisterEntry,
  RiskSignal, NinetyDayPhase, UsageProfile,
} from "./types";

interface Exposure {
  category: RiskCategory;
  title: string;
  description: string;
  tag: string;
}

/** What each signal exposes, in the owner's terms. */
const SIGNAL_EXPOSURES: Record<string, Exposure> = {
  data_leakage_risk: {
    category: "legal", tag: "data_leakage_risk", title: "Customer or business data leaving the business",
    description: "Your responses are consistent with sensitive material being entered into tools that were never approved for it, which is a disclosure question before it is a technology one.",
  },
  shadow_ai_blindspot: {
    category: "legal", tag: "shadow_ai_blindspot", title: "Tool use you cannot currently see",
    description: "Your answers suggest staff AI use is assumed rather than known. Treat this as a lower bound: research consistently finds owners underestimate it.",
  },
  disclosure_gap: {
    category: "reputational", tag: "disclosure_gap", title: "No settled position on disclosure",
    description: "Your responses suggest there is no agreed answer to a customer asking whether AI wrote what they received.",
  },
  customer_facing_unverified: {
    category: "legal", tag: "customer_facing_unverified", title: "Unchecked output reaching customers or records",
    description: "Your answers are consistent with AI-generated material carrying commercial consequence without a proportionate check.",
  },
  uncritical_acceptance: {
    category: "operational", tag: "uncritical_acceptance", title: "Confident output accepted as received",
    description: "Your responses suggest plausible answers are being taken at face value, which is where the expensive errors come from.",
  },
  single_point_of_failure: {
    category: "operational", tag: "single_point_of_failure", title: "Processes that exist in one tool or one head",
    description: "Your answers are consistent with core work that would stop, or would have to be rebuilt, if one tool or one person went away.",
  },
  vendor_lockin: {
    category: "financial", tag: "vendor_lockin", title: "No priced alternative to a critical vendor",
    description: "Your responses suggest a price or terms change would have to be absorbed rather than answered.",
  },
  knowledge_not_captured: {
    category: "strategic", tag: "knowledge_not_captured", title: "Operating knowledge the business does not own",
    description: "Your answers are consistent with valuable process living in individual accounts rather than in the business.",
  },
  decision_abdication: {
    category: "strategic", tag: "decision_abdication", title: "Significant decisions made by the tool in practice",
    description: "Your responses suggest recommendations being adopted without the reasoning being made yours, which is difficult to defend later.",
  },
  team_deskilling: {
    category: "operational", tag: "team_deskilling", title: "A team that may not be able to check its own work",
    description: "Your answers are consistent with underlying craft thinning while output holds, which shows up first in a busy week.",
  },
  brand_homogenization: {
    category: "reputational", tag: "brand_homogenization", title: "Customer-facing material that could be anyone's",
    description: "Your responses suggest content going out that customers can recognise as generic, which they discount.",
  },
  pilot_without_metric: {
    category: "financial", tag: "pilot_without_metric", title: "Spending without a measured result",
    description: "Your answers are consistent with workflows running on how they feel rather than what they moved.",
  },
  wrong_process_automation: {
    category: "financial", tag: "wrong_process_automation", title: "Tools adopted on promise rather than fit",
    description: "Your responses suggest adoption decisions made before the process, the number, and the owner were named.",
  },
  independent_capability_low: {
    category: "operational", tag: "independent_capability_low", title: "Limited practice operating without the tools",
    description: "Your answers are consistent with capability that is available through a vendor rather than held in the business.",
  },
  privacy_boundary: {
    category: "legal", tag: "privacy_boundary", title: "No written line on what may be entered into a tool",
    description: "Your responses suggest the boundary exists as understanding rather than as a rule anyone could state.",
  },
  authority_transfer: {
    category: "strategic", tag: "authority_transfer", title: "Authority moving to the tool",
    description: "Your answers are consistent with decisions being taken where accountability does not sit.",
  },
  overtrust_pattern: {
    category: "operational", tag: "overtrust_pattern", title: "Trust not proportionate to consequence",
    description: "Your responses suggest the same level of checking across work of very different stakes.",
  },
  shallow_use: {
    category: "strategic", tag: "shallow_use", title: "Speed without better decisions",
    description: "Your answers are consistent with AI producing the same thinking faster rather than improving it.",
  },
};

/** Harm patterns are combinations, so each carries its own entry. */
const PATTERN_EXPOSURES: Record<string, Exposure> = {
  fragile_automation: {
    category: "operational", tag: "single_point_of_failure", title: "Output resting on a base that would not survive a vendor change",
    description: "Heavy use, low continuity, and little captured knowledge together. The productivity is real and so is the fragility underneath it.",
  },
  shadow_ai_blindspot: {
    category: "legal", tag: "shadow_ai_blindspot", title: "Governance behind the level of use",
    description: "Regular use across the business without a policy keeping pace with it.",
  },
  trust_exposure: {
    category: "reputational", tag: "customer_facing_unverified", title: "Unverified and undifferentiated material reaching customers",
    description: "Content that is neither checked nor distinctly yours is the combination customers notice first.",
  },
  pilot_theater: {
    category: "financial", tag: "pilot_without_metric", title: "Capable adoption without a measured result",
    description: "Workflows running on the strength of how they feel, with no established point at which they stop.",
  },
  dependency_pattern: {
    category: "operational", tag: "independent_capability_low", title: "Capability concentrated in the tools",
    description: "Frequent use alongside thinning independent capability in the business.",
  },
};

/** The business name of a dimension, for the evidence column. */
const READING_NAMES: Record<string, string> = {
  agency: "Owner decision ownership", verification: "Verification before consequence",
  dependencySafety: "Operational continuity", fluency: "Business AI fluency",
  transfer: "Institutional knowledge capture", amplification: "Strategic amplification",
  skillGrowth: "Team capability growth", adaptability: "Business adaptability",
  responsibleUse: "Governance, data and trust", creativity: "Market differentiation",
};
const readingName = (c: string) => READING_NAMES[c] ?? c;

const CATEGORY_ORDER: RiskCategory[] = ["legal", "financial", "operational", "reputational", "strategic"];

/**
 * The register: one entry per distinct exposure, most severe first, each linked
 * to the recommendation that answers it where one was selected.
 */
export function buildRiskRegister(
  signals: RiskSignal[], patterns: PatternHit[], recommendations: Recommendation[],
  dims?: Record<string, { score: number }>, persona?: string
): RiskRegisterEntry[] {
  const byTitle = new Map<string, RiskRegisterEntry>();
  const severityRank = { high: 0, elevated: 1, watch: 2 } as const;
  const recByTag = new Map(recommendations.map((r) => [r.tag, r]));

  for (const p of patterns.filter((x) => x.kind === "harm")) {
    const e = PATTERN_EXPOSURES[p.id];
    if (!e) continue;
    byTitle.set(e.title, {
      title: e.title, category: e.category, severity: "elevated",
      description: e.description,
      evidence: `${p.label}, across ${p.evidence.length} dimension${p.evidence.length === 1 ? "" : "s"}`,
      action: recByTag.get(e.tag)?.capability,
      actionTag: recByTag.has(e.tag) ? e.tag : undefined,
    });
  }

  for (const s of [...signals].sort((a, b) => severityRank[a.severity] - severityRank[b.severity])) {
    const e = SIGNAL_EXPOSURES[s.tag];
    if (!e || byTitle.has(e.title)) continue;
    byTitle.set(e.title, {
      title: e.title, category: e.category, severity: s.severity,
      description: e.description,
      // name the reading rather than counting items: an owner can act on a number
      evidence: s.construct && dims?.[s.construct]
        ? `${readingName(s.construct)} at ${dims[s.construct].score}`
        : `${s.evidence.length} answer${s.evidence.length === 1 ? "" : "s"}`,
      action: recByTag.get(e.tag)?.capability,
      actionTag: recByTag.has(e.tag) ? e.tag : undefined,
    });
  }

  return [...byTitle.values()].sort((a, b) => {
    const bySeverity = severityRank[a.severity] - severityRank[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
  });
}

/**
 * Ninety days, in three blocks. Anything legal or data related goes first
 * whatever its priority label says, because exposure of that kind compounds
 * while everything else waits.
 */
export function buildNinetyDayPlan(
  recommendations: Recommendation[], register: RiskRegisterEntry[], up: UsageProfile
): NinetyDayPhase[] {
  const urgentTags = new Set(
    register.filter((e) => e.category === "legal" || e.category === "financial")
      .map((e) => e.actionTag).filter(Boolean) as string[]
  );

  const first: Recommendation[] = [];
  const second: Recommendation[] = [];
  const third: Recommendation[] = [];
  for (const rec of recommendations) {
    if (urgentTags.has(rec.tag) || rec.priority === "immediate") first.push(rec);
    else if (rec.priority === "important") second.push(rec);
    else third.push(rec);
  }
  // never leave a block empty while later blocks are full
  while (!second.length && first.length > 1) second.push(first.pop()!);
  while (!third.length && second.length > 1) third.push(second.pop()!);

  const phase = (
    title: string, window: string, note: string, items: Recommendation[]
  ): NinetyDayPhase => ({
    title, window, note,
    actions: items.map((r) => ({
      capability: r.capability, change: r.behaviorChange,
      practice: r.practice, checkpoint: r.evidenceOfProgress,
    })),
  });

  return [
    phase("Close the exposure", "Days 1 to 30",
      urgentTags.size
        ? "These come first because the exposure keeps accumulating while other work is done."
        : "Start where the constraint is, while the intent is fresh.",
      first),
    phase("Build the habit", "Days 31 to 60",
      "Standing practice, put in the calendar rather than left to intention.",
      second),
    phase("Make it the standard", "Days 61 to 90",
      up.underexposed
        ? "Widen deliberately, on evidence from the first two blocks."
        : "Turn what worked into how the business runs, so it survives a busy quarter.",
      third),
  ].filter((p) => p.actions.length > 0);
}
