/**
 * Recommendation engine (§49, §41): recommendations correspond to detected
 * behaviors (risk signals + bottleneck construct), not to the archetype alone.
 * This fixes v1 §4.6 (four static advice sets for the entire instrument).
 * Each entry follows the §41 roadmap shape: capability / behavior change /
 * practice / evidence of progress / risk to monitor.
 */
import type { Bottleneck, ConstructId, Persona, Recommendation, RiskSignal, UsageProfile } from "./types";

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


/**
 * The Business Owner library.
 *
 * Same five field shape, written for someone who has to schedule the work
 * around trading. Every practice is concrete, has an owner, and is cheap enough
 * for a business without a compliance department.
 */
const BUSINESS_LIBRARY: Record<string, Recommendation> = {
  /* the twelve business signals */
  decision_abdication: R("decision_abdication", "immediate",
    "Owner decision ownership",
    "Keep the significant calls, and make the reasoning explicit.",
    "For the next month, before acting on any AI recommendation that touches price, people, or a customer commitment, write two lines: the judgment this turns on, and why you accepted or rejected the recommendation. Keep them in one file.",
    "You can defend every significant decision of the last month in your own words, without reopening the tool.",
    "Writing the reasoning after the decision, which records a rationalisation rather than a decision."),
  customer_facing_unverified: R("customer_facing_unverified", "immediate",
    "Approval gate before consequence",
    "Nothing AI-generated reaches a customer, a contract, or the books unchecked.",
    "Name one person per channel who approves before send. Put reviewed standard wording in place for quotes and terms so nobody has to accept AI-drafted legal language under time pressure.",
    "Errors reaching customers fall, and the gate is being used rather than bypassed on busy days.",
    "The gate quietly becoming a formality when volume rises."),
  single_point_of_failure: R("single_point_of_failure", "immediate",
    "Operational continuity",
    "Make sure the business can trade without any single tool or person.",
    "List every process that would stop if one tool or one person went away. Take the top three and write a one page manual path for each, then have someone other than the owner run one of them for a day.",
    "Each critical process has a documented alternative that a second person has actually executed.",
    "Documentation that describes the ideal path rather than the one that works under pressure."),
  vendor_lockin: R("vendor_lockin", "important",
    "Vendor exit readiness",
    "Know the cost of leaving every tool before you need to leave it.",
    "Once a quarter, run an exit test: export your data and prompts, check what the export does not contain, and price the alternative. Thirty minutes per vendor is enough.",
    "You can name your exit cost and your named alternative for each critical tool.",
    "Treating the export as the test, when the real question is whether the work continues."),
  shadow_ai_blindspot: R("shadow_ai_blindspot", "immediate",
    "Visibility of actual tool use",
    "Find out what is really being used, without blame.",
    "Run a short anonymous survey asking which AI tools people use and what they paste into them. Publish the results, approve a safe option for the most common real need, and repeat it twice a year.",
    "You can name the tools in use in your business rather than the tools you approved.",
    "Treating the survey as an enforcement exercise, which guarantees the next one is dishonest."),
  data_leakage_risk: R("data_leakage_risk", "immediate",
    "Data boundaries",
    "Decide what may never be pasted into a tool, and say so in writing.",
    "Write a one page AI use policy: approved tools, the data that never leaves the business, and who to ask when it is unclear. Walk the team through it once, in person, and keep it to one page.",
    "Staff can state the rule from memory, and there is an approved tool for the work that drove the workaround.",
    "A policy that exists as a document but not as a habit."),
  disclosure_gap: R("disclosure_gap", "important",
    "Customer disclosure standard",
    "Decide your position on AI in customer-facing work before a customer asks.",
    "Write down where AI may draft, where a person must finish, and what you would say if a customer asked directly. Apply it to your top three customer touchpoints this month.",
    "Anyone in the business can answer the question honestly and consistently.",
    "Deciding case by case, which produces different answers to the same question."),
  pilot_without_metric: R("pilot_without_metric", "important",
    "Measured adoption",
    "No AI workflow runs without a number it is supposed to move.",
    "For each live workflow, write the metric and its pre-AI baseline. Review monthly with the authority to stop. Anything without a baseline gets one this month or gets switched off.",
    "You can say what each workflow moved, and at least one has been stopped on the evidence.",
    "Reviews that always conclude that nothing needs to change."),
  team_deskilling: R("team_deskilling", "important",
    "Team capability protection",
    "Protect the skills your quality depends on.",
    "Name the two skills each role must retain. Put one unaided check per quarter in the calendar, and pair anyone learning a craft with someone who can teach it.",
    "People can still evaluate what the tool produces in their own area, on evidence rather than assumption.",
    "Checking only the people you already trust."),
  brand_homogenization: R("brand_homogenization", "important",
    "Distinct market voice",
    "Make sure what goes out could only have come from you.",
    "Set the standard that AI drafts and a person with your voice finishes. Review a month of customer-facing content and put back the specifics only your business would know.",
    "Customers stop being able to tell the AI-assisted material from the rest, because your voice survives the drafting.",
    "A voice standard that lives with one person and lapses when they are busy."),
  knowledge_not_captured: R("knowledge_not_captured", "important",
    "Institutional knowledge capture",
    "Make the business the owner of what it learns.",
    "Require anyone who builds an AI workflow to leave behind a written procedure, the prompts, and a trained second person. Apply it to your three most valuable workflows first.",
    "A workflow survives the absence of the person who built it, tested by having someone else run it.",
    "Capture that records the tool rather than the judgment behind the process."),
  wrong_process_automation: R("wrong_process_automation", "important",
    "Right process, right tool",
    "Fit the tool to a named process with a number and an owner.",
    "Before the next adoption, write three lines: the process, the number you expect to move, and who owns the result. Model twelve months of cost including the work you will still do by hand. Pilot one bounded workflow with an approval gate.",
    "You can explain why each tool is in the business and which one you declined.",
    "Automating the process that is easiest to automate rather than the one that costs you most."),

  /* the thirteen shared signals, in business terms */
  dependency_starting_tasks: R("dependency_starting_tasks", "important",
    "Independent starting capability",
    "Keep the business able to begin work without a tool in front of it.",
    "For one month, start the significant pieces of work with fifteen minutes unaided: the problem, the approach, the first draft of the numbers. Then bring AI in and compare.",
    "Work starts without the reflex to open a tool, and your unaided starts resemble your assisted ones.",
    "Turning the fifteen minutes into a ritual you wait out rather than work through."),
  independent_capability_low: R("independent_capability_low", "immediate",
    "Unaided operating capability",
    "Practise running the business without the tools, before you have to.",
    "Once a month, run one AI-assisted process entirely by hand and time it honestly. Record what could not be reproduced at all: that list is your real exposure.",
    "The gap between assisted and unaided narrows, and the irreproducible list gets shorter.",
    "Choosing the easy process for the unaided run."),
  verification_low: R("verification_low", "immediate",
    "Verification discipline",
    "Check anything that carries commercial consequence, in proportion to the stakes.",
    "Adopt a two source rule for consequential claims: confirm anything material somewhere the tool did not supply, before it reaches a customer, a contract, or a filing.",
    "You catch at least one wrong or unsupported AI claim a month, because someone is actually looking.",
    "Checking only what already felt doubtful."),
  uncritical_acceptance: R("uncritical_acceptance", "immediate",
    "Calibrated trust",
    "Separate sounds right from is right, as a deliberate step.",
    "For one week, before accepting any substantive AI answer that matters commercially, write one sentence: what would have to be true for this to be wrong. Then check that one thing.",
    "Your acceptance rate falls and your correction rate rises. Confident tone stops working as evidence.",
    "Letting it lapse once outputs feel reliable again."),
  transfer_low: R("transfer_low", "important",
    "Knowledge that outlives the session",
    "Close every significant AI-assisted piece of work with a written procedure.",
    "When AI helps you build something the business will do again, write the steps down while it is fresh, store them in the business's systems, and have someone else follow them once.",
    "The next occurrence does not start from zero or from one person's memory.",
    "Documenting the output instead of the method."),
  skill_erosion: R("skill_erosion", "important",
    "Skill preservation",
    "Decide which capabilities the business intends to keep.",
    "List three capabilities AI now performs that you refuse to lose. For each, keep one regular repetition performed fully in-house, with AI allowed only as a reviewer afterwards.",
    "The kept capabilities hold on unaided checks, and nothing on the list quietly migrates to a vendor.",
    "Letting the list go stale as use expands into new areas."),
  underexposure_fluency: R("underexposure_fluency", "important",
    "Bounded, real experiments",
    "Replace opinion about AI with evidence from your own business.",
    "Pick three recurring tasks from your actual week and run each through a current tool properly: real context, iteration, and a judgment at the end about whether it earned a place.",
    "You can name, from experience rather than reputation, two tasks where AI pays and one where it does not.",
    "Trialling on toy examples that never touch real work."),
  authority_transfer: R("authority_transfer", "immediate",
    "Decision authority",
    "Keep authority where accountability sits.",
    "Write down which decisions AI may inform and which it may never make. Share it with anyone who acts on AI output in your name.",
    "Everyone can say which calls are theirs, and the boundary holds under time pressure.",
    "A boundary that exists in your head rather than on the page."),
  shallow_use: R("shallow_use", "developmental",
    "Strategic amplification",
    "Move AI from producing work to improving decisions.",
    "Three prompts to keep: argue against this plan, list what this draft fails to consider, and question me until my reasoning breaks. Use one per significant decision for a month.",
    "Sessions change or sharpen your position rather than only finishing your task.",
    "Reserving these for low-stakes work."),
  ai_native_gap: R("ai_native_gap", "developmental",
    "Adaptive practice",
    "Put your AI practice on a review cycle.",
    "Once a month, audit your main workflow: is it still producing, has the tool changed, is there a better pattern. Change one thing deliberately and evaluate it.",
    "Your workflows this quarter differ from last quarter for reasons you can state.",
    "Reviews that never change anything."),
  privacy_boundary: R("privacy_boundary", "immediate",
    "Data boundaries",
    "Decide what never enters a tool, and hold the line.",
    "Draft the never-paste list (customer records, staff records, financials, anything under contract) and the anonymisation step for when the underlying question still needs asking.",
    "A spot check of recent AI use finds no identifying or confidential material.",
    "Exceptions creeping in when the tool is convenient and the stakes feel low."),
  disclosure_avoidance: R("disclosure_avoidance", "important",
    "Honest disclosure",
    "Be able to say plainly where AI was involved.",
    "Agree the standard for your business, write it in one paragraph, and make it the answer anyone gives when a customer asks.",
    "The question can be answered the same way by anyone in the business.",
    "A standard nobody has read since it was written."),
  overtrust_pattern: R("overtrust_pattern", "immediate",
    "Proportionate trust",
    "Match the level of checking to the size of the consequence.",
    "Sort your AI-touched work into three bands by what it would cost to be wrong, and set the check each band requires. Put the highest band behind a named approver.",
    "The most consequential work is the most checked, which is not usually the starting position.",
    "Banding by volume rather than by consequence."),
};

