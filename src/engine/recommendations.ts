/**
 * Recommendation engine (§49, §41): recommendations correspond to detected
 * behaviors (risk signals + bottleneck construct), not to the archetype alone.
 * This fixes v1 §4.6 (four static advice sets for the entire instrument).
 * Each entry follows the §41 roadmap shape: capability / behavior change /
 * practice / evidence of progress / risk to monitor.
 */
import type { Bottleneck, ConstructId, Recommendation, RiskSignal, UsageProfile } from "./types";

const R = (tag: string, priority: Recommendation["priority"], capability: string,
  behaviorChange: string, practice: string, evidenceOfProgress: string, riskToMonitor: string): Recommendation =>
  ({ tag, priority, capability, behaviorChange, practice, evidenceOfProgress, riskToMonitor });

const LIBRARY: Record<string, Recommendation> = {
  dependency_starting_tasks: R("dependency_starting_tasks", "immediate",
    "Independent task initiation",
    "Require an honest independent attempt before any AI tool is opened.",
    "For one week, start every substantial task with ten minutes of unaided work: define the problem, sketch an approach, write the first lines. Only then consult AI, and compare its direction with yours.",
    "Beginning tasks without the reflex to open a tool first; your unaided starts increasingly resemble your assisted ones.",
    "Turning the ten minutes into a ritual you wait out rather than work through."),
  independent_capability_low: R("independent_capability_low", "immediate",
    "Unaided capability maintenance",
    "Schedule regular no-AI repetitions of work you normally do with AI.",
    "Once a week, repeat one recent AI-assisted task entirely alone, then diff the two results honestly: speed, quality, and what you could not reproduce.",
    "The gap between assisted and unaided versions narrows month over month.",
    "Choosing only easy tasks for the unaided repetition."),
  verification_low: R("verification_low", "immediate",
    "Verification discipline",
    "Adopt a two-source rule for consequential claims.",
    "Before any AI-supplied claim enters graded work, a classroom, a family decision, or an institutional document, confirm it in one source the AI did not provide; for high-stakes claims, two.",
    "You catch at least one wrong or unsupported AI claim per week, because you are actually looking.",
    "Verifying only the claims that already felt doubtful."),
  uncritical_acceptance: R("uncritical_acceptance", "immediate",
    "Calibrated trust",
    "Separate 'sounds right' from 'is right' as a deliberate step.",
    "For one week, before accepting any substantive AI answer, write one sentence: what would have to be true for this to be wrong? Then check that one thing.",
    "Your acceptance rate drops and your correction rate rises; confident tone stops functioning as evidence.",
    "Letting the exercise lapse once outputs feel reliable again."),
  transfer_low: R("transfer_low", "important",
    "Learning transfer",
    "Close every significant AI session with unaided reconstruction.",
    "After AI explains or builds something that matters, close the tool and reconstruct the core from memory: the concept in your own words, the method's steps, the argument's spine. Reopen only to check.",
    "Cousin problems and later tasks no longer require returning to AI from zero.",
    "Reconstructing by recognition (re-reading) instead of recall."),
  skill_erosion: R("skill_erosion", "important",
    "Skill preservation",
    "Identify which skills you intend to keep, and train them on purpose.",
    "List three skills AI currently performs for you that you refuse to lose. For each, keep one regular rep where you perform it fully yourself, with AI allowed only as reviewer afterward.",
    "The kept skills hold or improve on unaided checks; nothing on your list quietly migrates to the tool.",
    "Letting the list grow stale as your AI use expands into new areas."),
  underexposure_fluency: R("underexposure_fluency", "important",
    "Practical AI fluency",
    "Replace abstract awareness with bounded, real experiments.",
    "Choose three recurring tasks from your actual week and run each through a modern AI tool properly: real context, iteration, and a judgment at the end about whether it earned a place in your routine.",
    "You can name, from experience rather than reputation, two tasks where AI helps you and one where it does not.",
    "Practicing on toy examples that never touch your real work."),
  authority_transfer: R("authority_transfer", "immediate",
    "Decision ownership",
    "Reinstate yourself as the final decision-maker, visibly.",
    "For every AI recommendation you act on this month, write the one-line reason you accepted it. If you cannot write the reason, the decision is not yet yours; do not act until it is.",
    "You can explain every accepted recommendation without referring back to the tool.",
    "Writing rationalizations after the fact rather than reasons before it."),
  creativity_homogenization: R("creativity_homogenization", "developmental",
    "Original ideation",
    "Generate before you ask.",
    "For creative work, produce your own concept first, in full, then use AI adversarially: have it find the clichés, attack the weak points, and propose what you would never propose. Synthesize; do not select.",
    "Your final concepts are traceable to your own starting idea more often than to the model's first suggestion.",
    "Sliding back to 'give me ten ideas' under deadline pressure."),
  privacy_risk: R("privacy_risk", "immediate",
    "Information boundaries",
    "Write down what never enters an AI tool, and hold the line.",
    "Draft your personal never-paste list (names, identifying details, confidential records, sensitive circumstances) and the anonymization step you apply when the underlying question still needs asking.",
    "Zero identifying or confidential details in your AI history on a spot check.",
    "Exceptions creeping in when the tool is convenient and the stakes feel low."),
  disclosure_risk: R("disclosure_risk", "immediate",
    "Honest attribution",
    "Make your AI involvement sayable, always.",
    "Adopt one rule: for any piece of work, you can state exactly what AI did and what you did, and you would be comfortable if the relevant person saw the full chat. Where rules are unclear, ask rather than assume.",
    "You disclose without being asked, and the disclosure costs you nothing because the ownership is real.",
    "Ambiguity becoming a permission slip again under pressure."),
  workflow_stagnation: R("workflow_stagnation", "developmental",
    "Adaptive practice",
    "Put your AI habits on a review cycle.",
    "Once a month, audit your main AI workflow: is it still producing? Has the tool changed? Is there a better pattern? Change one thing deliberately and evaluate the result.",
    "Your workflow this quarter differs from last quarter for reasons you can state.",
    "Reviews that always conclude nothing needs to change."),
  shallow_use: R("shallow_use", "developmental",
    "Cognitive amplification",
    "Move AI from answer-machine to thinking partner.",
    "Three prompts to add to your repertoire: ask AI to argue against your position, to list what your draft fails to consider, and to quiz you until your explanation breaks. Use one per session for two weeks.",
    "Sessions increasingly change your mind or sharpen your position, rather than just finishing your task.",
    "Reserving these prompts for low-stakes work only."),
};

