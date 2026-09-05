/**
 * Per-persona display.
 *
 * The engine measures the same ten constructs for everyone, with the same
 * weights, gates and index. Only the words change. Everything a respondent can
 * read comes through this map, so a persona can speak its own language without
 * a second scoring path existing anywhere.
 *
 * Personas with no entry here fall back to the shared strings, which is why the
 * four original personas are byte-identical after this was introduced.
 */

import type { ConstructId, Persona, CompassResult } from "./types";
import { CONSTRUCTS, STAGES } from "./config";
import {
  CONSTRUCT_CONTENT, STAGE_DETAIL, STAGE_DETAIL_DEPENDENCE, STAGE_DETAIL_DISCONNECTION,
  type ConstructContent,
} from "./content";

export interface PersonaDisplay {
  /** What the whole thing is called on screen and in the file. */
  reportTitle: string;
  /** What the developmental index is called for this persona. */
  indexName: string;
  /** The subject of the assessment, for headings and the admin. */
  subject: "person" | "business";
  constructNames?: Partial<Record<ConstructId, string>>;
  constructPrinciples: Partial<Record<ConstructId, string>>;
  /** How the inverted dimension is reported. */
  riskName?: string;
  composites: Partial<Record<
    "futureReadiness" | "augmentation" | "judgment" | "capabilityTransfer" | "dependencyIndex" | "underexposure",
    string>>;
  stageNames?: Record<number, string>;
  stageDetail?: Record<number, { looksLike: string; trap: string }>;
  archetypes?: Record<string, { name: string; tagline?: string; narrative?: string }>;
  content?: Partial<Record<ConstructId, Partial<ConstructContent>>>;
  fingerprintLabels?: string[];
  disclaimerExtra?: string;
}


/* ----------------------------------------------------------- professional */

/**
 * The catch-all set reads on the shared dimensions, but the words around them
 * were written for a classroom or a boardroom. These name the same constructs
 * in the language of ordinary work: what you send, what you decide, what you
 * could still do on a bad week.
 */
const PROFESSIONAL_CONSTRUCT_NAMES: Partial<Record<ConstructId, string>> = {
  agency: "Decision Ownership",
  verification: "Checking Before You Act",
  dependencySafety: "Unaided Capability",
  fluency: "Practical AI Fluency",
  transfer: "What You Keep",
  amplification: "Better Thinking, Not Only Faster",
  skillGrowth: "Craft That Still Grows",
  adaptability: "Deliberate Practice",
  responsibleUse: "The Line You Hold",
  creativity: "Your Own Voice",
};

const PROFESSIONAL_PRINCIPLES: Partial<Record<ConstructId, string>> = {
  agency: "The decision, and the answer for it afterwards, stay with the person who made it.",
  verification: "A claim is checked somewhere the tool did not supply, in proportion to what it would cost to be wrong.",
  dependencySafety: "The work still exists on the week the tool does not.",
  fluency: "Knowing from use where a tool is reliable, and where it is confidently wrong.",
  transfer: "What was solved with help can be done again without it.",
  amplification: "The tool widens the thinking, not only the output.",
  skillGrowth: "Capability that would show with no AI in the room.",
  adaptability: "Habits are reviewed on purpose rather than left to drift with the tools.",
  responsibleUse: "The line about other people's information holds when it is inconvenient.",
  creativity: "What you make still sounds like you.",
};

/* --------------------------------------------------------------- business */

const BUSINESS_CONSTRUCT_NAMES: Record<ConstructId, string> = {
  agency: "Owner Decision Ownership",
  verification: "Verification Before Consequence",
  dependencySafety: "Operational Continuity",
  fluency: "Business AI Fluency",
  transfer: "Institutional Knowledge Capture",
  amplification: "Strategic Amplification",
  skillGrowth: "Team Capability Growth",
  adaptability: "Business Adaptability",
  responsibleUse: "Governance, Data, and Trust",
  creativity: "Market Differentiation",
};

const BUSINESS_PRINCIPLES: Record<ConstructId, string> = {
  agency: "AI advises. The owner and the team decide, and can explain the decision.",
  verification: "Nothing AI-generated reaches a customer, a contract, or the books without a check proportional to the stakes.",
  dependencySafety: "The business keeps running when a tool fails, changes price, or disappears.",
  fluency: "The right tool on the right process, with a number to move and a person who owns the result.",
  transfer: "AI-assisted work becomes documented process the business owns, not one person's prompts.",
  amplification: "AI improves the quality of decisions, not only the speed of output.",
  skillGrowth: "The team grows more capable alongside AI, and can still check what it ships.",
  adaptability: "Workflows are reviewed against measured outcomes, and the ones that fail are stopped.",
  responsibleUse: "A written policy that staff follow, data that stays where it should, and honest dealing with customers.",
  creativity: "AI sharpens a distinct voice and offer rather than producing what every competitor's AI produces.",
};

const BUSINESS_STAGE_NAMES: Record<number, string> = {
  1: "AI Absent", 2: "AI Aware", 3: "AI Trialling", 4: "AI Adopting", 5: "AI Operational",
  6: "AI Integrated", 7: "AI Deliberate", 8: "AI Advantaged", 9: "AI Adaptive", 10: "AI Compounding",
};

const BUSINESS_STAGE_DETAIL: Record<number, { looksLike: string; trap: string }> = {
  1: { looksLike: "AI plays no part in how the business runs. Views about it are not yet grounded in your own trading experience.",
       trap: "Deciding about AI from a distance while competitors learn where it pays." },
  2: { looksLike: "You follow the subject and have opinions, but almost nothing in the business has been tried with it.",
       trap: "Mistaking familiarity with the discussion for knowing where it fits your operation." },
  3: { looksLike: "Occasional trials, no settled habits. Results vary and you cannot yet predict which attempts will earn their place.",
       trap: "Concluding it does not work from a handful of unstructured attempts." },
  4: { looksLike: "Regular use across several functions, with boundaries and measurement still thin. Breadth is ahead of discipline.",
       trap: "Volume growing faster than governance, which is where exposure usually begins quietly." },
  5: { looksLike: "AI reliably completes real work in the business. Continuity, verification, and knowledge capture are developing.",
       trap: "Reading tool competence as business capability, when the process now lives in the tool." },
  6: { looksLike: "AI is built into workflows with checks in place and authorship retained. The pattern is deliberate rather than habitual.",
       trap: "Integration becoming automatic, so verification loosens as trust builds." },
  7: { looksLike: "You choose where AI belongs and where it does not, and you can explain the reasoning for both.",
       trap: "Optimising the work you already do, rather than reconsidering which work is worth doing." },
  8: { looksLike: "AI is improving decision quality, not only throughput, on a base that would survive losing a vendor.",
       trap: "Assuming your competitors run the same discipline, when this pattern is uncommon." },
  9: { looksLike: "The business reviews its own AI practice as the market and the tools move, and changes it on evidence.",
       trap: "Reviewing the workflows while leaving the governance and the exit paths where they were." },
  10: { looksLike: "A mature operating relationship with AI that also builds capability in the team, and holds under change.",
        trap: "Complacency. At this point the risk is not collapse, it is a good pattern going unexamined." },
};

