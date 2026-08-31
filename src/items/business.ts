/**
 * The Business Owner bank: forty items, ten dimensions, four items each.
 *
 * This is the only persona in the instrument that does not assess a person's
 * learning. Every item asks how the way this owner and their team use AI is
 * affecting the business itself: its decisions, its continuity, its customers'
 * trust, its institutional knowledge, its people, its market position, and its
 * legal and financial exposure.
 *
 * Shape per dimension: a claim, a true reverse a healthy owner disagrees with,
 * a scenario with five behaviourally anchored options, and a business impact
 * item carrying a "not enough experience to say" option excluded from scoring.
 * Scenario options are written least to most healthy for scoring; the screen
 * shuffles their display order per respondent.
 */

import type { Item, ItemOption } from "../engine/types";
import { claim, reverse, scenario } from "./shared";

const P = "business" as const;

/** An impact item: four substantive anchors plus an honest way out. */
function impact(
  construct: Item["construct"], prompt: string, anchors: [string, string, string, string],
  opts: Partial<Item> = {}
): Item {
  const options: ItemOption[] = anchors.map((label, i) => ({ value: i + 1, label }));
  options.push({ value: 0, label: "Not enough experience to say" });
  return {
    id: `${P}_${construct}_impact`, persona: P, type: "outcome", construct,
    prompt, options, version: 2,
    context: "Compare the business now against before AI was part of how it runs. If it is too early to tell, say so: that answer is not held against you.",
    ...opts,
  };
}