const BUSINESS_MAINTAIN = R("maintain", "advanced",
  "Keep the pattern under examination",
  "Your exposure is complacency rather than collapse. Keep the arrangement examined as tools and expectations move.",
  "Put a quarterly review of your AI practice in the calendar: the policy, the exit tests, the workflow metrics, and what customers now expect. Teach one of your standing practices to a second person so it does not depend on you.",
  "The arrangement survives a vendor change and a busy quarter, and someone else can run the review.",
  "Letting a good pattern go unexamined precisely because it is good.");

export function buildRecommendations(
  signals: RiskSignal[], bottleneck: Bottleneck, up: UsageProfile, persona?: Persona
): Recommendation[] {
  const LIB = persona === "business" ? BUSINESS_LIBRARY : LIBRARY;
  const chosen = new Map<string, Recommendation>();
  // 1. The bottleneck's recommendation leads, unless the profile is saturated.
  if (!bottleneck.saturated) {
    const btag = BOTTLENECK_TAG[bottleneck.construct];
    if (LIB[btag]) chosen.set(btag, { ...LIB[btag], priority: "immediate" });
  }
  // 2. High/elevated risk signals, in severity order.
  const order = { high: 0, elevated: 1, watch: 2 } as const;
  // Part B8 caps the roadmap at 5 AND guarantees the exposure entry to
  // underexposed respondents. Reserve its slot here rather than appending it
  // past the cap, which previously produced 6 cards.
  const signalCap = up.underexposed ? 4 : 5;
  for (const s of [...signals].sort((a, b) => order[a.severity] - order[b.severity])) {
    if (chosen.size >= signalCap) break;
    if (LIB[s.tag] && !chosen.has(s.tag)) chosen.set(s.tag, LIB[s.tag]);
  }
  // 3. Underexposed low-users always get the fluency entry (§50), framed as exposure not volume.
  if (up.underexposed && !chosen.has("underexposure_fluency")) {
    chosen.set("underexposure_fluency", { ...LIB.underexposure_fluency, priority: "immediate" });
  }
  // 4. If nothing fired, the profile is genuinely healthy: give maintenance work, not manufactured alarm.
  if (chosen.size === 0 && persona === "business") {
    chosen.set("maintain", BUSINESS_MAINTAIN);
  }
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