const BUSINESS_ARCHETYPES: Record<string, { name: string; tagline?: string; narrative?: string }> = {
  strategic_integrator: {
    name: "The AI-Advantaged Operator",
    tagline: "Deliberate, governed use that is compounding into an advantage.",
    narrative: "You choose where AI belongs and where it does not, you check what it produces before it carries commercial consequence, and the business would still trade if the tools were switched off. Your remaining work is structural: making this the standard rather than your personal habit.",
  },
  grounded_selectivist: {
    name: "The Deliberate Adopter",
    tagline: "Low use by choice, backed by real judgment about where it pays.",
    narrative: "You have limited AI on purpose and your answers back that up: this is selectivity, not avoidance. The exposure runs the other way. Working out where these tools fit is becoming a competence in itself, and bounded experiments would keep your selectivity current rather than dated.",
  },
  augmented_thinker: {
    name: "The Amplified Decision-Maker",
    tagline: "AI is measurably improving the decisions, not just the output.",
    narrative: "Your responses show AI functioning as a thinking partner in the business: it widens the options you consider and challenges assumptions before they cost you. Protect this by keeping verification and knowledge capture in the loop as your volume of use grows.",
  },
  capable_but_unexposed: {
    name: "Solid but Unexposed",
    tagline: "A well-run business that has not yet built the AI-shaped competencies.",
    narrative: "Nothing suggests AI is harming this business. The risk runs the other way. Choosing the right tool for a process, governing its use, and integrating it into real workflows are becoming distinct commercial competencies, and your answers show limited practice in them. Your priority is bounded exposure, not restraint.",
  },
  dependent_operator: {
    name: "The Fragile Automator",
    tagline: "Fast and productive, on a base that would not survive a vendor change.",
    narrative: "The business moves quickly with AI and the output is probably good. Your responses raise one commercial question: what happens if the tool changes price, changes terms, or goes away. This is the pattern this assessment exists to catch, because it looks like efficiency the whole time it is developing.",
  },
  uncritical_consumer: {
    name: "The Exposed Adopter",
    tagline: "Regular use with the checking switched off.",
    narrative: "AI is in the routine of the business, and your responses show confident output being accepted largely as it arrives. Unverified output carries commercial, legal, and reputational cost the first time it is wrong in front of a customer or a regulator, and the errors that reach that far are usually the plausible ones.",
  },
  curious_explorer: {
    name: "The Experimenting Owner",
    tagline: "Real trials under way, with the frame around them still forming.",
    narrative: "The business is genuinely in motion: trying tools, finding uses, building skill. What is not yet formed is the frame: where AI is allowed, what always gets checked, and how a working experiment becomes a documented process the business owns. Adding that frame turns experimentation into return.",
  },
  hesitant_starter: {
    name: "The Waiting Owner",
    tagline: "Watching from the edge, with the first bounded trial still ahead.",
    narrative: "Your answers describe a business that has kept its distance so far. That is a defensible position and it is not costing you anything visible today. What it does cost is time to learn: the businesses that get value from these tools are mostly the ones that started small, measured, and kept what worked.",
  },
  forming_practitioner: {
    name: "The Forming Operator",
    tagline: "Moderate, broadly balanced use with the pattern still taking shape.",
    narrative: "Your profile is genuinely mixed: nothing is collapsing and nothing is yet a signature strength. That is a real position rather than a failure. The dimension readings below matter more for you than any label, because your next move is specific to your weakest link.",
  },
};