export const BUSINESS_ITEMS: Item[] = [
  /* ------------------------------------------- 1. Owner Decision Ownership */
  claim(P, "agency",
    "When AI gives me a recommendation on a significant business decision, I can explain in my own words why I accepted or rejected it.",
    "agreement",
    { context: "This is about whether the reasoning is yours, not about how good the recommendation was." }),
  reverse(P, "agency",
    "If an AI tool is confident about a pricing, hiring, or strategy call, I generally go with it. Second-guessing it wastes time.",
    "agreement", "decision_abdication"),
  scenario(P, "agency",
    "An AI tool you trust recommends raising prices 12 percent across your main product line, and the analysis behind it reads well.", [
      "Put the increase in place this week on the strength of the analysis.",
      "Apply it to part of the line and watch what happens, without going through the analysis itself.",
      "Read the analysis, test the two assumptions it rests on against your own numbers, then decide.",
      "Treat it as one input beside your margin data, recent customer conversations, and competitor pricing, and make the call yourself.",
      "Use it as a prompt to model three pricing scenarios on your own numbers, name the downside of each, then decide and write down why.",
    ], "decision_abdication",
    {
      context: "Answer for what you would actually do in a normal week, not on your most careful day.",
      effects: { 1: { verification: -6 } },
      optionSignals: { 1: ["decision_abdication"] },
    }),
  impact("agency",
    "Since AI entered your business, your ability to make and defend major decisions has:", [
      "Become weaker. You lean on the tool.",
      "Stayed about the same.",
      "Become somewhat stronger.",
      "Become noticeably stronger. You decide faster and with better reasons.",
    ], { secondary: [{ construct: "amplification", weight: 0.4 }] }),

  /* --------------------------------------- 2. Verification Before Consequence */
  claim(P, "verification",
    "Anything AI-generated that goes to a customer, into a contract, or onto our books is checked by a competent person before it leaves.",
    "agreement"),
  reverse(P, "verification",
    "Our AI tools are accurate enough that reviewing their output line by line is no longer necessary for routine customer communication.",
    "agreement", "customer_facing_unverified"),
  scenario(P, "verification",
    "An AI assistant drafts a quote for a new client, along with a short paragraph of legal-sounding terms. It looks fine.", [
      "Send it as it is. It has always been fine before.",
      "Skim it for tone and send it.",
      "Check the numbers, and send the terms as drafted.",
      "Check the numbers, and replace the terms paragraph with your own reviewed terms.",
      "Check the numbers, use only reviewed terms, and make it a standing rule that quotes never carry AI-drafted legal language.",
    ], "customer_facing_unverified",
    {
      context: "Think about a busy week, not a quiet one.",
      effects: { 1: { responsibleUse: -6 } },
      optionSignals: { 1: ["customer_facing_unverified", "uncritical_acceptance"] },
    }),
  impact("verification",
    "Since AI entered your business, the rate of errors reaching customers (wrong figures, wrong promises, wrong facts) has:", [
      "Risen.",
      "Stayed about the same.",
      "Fallen somewhat.",
      "Fallen clearly, because checks are built into the workflow.",
    ]),

  /* ------------------------------------------- 3. Operational Continuity */
  claim(P, "dependencySafety",
    "If our main AI tools were unavailable for a week, our core operations would continue with manageable disruption.",
    "confidence",
    { context: "Answer for what would realistically happen, not for what you would hope happens." }),
  reverse(P, "dependencySafety",
    "Several of our important processes now exist only inside AI tools or chat histories. Nobody has written them down anywhere else.",
    "agreement", "single_point_of_failure"),
  scenario(P, "dependencySafety",
    "Your primary AI vendor announces that its price is tripling and its terms are changing, effective in 30 days.", [
      "Pay it. There is no alternative and the workflows could not be rebuilt.",
      "Pay it, and start worrying about what happens next time.",
      "Start looking for a substitute and migrate what you can under time pressure.",
      "Switch to the alternative you had already tested, using the data and prompts you keep exported.",
      "Switch without drama, because every AI-dependent process has a documented manual or alternative path, and tell the team that nothing changes for customers.",
    ], "vendor_lockin",
    { optionSignals: { 1: ["vendor_lockin", "single_point_of_failure"], 2: ["vendor_lockin"] } }),
  impact("dependencySafety",
    "Since AI entered your business, the number of critical processes that depend on a single AI tool, or on a single person who knows how to run it, has:", [
      "Grown a lot.",
      "Grown somewhat.",
      "Stayed the same.",
      "Shrunk, because processes are documented and portable.",
    ], { secondary: [{ construct: "transfer", weight: 0.4 }] }),

  /* --------------------------------------------- 4. Business AI Fluency */
  claim(P, "fluency",
    "Before automating a process with AI, I can name the process, the number I expect to move, and the person who owns the result.",
    "confidence"),
  reverse(P, "fluency",
    "We adopt AI tools when they look promising. Working out exactly where they fit comes later.",
    "agreement", "wrong_process_automation"),
  scenario(P, "fluency",
    "A vendor pitches an AI agent that will handle your customer inbox from end to end.", [
      "Sign up. It sounds like it would save you a hire.",
      "Trial it across the whole inbox and see how it goes.",
      "Trial it on one category of email, with a person reviewing before anything sends.",
      "Ask the vendor what a bad day looks like, model the twelve-month cost, check data export and exit terms, then pilot one bounded workflow with an approval gate and a baseline number.",
      "Conclude that a draft-and-approve workflow gets most of the value at a fraction of the risk, build that first, and revisit full autonomy only with evidence.",
    ], "wrong_process_automation",
    { optionSignals: { 1: ["wrong_process_automation", "pilot_without_metric"] } }),
  impact("fluency",
    "Since AI entered your business, your confidence in choosing the right AI tool for a given process, and in declining the wrong one, has:", [
      "Decreased.",
      "Stayed low.",
      "Grown somewhat.",
      "Grown clearly. You can explain your choices.",
    ]),

  /* -------------------------------------- 5. Institutional Knowledge Capture */
  claim(P, "transfer",
    "What we learn from AI-assisted work gets turned into written procedures, templates, or training that the business owns.",
    "agreement"),
  reverse(P, "transfer",
    "Most of our best AI workflows live in individual staff members' accounts and heads. If they left, we would rebuild from scratch.",
    "agreement", "knowledge_not_captured"),
  scenario(P, "transfer",
    "Your best employee has built an excellent AI-driven process for onboarding new customers, and runs it alone.", [
      "Leave it. It works, and they are not going anywhere.",
      "Ask them to walk you through it once.",
      "Ask them to write it down.",
      "Have them document it as a procedure, train a second person, and store the prompts and configuration in the business's own systems.",
      "Do all of that, review it quarterly, and make process capture a standing expectation for anyone who builds an AI workflow.",
    ], "knowledge_not_captured",
    { optionSignals: { 1: ["knowledge_not_captured", "single_point_of_failure"] } }),
  impact("transfer",
    "Since AI entered your business, the share of your operating knowledge that is documented and usable by someone other than the person who created it has:", [
      "Fallen.",
      "Stayed the same.",
      "Grown somewhat.",
      "Grown clearly.",
    ]),

  /* ------------------------------------------- 6. Strategic Amplification */
  claim(P, "amplification",
    "I use AI to stress-test my plans and surface options I would not have considered, not only to produce work faster.",
    "agreement"),
  reverse(P, "amplification",
    "For me, AI's main value is doing tasks faster. It has not really changed how I think about the business.",
    "agreement", "shallow_use"),
  scenario(P, "amplification",
    "You are deciding whether to open a second location.", [
      "Ask AI whether you should, and take its answer.",
      "Ask AI for a list of pros and cons, and read it.",
      "Ask AI to build the financial model, and go with its projections.",
      "Feed it your real numbers, ask it to argue against the expansion as hard as it can, and check its objections against what you know.",
      "Use it to build three scenarios, identify the assumptions each one rests on, list what evidence would change your mind, then decide with your team.",
    ], "shallow_use",
    { effects: { 1: { agency: -6 } }, optionSignals: { 1: ["decision_abdication"] } }),
  impact("amplification",
    "Since AI entered your business, the quality of your strategic thinking (options considered, risks seen early, assumptions questioned) has:", [
      "Worsened. You think less.",
      "Stayed about the same.",
      "Improved somewhat.",
      "Improved clearly.",
    ]),

  /* --------------------------------------------- 7. Team Capability Growth */
  claim(P, "skillGrowth",
    "My team is more capable with AI than they were before, and they could still do the core work if the tool were gone.",
    "agreement"),
  reverse(P, "skillGrowth",
    "Since AI took over the routine work, some of my staff could no longer do it competently by hand.",
    "agreement", "team_deskilling"),
  scenario(P, "skillGrowth",
    "A junior employee asks whether they still need to learn the underlying skill (bookkeeping, copywriting, estimating) now that AI does it.", [
      "Tell them no, and to focus on prompting instead.",
      "Tell them it is optional.",
      "Tell them yes, but leave them to work out how.",
      "Explain that they have to be able to check what AI produces, and pair them with someone who can teach the craft.",
      "Build a development path where AI use grows as competence grows, with regular unaided checks, and treat that as how the business protects its quality.",
    ], "team_deskilling",
    { optionSignals: { 1: ["team_deskilling"] } }),
  impact("skillGrowth",
    "Since AI entered your business, your team's ability to catch a bad AI output in their own area of work has:", [
      "Weakened.",
      "Stayed the same.",
      "Strengthened somewhat.",
      "Strengthened clearly, through deliberate training.",
    ], { secondary: [{ construct: "verification", weight: 0.4 }] }),

  /* ------------------------------------------------ 8. Business Adaptability */
  claim(P, "adaptability",
    "We review our AI workflows against actual results, and we shut down the ones that are not delivering.",
    "agreement"),
  reverse(P, "adaptability",
    "Once an AI tool is set up, we tend to leave it running. Revisiting it is rarely a priority.",
    "agreement", "pilot_without_metric"),
  scenario(P, "adaptability",
    "Six months ago you rolled out AI across marketing, sales follow-up, and reporting. Things feel busier and faster.", [
      "Keep going. It feels like progress.",
      "Ask the team whether they like it.",
      "Look at a couple of numbers if there is time.",
      "Compare each workflow's metric against its pre-AI baseline, keep the winners, and fix or kill the rest.",
      "Do that on a fixed cadence, publish the results to the team, and check what customers and competitors now expect of you.",
    ], "pilot_without_metric",
    { optionSignals: { 1: ["pilot_without_metric"] } }),
  impact("adaptability",
    "Since AI entered your business, how often do you change or retire an AI workflow because the evidence said so:", [
      "Never.",
      "Rarely.",
      "Occasionally.",
      "Regularly, on a set cadence.",
    ]),

  /* ------------------------------------------ 9. Governance, Data, and Trust */
  claim(P, "responsibleUse",
    "We have a written AI use policy that says what data can and cannot go into which tools, and my staff know it.",
    "agreement"),
  reverse(P, "responsibleUse",
    "I am fairly sure my staff are not putting customer or financial data into personal AI tools, though I have not checked.",
    "agreement", "shadow_ai_blindspot"),
  scenario(P, "responsibleUse",
    "You discover that an employee has been pasting customer records into a free AI tool to speed up follow-ups.", [
      "Let it go. It is efficient and probably harmless.",
      "Tell them to stop, and move on.",
      "Tell them to stop, and remind everyone informally.",
      "Stop it, work out what data left the business and whether anyone has to be told, and put a clear policy and an approved tool in place.",
      "Do all of that, survey the team to surface other unofficial use without blame, and set a recurring check.",
    ], "data_leakage_risk",
    {
      context: "Nothing here is reported to anyone. Answer with what you would really do.",
      optionSignals: { 1: ["data_leakage_risk", "shadow_ai_blindspot"], 2: ["shadow_ai_blindspot"] },
    }),
  impact("responsibleUse",
    "Since AI entered your business, your visibility into which AI tools your staff use, and what data goes into them, has:", [
      "Got worse.",
      "Stayed unclear.",
      "Become somewhat clearer.",
      "Become clear, with a policy and approved tools.",
    ]),

  /* --------------------------------------------- 10. Market Differentiation */
  claim(P, "creativity",
    "AI helps us sound and act more like ourselves, sharpening our voice and our offer rather than flattening them.",
    "agreement"),
  reverse(P, "creativity",
    "Our AI-generated customer content is fine. Customers do not notice or care whether a person wrote it.",
    "agreement", "brand_homogenization"),
  scenario(P, "creativity",
    "A customer replies to one of your marketing emails: \"This sounds like a robot wrote it.\"", [
      "Ignore it. That is one complaint.",
      "Apologise, and change nothing.",
      "Rewrite that one email by hand.",
      "Review your recent customer-facing content, put your own voice and specifics back into it, and decide where disclosure or a human touch matters.",
      "Do that, and set a standard: AI drafts, a person with your voice finishes, and anything a customer would reasonably expect from a human is either human or disclosed.",
    ], "brand_homogenization",
    { optionSignals: { 1: ["brand_homogenization"], 2: ["brand_homogenization", "disclosure_gap"] } }),
  impact("creativity",
    "Since AI entered your business, your customers' sense that they are dealing with a distinct, genuine business has:", [
      "Weakened.",
      "Stayed the same.",
      "Strengthened somewhat.",
      "Strengthened clearly.",
    ], { secondary: [{ construct: "responsibleUse", weight: 0.3 }] }),
];
