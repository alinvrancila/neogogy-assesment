import type { Item, ItemOption, Persona, ConstructId, SecondaryEffect } from "../engine/types";

// ---------------------------------------------------------------------------
// Plain-language context lines
// ---------------------------------------------------------------------------
/**
 * Shown under a question when the wording could reasonably be read more than
 * one way. These clarify what is being asked; they never argue for an answer.
 * Keyed by item id, applied by the factories below.
 */
const PERSONAS_ALL: Persona[] = ["student", "teacher", "parent", "administrator"];

const BY_SUFFIX: Record<string, string> = {
  // scenarios
  transfer_s: "This is about whether the method stayed with you, not whether you remember the exact answer.",
  dependencySafety_s: "Answer for what would realistically happen, not for what you would hope happens.",
  verification_s: "Think about what you would actually do under normal time pressure, not on your best day.",
  responsibleUse_s: "Nothing here is reported to anyone. Answer with what you would really do.",
  adaptability_s: "There is no right answer. Different situations call for different responses.",
  // claims
  fluency_claim: "This is about your practical skill with the tools, not how often you use them.",
  amplification_claim: "This is about whether AI changes how you think, not whether it saves you time.",
  skillGrowth_claim: "This is about your own ability, not your output, your grades, or your results.",
  transfer_claim: "That is, you can do it later without opening an AI tool.",
  dependencySafety_claim: "Think about the quality of the work, not how long it would take.",
};

export const ITEM_CONTEXT: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const p of PERSONAS_ALL) {
    for (const [suffix, text] of Object.entries(BY_SUFFIX)) {
      const parts = suffix.split("_");
      const kind = parts.pop()!;
      const construct = parts.join("_");
      m[`${p}_${construct}_${kind}`] = text;
    }
  }
  return m;
})();

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

export function claim(persona: Persona, construct: ConstructId, prompt: string,
  scale: Item["scale"], opts: Partial<Item> = {}): Item {
  const id = `${persona}_${construct}_claim`;
  return { id, persona, type: "claim", construct, prompt, scale,
    context: ITEM_CONTEXT[id], pairId: `${persona}_${construct}`, version: 2, ...opts };
}

export function reverse(persona: Persona, construct: ConstructId, prompt: string,
  scale: Item["scale"], riskSignal: string, opts: Partial<Item> = {}): Item {
  const id = `${persona}_${construct}_rev`;
  return { id, persona, type: "reverse", construct, prompt, scale, riskSignal,
    context: ITEM_CONTEXT[id], version: 2, ...opts };
}

export function scenario(persona: Persona, construct: ConstructId, prompt: string,
  labels: [string, string, string, string, string], riskSignal: string,
  opts: Partial<Item> & { effects?: Partial<Record<number, Partial<Record<ConstructId, number>>>> } = {}): Item {
  const options: ItemOption[] = labels.map((label, i) => ({
    value: i + 1, label, effects: opts.effects?.[i + 1],
  }));
  const { effects, ...rest } = opts;
  const id = `${persona}_${construct}_s`;
  return { id, persona, type: "scenario", construct, prompt, options, riskSignal,
    context: ITEM_CONTEXT[id], pairId: `${persona}_${construct}`, version: 2, ...rest };
}

// ---------------------------------------------------------------------------
// Shared items
// ---------------------------------------------------------------------------

export const USAGE_ITEM: Item = {
  id: "usage", persona: "shared", type: "branch",
  prompt: "How often do you currently use AI tools yourself, for anything?",
  context: "Any AI tool counts, for work or personal use. This answer is never scored up or down; it only decides which follow-up questions you see.",
  options: [
    { value: 1, label: "Almost never" },
    { value: 2, label: "A few times a month" },
    { value: 3, label: "Weekly" },
    { value: 4, label: "Several times a week" },
    { value: 5, label: "Daily or almost daily" },
  ],
  version: 2,
};

export const BASELINE_ITEMS: Item[] = [
  { id: "b1", persona: "shared", type: "baseline",
    prompt: "Before any questions: how healthy does your current relationship with AI feel to you?",
    scale: "agreement", version: 2 },
  { id: "b2", persona: "shared", type: "baseline",
    prompt: "Prediction: where do you expect your final result to land?",
    scale: "agreement", version: 2 },
];