const BUSINESS_CONTENT: Partial<Record<ConstructId, Partial<ConstructContent>>> = {
  agency: {
    whatItMeasures: "Whether the significant calls stay with you and your team: pricing, hiring, customer commitments, strategy, and risk. AI can advise on all of them. The question is who decides, and whether the reasoning can be explained afterwards.",
    whyItMatters: "A decision you cannot explain is a decision you cannot defend, to a customer, a lender, an insurer, or a court. It is also a decision you cannot learn from, because the reasoning was never yours to examine.",
    atStrong: "Your responses are consistent with AI advising while you decide. Recommendations are treated as input rather than instruction, and you can say why you took or left them.",
    atDeveloping: "Your responses suggest you usually make the call, with moments under time pressure where a confident recommendation is accepted more or less as it arrives.",
    atWatch: "Your answers suggest your business is exposed to decision abdication: significant calls being made by the tool in practice, whatever the intention. This is the quietest of the exposures because the output usually looks fine.",
    research: { claim: "Practitioner guidance for owner-led businesses converges on the same condition: a named human owner with authority to review, for every process AI touches.", source: "Owner-led AI practice guidance" },
    practices: [
      "Before any significant AI-assisted decision, write the two or three judgments the decision actually turns on, and make those yourself.",
      "When you accept a recommendation, record one line on why it beat the alternative. If you cannot write the line, the decision is not yours yet.",
      "Keep a visible boundary in your own documents between what the tool proposed and what you decided.",
    ],
  },
  verification: {
    whatItMeasures: "Whether anything AI-generated is checked by a competent person before it carries consequence: quotes, invoices, contracts, filings, customer replies, and anything published in your name.",
    whyItMatters: "A small business has no legal department to absorb an AI mistake. The cost of a confident error lands on the owner, and it lands in front of the customer or the regulator rather than in a review meeting.",
    atStrong: "Your responses describe checking as a built-in step rather than a reaction to suspicion, which is the form that actually protects a business.",
    atDeveloping: "Your responses suggest checking happens when something feels off. That catches the obvious errors and misses the plausible ones, which are the expensive kind.",
    atWatch: "Your answers are consistent with AI output reaching customers, contracts, or your books without a proportionate check. Every unchecked output that happens to be right trains the habit that will eventually pass along one that is not.",
    research: { claim: "Owners in a 2026 survey of more than a thousand US small businesses named accuracy and data security as their leading barriers, ahead of cost.", source: "Simply Business, 2026" },
    practices: [
      "Put one approval gate in front of anything AI-generated that reaches a customer, a contract, or the books.",
      "Ban AI-drafted legal or financial language outright, and keep reviewed standard wording that people can reach for instead.",
      "Check one output a week that you expect to be correct. Checking only your doubts trains the wrong reflex.",
    ],
  },
  dependencySafety: {
    whatItMeasures: "What happens to trading if the tools stop: whether core processes are documented outside a chat history, whether data and configurations are exportable, and whether anyone besides one person can run them.",
    whyItMatters: "Vendors change price, change terms, and disappear. A process that exists only inside a subscription is a liability that does not appear on any balance sheet until the month it is called in.",
    atStrong: "Your responses are consistent with retained operational independence. AI is accelerating work the business could still perform, which is the healthy arrangement.",
    atDeveloping: "Your responses suggest the business would keep trading through an outage, more slowly and with visible strain in places.",
    atWatch: "Your answers suggest your business is exposed to a single point of failure: processes that exist mainly inside a tool, or inside one person's account.",
    research: { claim: "Nearly half of AI users in a 2026 survey said at least one key business function would malfunction if their primary AI vendor went offline. BCG names the deeper version of this cognitive lock-in, where an external model becomes part of how the organisation thinks.", source: "Zapier, 2026; BCG, 2026" },
    practices: [
      "Run a vendor exit test once a quarter: export your data and prompts, and run one dependent process the manual way for a day.",
      "Document every AI-dependent process to the point where a competent temp could run it from the page.",
      "Name a tested alternative for each critical tool before you need one.",
    ],
  },
  fluency: {
    whatItMeasures: "Whether the right tool meets the right process: naming the process, the number you expect to move, and the person who owns the result, then designing the workflow with an approval gate and a known twelve-month cost.",
    whyItMatters: "Most of the money lost on AI is not lost to bad models. It is lost to the wrong process automated well, to shelfware nobody adopted, and to costs that were never modelled past the trial.",
    atStrong: "Your responses describe deliberate fit: you can say what a tool is for, what it should move, and when you would decline it.",
    atDeveloping: "Your responses suggest real working skill with room to grow, most often in matching the tool to a bounded process rather than to a whole function.",
    atWatch: "Your answers are consistent with tools being adopted on promise rather than fit. That is a spending and attention problem before it is a technology problem.",
    research: { claim: "MIT's Project NANDA report found that about 95 percent of enterprise generative AI pilots produced no measurable profit and loss impact, attributing it to how tools and organisations integrate rather than to model quality, and noting that budgets concentrate in sales and marketing while back-office automation returns more.", source: "MIT Project NANDA, The GenAI Divide, 2025" },
    practices: [
      "Adopt a rule: no automation without a named process, a baseline number, and a person who owns the result.",
      "Ask any vendor what a bad day looks like, then model twelve months of cost including the work you will still do by hand.",
      "Start with draft-and-approve rather than full autonomy. It captures most of the value at a fraction of the exposure.",
    ],
  },
  transfer: {
    whatItMeasures: "Whether AI-assisted work turns into documented process, templates, and team capability the business owns, rather than staying in individual accounts and heads.",
    whyItMatters: "Knowledge that lives in one person's prompts leaves with that person, or with the subscription. Captured knowledge is the part of AI work that survives staff turnover and vendor change, and it is the part that shows up in a valuation.",
    atStrong: "Your responses describe capture as routine: what works gets written down, stored in the business's own systems, and taught to a second person.",
    atDeveloping: "Your responses suggest partial capture. The shape of the method is known, and reproducing it still depends on the person who built it.",
    atWatch: "Your answers are consistent with operating knowledge that the business does not actually hold. It works until the person or the subscription goes.",
    research: { claim: "Practitioner guidance converges on process capture as the condition that separates AI spending from AI capability in owner-led firms.", source: "Owner-led AI practice guidance" },
    practices: [
      "Make process capture a standing condition for anyone who builds an AI workflow: a written procedure, stored prompts, and a trained second person.",
      "Keep prompts and configurations in the business's own systems rather than in personal accounts.",
      "Review captured procedures quarterly, and retire the ones that no longer match how the work runs.",
    ],
  },
  amplification: {
    whatItMeasures: "Whether AI improves the quality of thinking in the business (scenarios, stress tests, options, customer and market insight) or only the speed at which the same thinking is produced.",
    whyItMatters: "Faster production of an unexamined plan is not an advantage. The durable gain from these tools is better questions and earlier sight of risk, which is available to any owner willing to be argued with.",
    atStrong: "Your responses describe AI used to stress-test and widen: it argues against you, surfaces what you missed, and changes decisions rather than merely dressing them.",
    atDeveloping: "Your responses suggest genuine amplification in places, usually when you deliberately ask for challenge rather than assistance.",
    atWatch: "Your answers are consistent with production rather than amplification. The work arrives sooner and the thinking behind it is largely unchanged.",
    research: { claim: "The same technology, designed deliberately, produced roughly double the learning gains of established practice. How a tool is used carries more of the effect than whether it is used.", source: "Kestin et al., Scientific Reports, 2025" },
    practices: [
      "Ask for the strongest case against your current plan before you ask for help making it.",
      "On any significant decision, have AI build three scenarios and name the assumption each one rests on.",
      "State your own position first, so the tool has something to push against rather than a blank to fill.",
    ],
  },
  skillGrowth: {
    whatItMeasures: "Whether your people are growing more capable alongside AI: juniors still learning the craft, seniors mentoring, roles redesigned rather than hollowed out.",
    whyItMatters: "A team that cannot check what it ships is a quality problem waiting for a busy week. Deskilling is slow, invisible in the output, and expensive to reverse once the people who knew the craft have moved on.",
    atStrong: "Your responses are consistent with capability that keeps growing. Time the tools save is going somewhere that develops the team.",
    atDeveloping: "Your responses suggest the team is holding its ground, with the development of the underlying craft left largely to chance.",
    atWatch: "Your answers suggest your business is exposed to deskilling: work being produced that the people responsible for it could not evaluate or reproduce.",
    research: { claim: "Practice with an unrestricted assistant left learners around 17 percent worse on a later unaided exam than practising without it. Assistance raised output while lowering what was retained.", source: "Bastani et al., PNAS, 2025" },
    practices: [
      "Name the skills each role must keep, and check them unaided on a regular cycle.",
      "Pair anyone learning a craft with someone who can teach it, and let AI use grow as competence grows.",
      "Where a tool saves time on a task, spend some of it on the harder version of the same work.",
    ],
  },
  adaptability: {
    whatItMeasures: "Whether AI workflows are reviewed against measured outcomes, failing pilots are stopped, and the tools are re-evaluated as the market and customer expectations move.",
    whyItMatters: "Activity is easy to mistake for progress. Without a baseline number and a review date, a workflow that stopped paying can run for a year while everyone reports that things feel faster.",
    atStrong: "Your responses describe review on a cadence, with the authority to stop something that is not delivering.",
    atDeveloping: "Your responses suggest you adapt once a problem becomes obvious, which works but runs a step behind.",
    atWatch: "Your answers are consistent with pilot theatre: workflows running without a measured result, and no established point at which they are stopped.",
    research: { claim: "MIT's Project NANDA attributes the failure of most enterprise pilots to organisational learning rather than model quality: the tools were adopted, the workflow around them was not revised.", source: "MIT Project NANDA, The GenAI Divide, 2025" },
    practices: [
      "Give every AI workflow a baseline number before it starts, and a monthly review with the authority to kill it.",
      "Publish the review result to the team, so keeping and stopping are both normal outcomes.",
      "Once a quarter, check what your customers and competitors now expect of you, not only what your tools now do.",
    ],
  },
  responsibleUse: {
    whatItMeasures: "Whether there is a written AI use policy that staff actually follow, whether customer and employee data is protected, whether unofficial tool use has been surfaced rather than assumed absent, and whether customers are dealt with honestly.",
    whyItMatters: "This is where the legal and reputational exposure sits. Data pasted into a personal tool has left the business, and it does not come back because a policy was written afterwards.",
    atStrong: "Your responses describe governance you could show someone: a policy people know, approved tools, and a real view of what is being used.",
    atDeveloping: "Your responses suggest boundaries that exist mostly as understanding rather than as a written and known standard.",
    atWatch: "Your answers suggest your business is exposed on data and governance. This reading should be treated as a lower bound, because owners consistently overestimate their visibility into staff tool use.",
    research: { claim: "Shadow AI research through 2026 consistently reports that most organisations have employees using unsanctioned AI tools, that a meaningful share of pasted content is sensitive, that roughly four in ten companies have no AI use policy, and that executives overestimate their visibility into staff use by a wide margin.", source: "IBM, Gartner, Cyberhaven and Verizon DBIR, as compiled by industry trackers, 2026" },
    practices: [
      "Write a one-page AI use policy naming approved tools and the data that must never be pasted anywhere.",
      "Survey the team without blame to find out what is actually being used, then approve a safe option for the real need.",
      "Decide your disclosure position for customer-facing AI before a customer asks, rather than after.",
    ],
  },
  creativity: {
    whatItMeasures: "Whether AI sharpens a distinct voice, offer, and customer experience, or produces what every competitor's AI produces.",
    whyItMatters: "Generic content is discounted by the people you most want to reach, and it is now recognised quickly. A distinctive voice is one of the few advantages a smaller business holds over a larger one.",
    atStrong: "Your responses describe your own ideas leading, with AI used to stretch and pressure-test them rather than to supply them.",
    atDeveloping: "Your responses suggest genuine distinctiveness that sometimes gets anchored by whatever the tool offers first.",
    atWatch: "Your answers are consistent with brand homogenisation: customer-facing material that could belong to any business in your category.",
    research: { claim: "Consumer research in 2026 reports that a substantial share of people prefer brands that do not use generative AI in customer-facing content, that the share who would trust a favourite brand less for heavy AI use roughly doubled year over year, and that customers detect AI by replies that arrive too fast or read too formulaically.", source: "Gartner, Fractl and Klaviyo, 2026" },
    practices: [
      "Set a voice standard: AI drafts, a person with your voice finishes, and nothing goes out that could be any competitor's.",
      "Put specifics back in. Names, numbers, and things only your business would know are what generic content cannot fake.",
      "Decide where a customer would reasonably expect a human, and either give them one or say plainly that you did not.",
    ],
  },
};