/** Bottleneck construct → the signal tag whose recommendation addresses it. */
const BOTTLENECK_TAG: Record<ConstructId, string> = {
  fluency: "underexposure_fluency", agency: "authority_transfer", amplification: "shallow_use",
  dependencySafety: "independent_capability_low", verification: "verification_low",
  skillGrowth: "skill_erosion", creativity: "creativity_homogenization",
  responsibleUse: "privacy_risk", transfer: "transfer_low", adaptability: "workflow_stagnation",
};

export function buildRecommendations(signals: RiskSignal[], bottleneck: Bottleneck, up: UsageProfile): Recommendation[] {
  const chosen = new Map<string, Recommendation>();
  // 1. The bottleneck's recommendation leads, unless the profile is saturated.
  if (!bottleneck.saturated) {
    const btag = BOTTLENECK_TAG[bottleneck.construct];
    if (LIBRARY[btag]) chosen.set(btag, { ...LIBRARY[btag], priority: "immediate" });
  }
  // 2. High/elevated risk signals, in severity order.
  const order = { high: 0, elevated: 1, watch: 2 } as const;
  for (const s of [...signals].sort((a, b) => order[a.severity] - order[b.severity])) {
    if (chosen.size >= 5) break;
    if (LIBRARY[s.tag] && !chosen.has(s.tag)) chosen.set(s.tag, LIBRARY[s.tag]);
  }
  // 3. Underexposed low-users always get the fluency entry (§50), framed as exposure not volume.
  if (up.underexposed && !chosen.has("underexposure_fluency")) {
    chosen.set("underexposure_fluency", { ...LIBRARY.underexposure_fluency, priority: "immediate" });
  }
  // 4. If nothing fired, the profile is genuinely healthy: give maintenance work, not manufactured alarm.
  if (chosen.size === 0) {
    chosen.set("maintain", R("maintain", "advanced",
      "Pattern maintenance and mentorship",
      "Your risk is complacency, not collapse; keep the pattern examined as tools change.",
      "Schedule a quarterly self-audit of your AI habits, and teach one of your practices (verification, unaided reconstruction, boundaries) to one other person.",
      "The pattern survives a tool change, and someone else's habits improve because of you.",
      "Letting a good pattern go unexamined precisely because it is good."));
  }
  return [...chosen.values()];
}