/** Outcome/change items (§12). value 0 = "not enough experience to judge" (excluded from scoring). */
export const OUTCOME_ITEMS: Item[] = [
  { id: "out_begin", persona: "shared", type: "outcome", construct: "dependencySafety",
    secondary: [{ construct: "agency", weight: 0.4 }],
    prompt: "Since regularly using AI, my ability to begin difficult tasks without assistance has...",
    context: "Compare now against before you used AI regularly. If you have not used it long enough to notice, choose the last option.",
    scale: "outcome", riskSignal: "dependency_starting_tasks", version: 2 },
  { id: "out_explain", persona: "shared", type: "outcome", construct: "transfer",
    secondary: [{ construct: "skillGrowth", weight: 0.5 }],
    prompt: "Since using AI, my ability to explain complicated ideas in my own words has...",
    context: "This is about explaining without notes or a tool in front of you. If you cannot tell yet, choose the last option.",
    scale: "outcome", riskSignal: "transfer_low", version: 2 },
  { id: "out_persist", persona: "shared", type: "outcome", construct: "skillGrowth",
    secondary: [{ construct: "dependencySafety", weight: 0.5 }],
    prompt: "Compared with before I used AI regularly, the time I spend working on a hard problem before I ask for help has...",
    context: "Asking for help includes opening an AI tool. If you cannot tell yet, choose the last option.",
    scale: "outcome", riskSignal: "skill_erosion", version: 2 },
];

/** Adaptive branch: only shown when usage <= 2. Determines WHY use is low (§13, §4). */
export const LOW_USE_REASON: Item = {
  id: "lowuse_reason", persona: "shared", type: "branch",
  adaptiveTrigger: { when: "usageLow" },
  prompt: "Which best describes why your AI use is low?",
  context: "Choose the closest fit. Low use is not treated as a problem here; this only tells us the reason.",
  options: [
    { value: 1, label: "I know these tools reasonably well, and I limit where I use them on purpose." },
    { value: 2, label: "Access, cost, or my institution's rules limit my use." },
    { value: 3, label: "Privacy or trust concerns hold me back." },
    { value: 4, label: "I don't really know how to use them or where they would help me." },
    { value: 5, label: "I tried them and didn't find them useful for my work." },
  ],
  version: 2,
};

/** Adaptive branches: only shown when usage >= 4. Deeper dependency and verification probes. */
export const HIGH_USE_PROBES: Item[] = [
  { id: "highuse_outage", persona: "shared", type: "scenario", construct: "dependencySafety",
    adaptiveTrigger: { when: "usageHigh" }, riskSignal: "independent_capability_low",
    prompt: "Think of the most recent time an AI tool was unavailable for a task you normally do with it. What actually happened?",
    context: "If it has genuinely never been unavailable, answer for what you think would happen.",
    options: [
      { value: 1, label: "I postponed the task until the tool was back." },
      { value: 2, label: "I attempted it but the result was clearly weaker." },
      { value: 3, label: "I finished it more slowly at roughly my usual quality." },
      { value: 4, label: "No real difference; the tool speeds up what I can already do." },
      { value: 5, label: "No difference, because I regularly practise the task without AI, so losing the tool changes little." },
    ], version: 2 },
  { id: "highuse_unchecked", persona: "shared", type: "reverse", construct: "verification",
    adaptiveTrigger: { when: "usageHigh" }, riskSignal: "uncritical_acceptance",
    prompt: "In the past month, I accepted an AI answer for something consequential without any check at all.",
    context: "Consequential means something where being wrong would actually matter.",
    scale: "frequency", version: 2 },
];

export const SCALE_LABELS: Record<string, string[]> = {
  agreement: ["Strongly disagree", "Disagree", "Not sure", "Agree", "Strongly agree"],
  frequency: ["Never", "Rarely", "Sometimes", "Often", "Almost always"],
  confidence: ["Not confident", "Slightly confident", "Moderately confident", "Very confident", "Completely confident"],
  outcome: ["Significantly worse", "Somewhat worse", "Unchanged", "Somewhat better", "Significantly better"],
};