/**
 * Two levels of subject inside one assessment.
 *
 * Three dimensions ask about the owner: the calls they make, how they think,
 * and how well they fit tools to work. Seven ask about the business: how it
 * runs, what it keeps, and what it exposes. Saying which is which is the
 * difference between a report an owner can act on and one they read as a
 * personal verdict.
 */
export type Scope = "owner" | "business";

const BUSINESS_SCOPE: Record<ConstructId, Scope> = {
  agency: "owner",
  amplification: "owner",
  fluency: "owner",
  verification: "business",
  dependencySafety: "business",
  transfer: "business",
  skillGrowth: "business",
  adaptability: "business",
  responsibleUse: "business",
  creativity: "business",
};

/** Which level a dimension belongs to, or undefined where the split does not apply. */
export function dimensionScope(persona: Persona | undefined, id: ConstructId): Scope | undefined {
  return persona === "business" ? BUSINESS_SCOPE[id] : undefined;
}

export const SCOPE_LABEL: Record<Scope, string> = {
  owner: "About you as the owner",
  business: "About the business",
};

export const SCOPE_SHORT: Record<Scope, string> = {
  owner: "Owner",
  business: "Business",
};

export const SCOPE_BLURB: Record<Scope, string> = {
  owner: "These three read how you decide, how you think, and how well you fit tools to work. They are about you, because a business inherits its owner's judgment.",
  business: "These seven read how the business runs without you in the room: what it checks, what it keeps, what it would survive, and what it exposes.",
};


/* ----------------------------------------------------------------- pastor */

/**
 * What each dimension means in this vocation. The ten dimensions themselves are
 * the same ones every other assessment uses, and they keep their own names: a
 * minister who compares notes with a teacher or an owner is looking at the same
 * instrument. Only the reading is ministerial.
 */
export const PASTOR_LENS: Record<ConstructId, string> = {
  agency: "Authorship before God: the message received through prayer and study, and owned by you",
  verification: "Faithfulness to the text: nothing preached that has not been checked",
  dependencySafety: "Unaided preaching capacity: what remains if every tool is gone",
  fluency: "Ministry fluency: knowing what the tool is for, and what it is not for",
  transfer: "Formation of the preacher: whether the study stays in you",
  amplification: "Deeper study: whether the tool takes you further into the text",
  skillGrowth: "Craft of preaching: exegesis, structure, illustration, delivery",
  adaptability: "Discerning practice: examined, adjusted, and rested from",
  responsibleUse: "Integrity and care: honesty, confidences, and presence",
  creativity: "Voice and witness: your people, your city, your own story",
};

/** The goal each dimension points toward, stated plainly. */
export const PASTOR_MARKERS: Record<ConstructId, string> = {
  agency: "You can stand behind every claim in your own words, and prayer and the text shaped the message before any tool did.",
  verification: "Nothing is preached that you have not confirmed to be true and faithful to the text.",
  dependencySafety: "If every tool vanished this week, you would still have a word from the Lord for Sunday.",
  fluency: "The tool sits in its right place, doing the work you have assigned it and no more.",
  transfer: "What you learned in preparation is still in you weeks later, and shapes how you live.",
  amplification: "Your study goes further with the tool than it could have without it, and you can say how.",
  skillGrowth: "You are a better preacher than a year ago, and not only a faster one.",
  adaptability: "Your practice is reviewed, not merely repeated.",
  responsibleUse: "Your people could learn exactly how you use AI and trust you more, not less.",
  creativity: "Your congregation could recognize your sermon with your name removed.",
};

const PASTOR_PRINCIPLES: Record<ConstructId, string> = {
  agency: "The message is received from God through prayer and study, and owned by the preacher.",
  verification: "What reaches the pulpit has been checked against Scripture and real sources.",
  dependencySafety: "The muscles of study, meditation, prayer, and craft stay strong enough to preach without any tool.",
  fluency: "The tool is used skillfully inside limits you have set on purpose.",
  transfer: "Study forms the preacher first, and stays.",
  amplification: "The tool deepens the exegesis rather than merely speeding the output.",
  skillGrowth: "Craft keeps growing, in you and in those you train.",
  adaptability: "The practice is examined, adjusted, and rested from.",
  responsibleUse: "Honesty about the tool, care never outsourced, confidences never pasted in.",
  creativity: "The sermon carries your voice, your people, and your own testimony.",
};

const PASTOR_STAGE_NAMES: Record<number, string> = {
  1: "Set Apart", 2: "Watching", 3: "Trying", 4: "Practising", 5: "Working",
  6: "Integrated", 7: "Discerning", 8: "Anchored", 9: "Renewing", 10: "Rooted and Fruitful",
};

const PASTOR_STAGE_DETAIL: Record<number, { looksLike: string; trap: string }> = {
  1: { looksLike: "AI plays no part in your preparation, and your views about it are not yet formed by your own use.",
       trap: "Deciding about a tool from a distance, when a considered position is worth more than a default one." },
  2: { looksLike: "You follow the conversation and have views, with little of your own experience underneath them.",
       trap: "Mistaking familiarity with the discussion for a settled position." },
  3: { looksLike: "Occasional trials, with no settled habit. The results vary and you cannot yet predict what will help.",
       trap: "Drawing a firm conclusion from a handful of unstructured attempts." },
  4: { looksLike: "Regular use in several parts of the work, with the line around it still forming.",
       trap: "Use growing faster than the discernment around it." },
  5: { looksLike: "The tool does real work in your week. Study, prayer, and voice are holding, and they need watching.",
       trap: "Reading a smoother sermon as a deeper one." },
  6: { looksLike: "AI is part of your preparation with your own study first and your checking intact.",
       trap: "Integration becoming automatic, so the checking quietly loosens as trust builds." },
  7: { looksLike: "You know where the tool belongs and where it does not, and you could explain both to your elders.",
       trap: "Refining the work you already do, rather than asking what the work is for." },
  8: { looksLike: "The tool deepens your study while prayer, memory, and presence stay strong.",
       trap: "Assuming the preachers around you have the same practice, when this one is uncommon." },
  9: { looksLike: "Your practice is reviewed with others, rested from on purpose, and adjusted from what you find.",
       trap: "Reviewing the workflow while leaving the deeper rhythms unexamined." },
  10: { looksLike: "A settled practice that feeds the preacher, protects the people, and keeps the pulpit truthful.",
        trap: "Complacency. The risk here is not collapse, it is a good practice going unexamined." },
};

const PASTOR_ARCHETYPES: Record<string, { name: string; tagline?: string; narrative?: string }> = {
  strategic_integrator: {
    name: "The Anchored Shepherd",
    tagline: "The tool deepens the study, and the preacher stays fed.",
    narrative: "Your answers describe a practice where prayer and the text lead, the tool serves, and what you check you actually check. The work of keeping this is mostly the work of not drifting. There is room here to give it away: teach one younger preacher the same discipline. Faith at Work has language for the limits you are already keeping.",
  },
  grounded_selectivist: {
    name: "The Deliberate Minimalist",
    tagline: "Little use of the tool, and a considered reason for it.",
    narrative: "You have kept AI at a distance on purpose, and your answers on authorship and checking back that up. This is a formed position rather than an absence of one, and the check treats it that way. The one thing worth watching is that a position stays current: a small, bounded look at what these tools now do would keep your conviction informed rather than inherited. Spencer's “Human Capacity and Technology” is a fair place to look.",
  },
  augmented_thinker: {
    name: "The Deepened Student",
    tagline: "Your study goes further with the tool than it would without it.",
    narrative: "Your answers describe the tool working as a sparring partner: it argues with you, surfaces what you missed, and sends you back to the text. That is the best thing it can do for a preacher. Keep the checking and the unaided rhythm in place as your use grows, and this holds. Spencer's “The Quad” gives a shape for testing what it hands you.",
  },
  capable_but_unexposed: {
    name: "Rooted and Unexposed",
    tagline: "A strong practice that has not yet met these tools.",
    narrative: "Nothing here suggests the tool is harming your preaching, because it is barely present. Your study and your authorship read as solid. If there is an exposure it runs the other way: your people are already meeting AI, and a pastor who has never used it is answering their questions from the outside. A bounded look, on your terms, would cost little. Korpi's AI Goes to Church is written for exactly this moment.",
  },
  dependent_operator: {
    name: "The Overextended Preparer",
    tagline: "Fluent and fast, with the study muscles thinning underneath.",
    narrative: "Your answers describe someone carrying a real load, with the tool holding more of the preparation than it once did. That is a common place to arrive and not a verdict on your ministry. The way back is small and repeatable: one message a month prepared with the text, prayer, and no tool at all. Faith at Work calls this the deliberate recovery of friction.",
  },
  uncritical_consumer: {
    name: "Quick to Trust",
    tagline: "The tool is trusted at about the level a good commentary would be.",
    narrative: "Your answers suggest what the tool gives you is often taken as it arrives. The tools are good enough now that this feels reasonable, which is exactly why it is worth naming. One habit changes most of it: never preach a quotation you have not seen in the source. Faith at Work is direct about what these systems can invent.",
  },
  curious_explorer: {
    name: "The Careful Explorer",
    tagline: "Real trying, with the line around it still forming.",
    narrative: "You are genuinely working out what this is for, which is the right posture at this point. What is not yet settled is the frame: where the tool is welcome, what always gets checked, and what stays entirely yours. Writing that line down, and telling one other person, turns exploration into practice. Spencer's “Uncoordinated” is about why that other person matters.",
  },
  hesitant_starter: {
    name: "At the Threshold",
    tagline: "Standing at the edge, with the first step still ahead.",
    narrative: "Your answers describe someone who has kept their distance so far. That is a defensible place to stand, and it costs nothing visible this Sunday. What it does cost is a say in how these tools enter your church, since they are arriving whether or not you use them. One small, bounded trial would give your position its own evidence. Korpi's AI Goes to Church is a gentle place to begin.",
  },
  forming_practitioner: {
    name: "Still Forming",
    tagline: "A mixed picture, with the pattern not yet settled.",
    narrative: "Nothing here is collapsing and nothing is yet a signature strength, which is a real position rather than a failure. The dimension readings below will tell you more than any label: your next step is specific to the weakest of them. Take one, give it a season, and run this check again. Faith at Work has the practice most preachers start with: read first, think first, write first, then use AI.",
  },
};

const PASTOR_CONTENT: Partial<Record<ConstructId, Partial<ConstructContent>>> = {
  agency: {
    whatItMeasures: "Whether the message is received from God through prayer and study and owned by you: whether you can trace each major point back to the text and to your own conviction, whatever tools helped along the way.",
    whyItMatters: "A preacher who cannot say why a point is in the message cannot defend it, cannot be corrected in it, and cannot be formed by it. Authorship is where a sermon stops being content and becomes a word from a shepherd.",
    atStrong: "Your responses are consistent with authorship kept. The tool contributes material, and prayer and the text decide what your people hear.",
    atDeveloping: "Your responses suggest you usually keep the message yours, with weeks where a good outline is accepted more or less as it arrives.",
    atWatch: "Your answers suggest the tool has begun deciding what the congregation hears. This is quiet from the inside, because the sermons are usually fine.",
    research: { claim: "Preaching from the ongoing experience of the Holy Spirit is the part no system can supply.", source: "Vrancila, “Navigating the Agathokakological Age”" },
    practices: [
      "Read first, think first, write first, then bring the tool in for feedback.",
      "Before the manuscript is finished, say each major point aloud in your own words without notes.",
      "Keep a line in your notes between what you received in study and what the tool suggested.",
    ],
  },
  verification: {
    whatItMeasures: "Whether AI-supplied exegesis, word studies, quotations, citations, and illustrations are checked against Scripture and real sources before they reach the pulpit.",
    whyItMatters: "The pulpit carries authority. A fabricated quotation preached with conviction does damage that a correction cannot fully undo, and these tools invent sources fluently.",
    atStrong: "Your responses describe checking as part of preparation rather than a reaction to suspicion.",
    atDeveloping: "Your responses suggest you check when something feels off, which catches the obvious errors and misses the plausible ones.",
    atWatch: "Your answers are consistent with material reaching your people that has not been confirmed. The errors that survive are the ones that sound right.",
    research: { claim: "AI can invent sources, distort meaning, and repeat falsehoods.", source: "Faith at Work" },
    practices: [
      "Adopt one rule: never preach a quotation you have not seen in the source.",
      "Check word studies against a lexicon rather than a summary, especially when the meaning carries the point.",
      "When you cannot verify something in time, preach without it.",
    ],
  },
  dependencySafety: {
    whatItMeasures: "What remains if the tools are gone: whether study, meditation, prayer, and craft are strong enough to prepare and preach without them.",
    whyItMatters: "A preacher whose muscles are strong can use any tool freely. A preacher whose muscles have thinned depends on it whether they intend to or not, and the thinning is invisible until a week when the tool is not there.",
    atStrong: "Your responses are consistent with capacity kept. The tools are additions to a practice that stands on its own.",
    atDeveloping: "Your responses suggest you would manage without them, more slowly and with visible strain.",
    atWatch: "Your answers suggest the preparation now runs through the tools. That is a common place to arrive under load, and it is recoverable.",
    research: { claim: "The deliberate recovery of friction is what keeps the work forming the worker.", source: "Faith at Work" },
    practices: [
      "Prepare one message a month with the text, prayer, and no tool at all.",
      "Keep one series a year entirely tool-free, and tell someone you are doing it.",
      "Notice the reach for the tool before any attempt of your own. That reach is the habit worth interrupting.",
    ],
  },
  fluency: {
    whatItMeasures: "Whether you know what AI is good for in ministry (administration, editing, research prompts, translation, accessibility) and what it is not for, and use it skillfully inside those limits.",
    whyItMatters: "Fluency here is not prompting skill. It is a line drawn on purpose, which is what lets a pastor use the tool heavily in one place and not at all in another without contradiction.",
    atStrong: "Your responses describe a line you could explain to your elders, and a tool doing the work you assigned it.",
    atDeveloping: "Your responses suggest real working skill, with the boundary still being drawn as you go.",
    atWatch: "Your answers are consistent with the tool being used wherever it helps, with the question of where it should stay out not yet settled.",
    research: { claim: "AI may serve administration, scheduling, editing, and communication, and there are parts of ministry it should not touch.", source: "Faith at Work" },
    practices: [
      "Write your line down in one paragraph: what the tool may touch, and what stays entirely yours.",
      "Share it with your elders, so it is a practice rather than a private intention.",
      "Revisit it once a year, because the tools change and the line may need to move.",
    ],
  },
  transfer: {
    whatItMeasures: "Whether AI-assisted study becomes your own understanding, memory, and maturity, or arrives and leaves with the closed tab.",
    whyItMatters: "Preparation is meant to form the preacher first. If nothing stays, the sermon was delivered and the preacher was not fed, and that cost compounds quietly over years.",
    atStrong: "Your responses describe study that stays with you: you could teach the passage weeks later without the file.",
    atDeveloping: "Your responses suggest partial retention, with the shape of the study remembered and the substance needing the notes.",
    atWatch: "Your answers are consistent with material passing through the sermon without passing through you.",
    research: { claim: "The king was to write out his own copy of the law, so that its words shaped him.", source: "Spencer, “The Quad”, on Deuteronomy 17" },
    practices: [
      "Close the tools and reconstruct the passage in your own words before the manuscript is finished.",
      "Keep your own notes, in your own hand or your own file, separate from anything a tool produced.",
      "Teach the passage to one person during the week. Teaching exposes what did not stay.",
    ],
  },
  amplification: {
    whatItMeasures: "Whether the tool sharpens the exegesis, exposes weak arguments, and raises better questions, or mainly produces the same message faster.",
    whyItMatters: "Speed is the shallowest thing the tool can offer a preacher. The deeper gain is an argument you cannot yet defend being found on Thursday rather than from the pulpit on Sunday.",
    atStrong: "Your responses describe the tool used as a sparring partner: it argues with you and sends you back to the text.",
    atDeveloping: "Your responses suggest occasional real depth, usually when you deliberately ask for challenge rather than assistance.",
    atWatch: "Your answers are consistent with the tool saving time without changing how deeply you see the passage.",
    research: { claim: "AI deals in knowledge, humans deal in wisdom.", source: "Todd Korpi, quoted in “Navigating the Agathokakological Age”" },
    practices: [
      "Ask the tool to argue as strongly as it can against your reading, then take its best objection to the commentaries.",
      "Ask what your draft fails to consider before you ask it to improve the draft.",
      "State your own reading first, so the tool has something to push against.",
    ],
  },
  skillGrowth: {
    whatItMeasures: "Whether exegesis, structure, illustration, and delivery keep growing, in you and in the preachers you are training.",
    whyItMatters: "Craft grows through practice and difficulty. A preacher who cannot build an outline by hand cannot judge the one the tool produced, and the loss shows first in the preachers coming up behind.",
    atStrong: "Your responses are consistent with craft that keeps developing. Time the tool saves goes somewhere that grows you.",
    atDeveloping: "Your responses suggest craft holding steady, with its development left largely to chance.",
    atWatch: "Your answers suggest parts of the craft have gone quiet from disuse. Naming which ones is how they come back.",
    research: { claim: "Procedural knowing asks how a person's skills, or lack of them, shape what is presented.", source: "Spencer, “The Quad”" },
    practices: [
      "Name two parts of the craft you will keep doing by hand, and keep them.",
      "Build one outline a month with paper and the text alone.",
      "Work through the craft week by week with any preacher you are training.",
    ],
  },
  adaptability: {
    whatItMeasures: "Whether you examine your own AI habits, adjust them, keep Sabbaths from the tool, and stay accountable to another person about it.",
    whyItMatters: "Habits drift, and the ones that drift furthest are the ones nobody looks at. A practice reviewed with someone else in the room can be corrected before it hardens.",
    atStrong: "Your responses describe a practice that is reviewed, rested from, and adjusted from what you find.",
    atDeveloping: "Your responses suggest you adjust when a problem becomes obvious, which works and runs a step behind.",
    atWatch: "Your answers are consistent with a workflow that simply runs. Those are the ones that shape us without our noticing.",
    research: { claim: "Discipleship is the church's coordinating work: we are not meant to discern alone.", source: "Spencer, “Uncoordinated”" },
    practices: [
      "Put a review of your AI practice in the calendar, and hold it with one other person.",
      "Keep a regular rest from the tool: one message a month, or one series a year.",
      "When you change a habit, write down what you noticed that prompted it.",
    ],
  },
  responsibleUse: {
    whatItMeasures: "Whether your use is honest where honesty matters, whether pastoral care stays in your own presence, and whether confidences stay out of tools.",
    whyItMatters: "A confidence shared with a pastor was not shared with a company's servers. And a congregation that discovers the tool's role by accident learns something about trust that no sermon can undo.",
    atStrong: "Your responses describe a practice that could bear the light: your people could learn how you use AI and trust you more, not less.",
    atDeveloping: "Your responses suggest care is mostly kept in your own hands, with the line around disclosure not yet settled.",
    atWatch: "Your answers suggest use you would not want examined, or care that has begun moving into the tool. Both are worth attending to early.",
    research: { claim: "Being a neighbor requires effort, contact, a closing of the distance.", source: "Spencer's retelling of the Good Samaritan" },
    practices: [
      "Keep confidences out of every tool, and take hard situations to a trusted elder or counselor instead.",
      "Decide your disclosure position before someone asks, and tell your elders what it is.",
      "Keep any message that touches a person's life in your own hand.",
    ],
  },
  creativity: {
    whatItMeasures: "Whether the sermon carries your voice, your context, your people's lives, and your own testimony, rather than a message any church could receive unchanged.",
    whyItMatters: "The illustrations from your own life and your people's lives are the part no tool can supply. When they thin out, the sermon starts to sound like everyone's, and a congregation feels it before it can name it.",
    atStrong: "Your responses describe sermons that could only be yours: your voice, your city, your story of grace.",
    atDeveloping: "Your responses suggest a real voice that sometimes gets flattened by whatever the tool offers first.",
    atWatch: "Your answers are consistent with a message that could be preached unchanged in another church. That is the shape voice loss takes.",
    research: { claim: "Our role is not to out-compute AI, but to out-human it.", source: "Vrancila, “Navigating the Agathokakological Age”" },
    practices: [
      "Let the tool draft if you wish, and always finish in your own voice.",
      "Put one thing in every sermon that only your congregation would understand.",
      "Keep your own file of illustrations from your life, your reading, and your people.",
    ],
  },
};

export const PERSONA_DISPLAY: Partial<Record<Persona, PersonaDisplay>> = {
  business: {
    reportTitle: "Business AI Health Check",
    indexName: "Business AI Health Score",
    subject: "business",
    constructNames: BUSINESS_CONSTRUCT_NAMES,
    constructPrinciples: BUSINESS_PRINCIPLES,
    riskName: "Continuity Risk",
    composites: {
      futureReadiness: "Market Readiness",
      augmentation: "Strategic Advantage",
      judgment: "Decision Integrity",
      capabilityTransfer: "Knowledge Retention",
      dependencyIndex: "Continuity Exposure",
      underexposure: "Adoption Gap",
    },
    stageNames: BUSINESS_STAGE_NAMES,
    stageDetail: BUSINESS_STAGE_DETAIL,
    archetypes: BUSINESS_ARCHETYPES,
    content: BUSINESS_CONTENT,
    fingerprintLabels: [
      "Decision ownership", "Verification discipline", "Continuity", "Governance",
      "Knowledge capture", "Strategic amplification", "Market readiness",
    ],
    disclaimerExtra: "This is not legal, financial, or compliance advice.",
  },

  professional: {
    reportTitle: "Professional AI Work Practice Check",
    indexName: "Practice Health Score",
    subject: "person",
    constructNames: PROFESSIONAL_CONSTRUCT_NAMES,
    constructPrinciples: PROFESSIONAL_PRINCIPLES,
    riskName: "Reliance Risk",
    composites: {
      futureReadiness: "Readiness for what is coming",
      augmentation: "Genuine amplification",
      judgment: "Judgment held",
      capabilityTransfer: "Capability retained",
      dependencyIndex: "Reliance exposure",
      underexposure: "Exposure gap",
    },
    fingerprintLabels: [
      "Practical fluency", "Unaided capability", "Checking", "Amplification",
      "Decision ownership", "Reliance", "Readiness",
    ],
    disclaimerExtra: "This reading is about your practice on the day you answered, not about your competence, your role, or your standing at work. It is not an appraisal and it is not designed to be shared with an employer unless you choose to.",
  },

  pastor: {
    reportTitle: "Preaching Formation Check",
    indexName: "Formation Health Score",
    subject: "person",
    constructPrinciples: PASTOR_PRINCIPLES,
    composites: {
      futureReadiness: "Ministry Readiness",
      augmentation: "Study Depth",
      judgment: "Pulpit Integrity",
      capabilityTransfer: "Retained Formation",
      dependencyIndex: "Dependence Exposure",
      underexposure: "Exposure Gap",
    },
    stageNames: PASTOR_STAGE_NAMES,
    stageDetail: PASTOR_STAGE_DETAIL,
    archetypes: PASTOR_ARCHETYPES,
    content: PASTOR_CONTENT,
    fingerprintLabels: [
      "Authorship", "Faithfulness to the text", "Unaided capacity", "Formation retained",
      "Voice", "Integrity and care", "Ministry readiness",
    ],
    disclaimerExtra: "This is a private self-reflection index drawn from your own answers, not a spiritual assessment of your calling, your faithfulness, or your ministry. The practices and resources are offered, not prescribed.",
  },
};

/* ------------------------------------------------------------- accessors */

const of = (persona?: Persona) => (persona ? PERSONA_DISPLAY[persona] : undefined);

export const isBusiness = (persona?: Persona) => persona === "business";

export function constructName(persona: Persona | undefined, id: ConstructId): string {
  return of(persona)?.constructNames?.[id] ?? CONSTRUCTS[id].name;
}

/** The name to print when a dimension is reported as a risk rather than a strength. */
export function reportedConstructName(persona: Persona | undefined, id: ConstructId): string {
  if (!CONSTRUCTS[id].reportedAsRisk) return constructName(persona, id);
  return of(persona)?.riskName ?? "Dependency Risk";
}

export function constructPrinciple(persona: Persona | undefined, id: ConstructId): string {
  return of(persona)?.constructPrinciples[id] ?? CONSTRUCTS[id].principle;
}

export function constructContent(persona: Persona | undefined, id: ConstructId): ConstructContent {
  const base = CONSTRUCT_CONTENT[id];
  const over = of(persona)?.content?.[id];
  return over ? { ...base, ...over } : base;
}

export function stageName(persona: Persona | undefined, stage: number): string {
  return of(persona)?.stageNames?.[stage] ?? STAGES.find((s) => s.stage === stage)?.name ?? "";
}

/** Which way a reading is off the path, when it is off it in a nameable way. */
export type RiskLean = "dependence" | "disconnection" | "balanced";

/**
 * A stage description that matches the person standing in it.
 *
 * A persona with its own ladder keeps its own text in both directions, because
 * rewriting the ministry stages for dependence and then falling back to generic
 * technology prose would be worse than either. Everyone else gets the
 * dependence variant at the low camps when that is the direction they are off.
 */
export function stageDetail(persona: Persona | undefined, stage: number, lean: RiskLean = "balanced") {
  const own = of(persona)?.stageDetail?.[stage];
  if (own) return own;
  if (lean === "dependence" && STAGE_DETAIL_DEPENDENCE[stage]) return STAGE_DETAIL_DEPENDENCE[stage];
  if (lean === "disconnection" && STAGE_DETAIL_DISCONNECTION[stage]) return STAGE_DETAIL_DISCONNECTION[stage];
  return STAGE_DETAIL[stage];
}

/**
 * Which way this reading leans, from the two composites the report already
 * prints. Neither is a failure on its own: the lean is only named when one is
 * clearly ahead of the other, so a balanced profile is never given a direction
 * it did not earn.
 */
export function riskLean(dependencyIndex: number, underexposure: number): RiskLean {
  if (dependencyIndex >= 55 && dependencyIndex - underexposure >= 15) return "dependence";
  if (underexposure >= 55 && underexposure - dependencyIndex >= 15) return "disconnection";
  return "balanced";
}

export function compositeName(
  persona: Persona | undefined,
  key: keyof PersonaDisplay["composites"],
  fallback: string
): string {
  return of(persona)?.composites[key] ?? fallback;
}

export function indexName(persona: Persona | undefined): string {
  return of(persona)?.indexName ?? "developmental index";
}

export function reportTitle(persona: Persona | undefined): string {
  return of(persona)?.reportTitle ?? "Neogogy Human Advantage Assessment";
}

export function archetypeDisplay(
  persona: Persona | undefined,
  archetype: CompassResult["archetype"]
): CompassResult["archetype"] {
  const over = of(persona)?.archetypes?.[archetype.id];
  if (!over) return archetype;
  return {
    id: archetype.id,
    name: over.name,
    tagline: over.tagline ?? archetype.tagline,
    narrative: over.narrative ?? archetype.narrative,
  };
}

/** The goal a dimension points toward, where the persona states one. */
export function healthyMarker(persona: Persona | undefined, id: ConstructId): string | undefined {
  return persona === "pastor" ? PASTOR_MARKERS[id] : undefined;
}

export function fingerprintLabels(persona: Persona | undefined): string[] | undefined {
  return of(persona)?.fingerprintLabels;
}

export function disclaimerExtra(persona: Persona | undefined): string {
  return of(persona)?.disclaimerExtra ?? "";
}
