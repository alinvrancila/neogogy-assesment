/**
 * Explanatory content layer.
 *
 * The engine decides what is true about a respondent. This file supplies the
 * words used to explain it: what each dimension measures, what a given band
 * suggests, what the research base says, and what to practise.
 *
 * Evidence policy: only three specific studies are cited by name, because only
 * those three are vetted in this repository. Every other reference points at a
 * field of research rather than inventing a paper, an author, or a number.
 */
import type { ConstructId, Persona } from "./types";

export interface Citation { claim: string; source: string }

/** The three named studies this instrument is willing to cite specifically. */
export const EVIDENCE_BASE: Citation[] = [
  {
    claim: "About 95 percent of students now use AI in some form and 94 percent use it on assessed work, while fewer than half say their teaching staff are helping them build the skill.",
    source: "HEPI / Kortext, 2026",
  },
  {
    claim: "Students who practised with an unrestricted chatbot performed roughly 17 percent worse on a later unaided exam than students who practised without AI at all. Assistance during practice raised output while lowering what was retained.",
    source: "Bastani et al., PNAS, 2025",
  },
  {
    claim: "The same underlying technology, designed deliberately for learning, produced roughly double the learning gains of established classroom practice. The design of the use, rather than the tool, carried the effect.",
    source: "Kestin et al., Scientific Reports, 2025",
  },
];

/**
 * The books the framework itself comes from. These are kept separate from
 * EVIDENCE_BASE on purpose: they are the source texts for the model this
 * assessment implements, written by its author, not independent evidence for
 * it. Presenting them as research would overstate the case.
 */
export interface FrameworkSource { title: string; year: string; author: string; note: string }

export const FRAMEWORK_SOURCES: FrameworkSource[] = [
  {
    title: "Neogogy: Learning at the Speed of Mind",
    year: "2025",
    author: "Dr. Alin Vrancila",
    note: "The complete framework for education in the age of artificial intelligence, introducing the seven principles of Neogogy and the role of the educator as wisdom collaborator. This is where the ideas behind the ten dimensions you were measured on are set out in full.",
  },
  {
    title: "Understanding Neogogy: Academic Intelligence in the Age of AI",
    year: "2026",
    author: "Dr. Alin Vrancila",
    note: "The companion volume focused entirely on higher education, making the case for why the framework is needed. It carries reflection questions written for faculty learning communities and seminars, which suit a group working through their results together.",
  },
];


/**
 * The same three studies, framed for the person reading them.
 *
 * All three are education studies, and every edition was shown the same words,
 * so a Business Owner reading a risk register was given undergraduate exam
 * scores with nothing acknowledging that. Inventing different studies would be
 * worse. Each edition is now told plainly where the evidence comes from and why
 * it is being put in front of them, which is more credible than implying it was
 * about them.
 *
 * student and teacher keep the original wording, which was written for them.
 */
export interface EvidenceFraming { leadIn: string; claims: Citation[]; bookNotes: Record<string, string> }

const EVIDENCE_BY_PERSONA: Partial<Record<Persona, EvidenceFraming>> = {
  business: {
    leadIn: "The sharpest evidence on this question comes from education rather than from business, and it is worth your time because it measures what a tool does to a person's capability, which is the thing you are paying for every time you hire.",
    claims: [
      { claim: "A survey of UK undergraduates found about 95 percent using AI in some form and 94 percent using it on assessed work, while fewer than half said their teaching staff were helping them build the skill. These are the people you will be hiring, and the gap between how much they use it and how little they were taught is the same gap most businesses have.", source: "HEPI / Kortext, 2026" },
      { claim: "High school students who practised mathematics with an unrestricted chatbot scored roughly 17 percent worse on a later unaided exam than students who practised with no AI at all. It was measured in a classroom rather than in a business, and what it measures is what costs you: the help raised what was produced at the time and lowered what the person kept.", source: "Bastani et al., PNAS, 2025" },
      { claim: "In a Harvard physics course, the same underlying technology, designed deliberately for learning, produced roughly double the learning gains of established classroom practice. Nobody has run this study on a sales team, and the part that carries over to your business is that the design of the use, not the tool, produced the result.", source: "Kestin et al., Scientific Reports, 2025" },
    ],
    bookNotes: {
      "Neogogy: Learning at the Speed of Mind": "An education book, written for teachers and institutions rather than for owners. It is where the ten dimensions your business was measured on are set out in full, along with the seven principles of Neogogy and the case for the educator as a wisdom collaborator. Take the model from it and expect to translate the classroom examples into your own operation.",
      "Understanding Neogogy: Academic Intelligence in the Age of AI": "The companion volume, written entirely for higher education, making the case for why the framework is needed. Its reflection questions were built for faculty learning communities, and they need less translation than that suggests: the same questions work on a leadership team sitting down to agree where AI belongs in the business.",
    },
  },
  professional: {
    leadIn: "The evidence below was gathered in classrooms rather than in workplaces, and it is worth your time because education is the one place where somebody thought to measure what a person could still do afterwards, which is exactly what this report is asking about you.",
    claims: [
      { claim: "A survey of UK undergraduates found about 95 percent using AI in some form and 94 percent using it on assessed work, while fewer than half said their teaching staff were helping them build the skill. Change the words and it describes most workplaces, probably yours: nearly everyone using these tools, almost nobody being taught how to use them well.", source: "HEPI / Kortext, 2026" },
      { claim: "High school students who practised with an unrestricted chatbot did roughly 17 percent worse on a later unaided exam than students who practised without AI at all, even though their assisted work was better at the time. It was measured on mathematics homework, and what it measured, how much is left in you once the help stops, is the one thing your job never checks.", source: "Bastani et al., PNAS, 2025" },
      { claim: "In a Harvard physics course, the same technology, designed deliberately for learning, produced roughly double the learning gains of established teaching. Nobody has run this study on your work, and the finding that travels is that the design of the use, rather than the tool, carried the effect.", source: "Kestin et al., Scientific Reports, 2025" },
    ],
    bookNotes: {
      "Neogogy: Learning at the Speed of Mind": "An education book, written for teachers and institutions. It is where the ten dimensions you were measured on come from, including the idea this whole assessment turns on: that help should leave you more capable than it found you. The examples are classrooms, the model is not.",
      "Understanding Neogogy: Academic Intelligence in the Age of AI": "The companion volume, written for higher education. It carries reflection questions made for faculty groups, which are worth borrowing if you would rather work through your results with a colleague than alone.",
    },
  },
  parent: {
    leadIn: "The studies below come from schools and universities rather than from homes, which puts them closer to your child's day than to yours, and they measure what a report card never shows you: what a learner can still do once the help is taken away.",
    claims: [
      { claim: "A survey of UK undergraduates found about 95 percent using AI in some form and 94 percent using it on assessed work, while fewer than half said their teaching staff were helping them build the skill. Those students are a few years ahead of your child, and they show you both where the habit is going and how little of it anyone is teaching.", source: "HEPI / Kortext, 2026" },
      { claim: "High school students who practised mathematics with an unrestricted chatbot scored roughly 17 percent worse on a later unaided exam than students who practised with no AI at all. Their work looked better while they were doing it. That is the finding to keep at your kitchen table: the help improved the homework and reduced what the child kept.", source: "Bastani et al., PNAS, 2025" },
      { claim: "In a Harvard physics course, the same technology, designed deliberately for learning, produced roughly double the learning gains of established teaching. The students were older than your child and the point still holds: used one way it takes learning away, used another it adds to it, and the difference is how the use is set up rather than which app is open.", source: "Kestin et al., Scientific Reports, 2025" },
    ],
    bookNotes: {
      "Neogogy: Learning at the Speed of Mind": "An education book, written for teachers and schools rather than for parents. It sets out the ten dimensions you were measured on in full, and the principle underneath them is one you can use at home tonight: help should leave the learner more able than it found them.",
      "Understanding Neogogy: Academic Intelligence in the Age of AI": "The companion volume, focused on higher education, so it speaks to the years ahead of a school age child rather than to this week. Its reflection questions were written for staff groups, and they work just as well for two parents deciding what the rule in your house is going to be.",
    },
  },
  pastor: {
    leadIn: "None of this was measured on preachers, and it earns your attention because it asks what preparation leaves behind in the person who did it, which is the one thing a Sunday morning cannot tell you.",
    claims: [
      { claim: "A survey of UK undergraduates found about 95 percent using AI in some form and 94 percent using it on assessed work, while fewer than half said their teaching staff were helping them build the skill. They are students and not preachers, and the shape will be familiar to you: nearly everyone using these tools, almost nobody being formed in how to use them.", source: "HEPI / Kortext, 2026" },
      { claim: "High school students who practised with an unrestricted chatbot scored roughly 17 percent worse on a later unaided exam than those who practised with no AI at all, even though their assisted work was stronger at the time. It was a mathematics class rather than a study desk, and it measures what your congregation can never see on a Sunday: what stayed in the person who prepared.", source: "Bastani et al., PNAS, 2025" },
      { claim: "In a Harvard physics course, the same technology, designed deliberately for learning, produced roughly double the learning gains of established teaching. The tool was not what changed. How it was set to work on the learner was, and that is the question to put to your own week of preparation.", source: "Kestin et al., Scientific Reports, 2025" },
    ],
    bookNotes: {
      "Neogogy: Learning at the Speed of Mind": "An education book rather than a ministry book, written for teachers and institutions. It is where the ten dimensions you were measured on are set out in full, with the seven principles of Neogogy and the idea of the educator as a wisdom collaborator behind them. The pulpit is never mentioned, and the pattern will be recognisable.",
      "Understanding Neogogy: Academic Intelligence in the Age of AI": "The companion volume, written for higher education and for faculty. Its reflection questions were made for learning communities and seminars, and they carry over with little effort to your staff team, or to a group of preachers working through their results together.",
    },
  },
  administrator: {
    leadIn: "All three studies below were run on students, which is either your own sector or the one that supplies your staff, and they measure what no dashboard reports: what a person can still do when the tool is taken away.",
    claims: [
      { claim: "A survey of UK undergraduates found about 95 percent using AI in some form and 94 percent using it on assessed work, while fewer than half said their teaching staff were helping them build the skill. Read it as adoption that ran well ahead of policy, because that is what it is, and it is the same race your own organisation is in.", source: "HEPI / Kortext, 2026" },
      { claim: "High school students who practised with an unrestricted chatbot scored roughly 17 percent worse on a later unaided exam than students who practised without it, while their assisted work was better at the time. It was measured on mathematics homework rather than on staff, and it is the clearest evidence you will find that output and capability can move in opposite directions at once.", source: "Bastani et al., PNAS, 2025" },
      { claim: "In a Harvard physics course, the same technology, designed deliberately for learning, produced roughly double the learning gains of established practice. This is the study that argues against a blanket position in either direction: the design of the use carried the effect, so what your policy says about how AI is used will matter more than what it says about whether it is used at all.", source: "Kestin et al., Scientific Reports, 2025" },
    ],
    bookNotes: {
      "Neogogy: Learning at the Speed of Mind": "An education book, written for teachers and institutions rather than for the people who run them. It sets out the ten dimensions you were measured on in full, with the seven principles of Neogogy behind them. Take the model from it, and expect to translate the classroom examples into whatever you lead.",
      "Understanding Neogogy: Academic Intelligence in the Age of AI": "The companion volume, focused entirely on higher education and on the case for why the framework is needed. Its reflection questions were written for faculty learning communities, which makes it the more useful of the two if you plan to take a team through their results together.",
    },
  },
};

/** What this edition should be shown, falling back to the original wording. */
export function evidenceFor(persona: Persona | undefined): EvidenceFraming {
  const own = persona ? EVIDENCE_BY_PERSONA[persona] : undefined;
  return own ?? {
    leadIn: "",
    claims: EVIDENCE_BASE,
    bookNotes: Object.fromEntries(FRAMEWORK_SOURCES.map((b) => [b.title, b.note])),
  };
}

export interface ConstructContent {
  /** One paragraph: what this dimension actually measures. */
  whatItMeasures: string;
  /** One paragraph: why it belongs in a formation assessment. */
  whyItMatters: string;
  /** Band readings, hedged. */
  atStrong: string;
  atDeveloping: string;
  atWatch: string;
  /** Supporting research, field level unless one of the three vetted studies applies. */
  research: Citation;
  /** Concrete, schedulable practices that move this dimension. */
  practices: string[];
}

export const CONSTRUCT_CONTENT: Record<ConstructId, ConstructContent> = {
  agency: {
    whatItMeasures:
      "Whether you remain the author of your own work: who makes the final call, whose reasoning survives into the finished product, and whether you could defend the result as your own.",
    whyItMatters:
      "Authorship is where judgment is exercised, and judgment is built by exercising it. When a tool quietly takes over the deciding, the work can still look strong while the capacity that produced it stops developing.",
    atStrong:
      "Your answers are consistent with keeping the decisions yourself. AI contributes material, and you determine what survives into the result.",
    atDeveloping:
      "Your answers suggest you usually keep the final call, but there are moments, often under time pressure, where the tool's version is accepted more or less as it arrives.",
    atWatch:
      "Your answers are consistent with the tool making decisions that belong to you. This is the most common way capable people stop developing while their output stays good.",
    research: {
      claim: "Learning research consistently finds that the effort a learner expends on selecting, organising and deciding is a large part of what produces durable capability, not an obstacle to it.",
      source: "Cognitive load and self-regulated learning research",
    },
    practices: [
      "Before opening a tool, write the two or three decisions this task actually requires. Make those yourself, whatever else you delegate.",
      "When you accept an AI suggestion, be able to say in one sentence why it is better than what you had.",
      "Keep a visible line in your drafts between what you decided and what was proposed to you.",
    ],
  },
  verification: {
    whatItMeasures:
      "Whether claims get checked before you act on them: sources opened rather than counted, reasoning followed rather than trusted because it reads well.",
    whyItMatters:
      "Fluent, confident output is easy to produce and hard to doubt. Verification is the habit that separates useful assistance from confidently transmitted error, and it has to be a routine rather than a mood.",
    atStrong:
      "Your answers describe checking as a habit rather than a reaction to suspicion, which is the form that actually protects you.",
    atDeveloping:
      "Your answers suggest you check when something feels off. That catches obvious errors and misses the plausible ones, which are the costly kind.",
    atWatch:
      "Your answers are consistent with confident presentation being accepted as evidence. Every unchecked claim that happens to be correct reinforces the habit that will eventually pass along one that is not.",
    research: {
      claim: "Presentation fluency raises perceived accuracy independently of actual accuracy, which is why polished output is harder to doubt than rough output making the same claim.",
      source: "Research on fluency effects in judgment and AI literacy frameworks",
    },
    practices: [
      "Adopt a two source rule for anything consequential: confirm it somewhere the tool did not supply.",
      "Open citations rather than counting them. A reference that exists is not a reference that supports the claim.",
      "Verify one claim you expect to be correct each week. Checking only your doubts trains the wrong reflex.",
    ],
  },
  dependencySafety: {
    whatItMeasures:
      "What remains when the tool is unavailable: whether you could produce comparable work unaided, and whether you still practise doing so.",
    whyItMatters:
      "This is the dimension the whole instrument was built around. Capability that only exists in the presence of a tool is a different asset from capability you own, and the difference stays invisible until the tool is gone.",
    atStrong:
      "Your answers are consistent with retained independent capability. Assistance is accelerating work you could still do, which is the healthy relationship.",
    atDeveloping:
      "Your answers suggest you could still work unaided, though more slowly or less confidently than you once did. That gap is worth watching before it widens.",
    atWatch:
      "Your answers are consistent with capability that has become tool dependent. This tends to feel like success, because the visible output is good and getting easier.",
    research: {
      claim: "Students who practised with an unrestricted chatbot scored roughly 17 percent worse on a later unaided exam than those who practised without it, even though their assisted work was stronger at the time.",
      source: "Bastani et al., PNAS, 2025",
    },
    practices: [
      "After an assisted session, redo one part unaided and compare. The comparison, not the assistance, is the measurement.",
      "Keep one recurring task permanently tool free, chosen because it matters rather than because it is easy.",
      "Notice when you reach for the tool before making any attempt. That reach is the habit worth interrupting.",
    ],
  },
  transfer: {
    whatItMeasures:
      "Whether assisted work becomes capability you carry: can you apply the method later, in a new situation, without the tool present.",
    whyItMatters:
      "Learning that only reproduces inside the original conversation has not transferred. Transfer is the difference between having been shown something and being able to do it.",
    atStrong:
      "Your answers describe assisted learning that travels. What you worked out with the tool is available to you afterwards, which is the point of the assistance.",
    atDeveloping:
      "Your answers suggest partial transfer: you retain the shape of the method but often need the tool, or your notes, to run it again.",
    atWatch:
      "Your answers are consistent with learning that stays in the session. The work gets done, and little of it accumulates as capability you hold.",
    research: {
      claim: "Transfer is strengthened by retrieving and applying a method in varied contexts, and weakened when the method is only ever observed being applied by someone or something else.",
      source: "Transfer of learning and retrieval practice research",
    },
    practices: [
      "Close the tool and reconstruct the method in your own words before the session counts as finished.",
      "Apply it once, deliberately, to a situation it was not built for. Varied application is what makes it portable.",
      "Teach it to one other person. Teaching exposes the parts you did not actually absorb.",
    ],
  },
  fluency: {
    whatItMeasures:
      "Practical skill with the tools: shaping a request, supplying context, decomposing a task, iterating on a weak answer, and adapting when the tool changes.",
    whyItMatters:
      "Fluency is a competence, not enthusiasm. It is what allows AI to be used well rather than used often, and it is the dimension most likely to be assumed rather than built.",
    atStrong:
      "Your answers describe deliberate, adaptive use: context supplied, tasks broken up, weak answers pushed on rather than accepted or abandoned.",
    atDeveloping:
      "Your answers suggest real working skill with room to grow, most often in iteration: turning a mediocre first answer into a good one rather than re-rolling or settling.",
    atWatch:
      "Your answers are consistent with a narrow, repeated pattern of use. That is a skills gap rather than a character flaw, and it is among the most straightforward to close.",
    research: {
      claim: "The same technology, designed deliberately for learning, produced roughly double the learning gains of established classroom practice. How the tool is used carries more of the effect than whether it is used.",
      source: "Kestin et al., Scientific Reports, 2025",
    },
    practices: [
      "Give the tool your actual constraints and one example of the standard you want, then judge the result against that standard.",
      "When the first answer is weak, iterate rather than rephrasing at random. Say what was wrong with it.",
      "Break a large task into parts and steer each one, instead of asking for the whole thing at once.",
    ],
  },
  amplification: {
    whatItMeasures:
      "Whether AI improves your thinking rather than only your throughput: new angles, surfaced objections, assumptions you had not examined.",
    whyItMatters:
      "Speed and insight are different outcomes and often get confused. A tool that makes you faster at what you already thought is useful; a tool that changes what you think is doing something else entirely.",
    atStrong:
      "Your answers describe AI functioning as a thinking partner: it widens the option space and challenges you, rather than transcribing you faster.",
    atDeveloping:
      "Your answers suggest occasional genuine amplification, usually when you deliberately ask for challenge rather than assistance.",
    atWatch:
      "Your answers are consistent with production rather than amplification. The output arrives sooner, and the thinking behind it is largely unchanged.",
    research: {
      claim: "Generating and evaluating alternatives before committing improves decision quality more reliably than elaborating a first idea, which is the mechanism amplification depends on.",
      source: "Research on decision quality and human-AI collaboration",
    },
    practices: [
      "Ask for the strongest case against your current position before you ask for help making it.",
      "Ask what you have not considered, then sit with the answer rather than skipping to the draft.",
      "State your own view first, so the tool has something to push against rather than a blank to fill.",
    ],
  },
  skillGrowth: {
    whatItMeasures:
      "Whether your underlying skills are still developing under AI support, or quietly being handed over.",
    whyItMatters:
      "Output volume is a poor proxy for capability. The concerning pattern is not producing less; it is producing more while the skill that used to produce it stops being exercised.",
    atStrong:
      "Your answers are consistent with skills that continue to grow. Time the tool saves is going somewhere that develops you.",
    atDeveloping:
      "Your answers suggest a mixed picture: some skills growing, others quietly delegated without a decision having been made about it.",
    atWatch:
      "Your answers describe skills you feel are weakening. Naming which ones, and whether you want them back, is the useful next step.",
    research: {
      claim: "Skills maintained by regular retrieval and practice persist; skills that are consistently offloaded decay, and the decay is typically noticed late because the output does not degrade with it.",
      source: "Retrieval practice and skill maintenance research",
    },
    practices: [
      "Name one skill you have handed over and decide, explicitly, whether to take it back.",
      "Where the tool saves time, spend some of it on the harder version of the same work.",
      "Do the first attempt yourself often enough that you can still tell whether the tool's version is better.",
    ],
  },
  creativity: {
    whatItMeasures:
      "Whether your own ideas lead and AI extends them, or whether the tool's first suggestion becomes the shape of the work.",
    whyItMatters:
      "Assistance tends toward the average of what it has seen. Used early, it narrows the space you explore; used later, it can widen it. The ordering matters more than the amount.",
    atStrong:
      "Your answers describe your ideas leading. The tool is used to stretch and stress your concept rather than to supply it.",
    atDeveloping:
      "Your answers suggest genuine originality that sometimes gets anchored by whatever the tool offers first.",
    atWatch:
      "Your answers are consistent with first suggestions becoming final direction, which is where distinctive work quietly converges toward everyone else's.",
    research: {
      claim: "Exposure to an example before ideating measurably narrows the range of ideas produced, an anchoring effect that applies to machine-generated examples as much as human ones.",
      source: "Design fixation and creative cognition research",
    },
    practices: [
      "Produce your own concept first, even a rough one, before asking for anything.",
      "Ask the tool to attack your idea rather than to replace it.",
      "When you take a suggestion, change something deliberately, so the result carries a decision of yours.",
    ],
  },
  responsibleUse: {
    whatItMeasures:
      "Boundaries you actually keep: what you will not put into a tool, what you disclose, and where you choose a person over a system.",
    whyItMatters:
      "These decisions are usually made quickly, under pressure, and once. Having a rule before the moment arrives is most of what separates a considered choice from a convenient one.",
    atStrong:
      "Your answers describe boundaries you can state and follow, including where you deliberately keep a person in the loop.",
    atDeveloping:
      "Your answers suggest reasonable instincts without settled rules, which tends to hold until convenience and pressure coincide.",
    atWatch:
      "Your answers are consistent with boundaries that have not yet been decided. This is worth attention less for what has happened than for what has not yet been thought through.",
    research: {
      claim: "Pre-committed rules outperform in-the-moment judgment under time pressure, which is precisely the condition in which most disclosure and data decisions get made.",
      source: "Research on implementation intentions and professional ethics practice",
    },
    practices: [
      "Write your own list of what never goes into a tool. A rule you can recite is a rule you can keep.",
      "Decide your disclosure position before you need it, rather than after.",
      "Name the situations where you will choose a person over a tool, and treat that as a standard rather than a preference.",
    ],
  },
  adaptability: {
    whatItMeasures:
      "Whether your habits are reviewed and updated as the tools change, or whether the first workflow that worked has simply persisted.",
    whyItMatters:
      "These systems change faster than habits do. A routine built for last year's capabilities can quietly become the reason you are getting less than the tool can now give, or more risk than it used to carry.",
    atStrong:
      "Your answers describe habits under review. You notice when something stops working and you change it deliberately.",
    atDeveloping:
      "Your answers suggest you adapt when a problem becomes obvious, which works but tends to run a step behind.",
    atWatch:
      "Your answers are consistent with a workflow that has not been revisited. That is comfortable and it is how practice drifts out of date.",
    research: {
      claim: "Learners who periodically evaluate and adjust their own strategies outperform those who apply a fixed approach, particularly when the environment changes.",
      source: "Metacognition and self-regulated learning research",
    },
    practices: [
      "Put a recurring review in your calendar. Habits do not audit themselves.",
      "When a tool updates, test it against your current routine on one real task rather than assuming either way.",
      "Keep one deliberate experiment running at all times, so adaptation is a habit rather than a response to trouble.",
    ],
  },
};

/** Extra colour on each stage, beyond the one line the config carries. */
/**
 * The same camps, read from the other direction.
 *
 * A single index has one low end and the instrument has two failure modes, so
 * the generic text at the bottom of the route describes somebody who has barely
 * touched AI. Read by a daily heavy user who scored low because nothing is
 * checked and nothing survives without the tool, it says the opposite of their
 * life: "little or no hands-on practice" printed a few inches from "reported AI
 * use: heavy".
 *
 * These are the dependence-direction variants, selected by the two composites
 * the report already computes. Above stage 6 the generic text holds for both
 * directions, because by then the two paths have converged on the same work.
 */
export const STAGE_DETAIL_DEPENDENCE: Record<number, { looksLike: string; trap: string }> = {
  1: { looksLike: "AI is doing a great deal of the work and very little of it is being checked, kept or reproduced. The output exists; almost nothing of it has stayed with you.",
       trap: "Reading the volume of finished work as evidence of capability. On this reading it is evidence of the tool's capability, not yet of yours." },
  2: { looksLike: "The tools are in daily use and the habits around them have not formed. Work goes out unverified, and starting anything without assistance has become genuinely hard.",
       trap: "Believing the fluency is yours because the speed is. Speed here belongs to the tool, and it leaves when the tool does." },
  3: { looksLike: "Frequent use with unstable practice. Some work is checked and some is not, and which is which depends on how much time there was rather than on what was at stake.",
       trap: "Letting the deadline decide what gets verified. That is a rule, it is just not one you chose." },
  4: { looksLike: "Broad, confident use across many tasks, with verification and independent capability thin underneath it. Breadth is well ahead of protection.",
       trap: "Volume growing faster than judgment. This is the stage where dependence usually forms, and it does not feel like a problem while it is forming." },
  5: { looksLike: "The tools are properly integrated and the checking has not kept pace. What you produce is good; what you could produce without help has narrowed.",
       trap: "Mistaking a working system for a resilient one. The system works until the tool changes underneath it." },
  6: { looksLike: "Real capability with real exposure. Judgment is present in most places and absent in a few, and the few are usually the ones under time pressure.",
       trap: "Protecting the practices you enjoy and skipping the ones you do not. Verification is rarely the enjoyable half." },
};

/**
 * The disconnection-direction variants.
 *
 * The generic text from stage 3 upward assumes regular use, so it told a person
 * who barely opens a tool that their "use is broad" and their "breadth is ahead
 * of discipline". Stages 1 and 2 already describe low use correctly and are not
 * overridden here.
 */
export const STAGE_DETAIL_DISCONNECTION: Record<number, { looksLike: string; trap: string }> = {
  3: { looksLike: "Capability that stands on its own, and very little practice with the tools. What you can do, you can do unaided; what the tools can do, you are largely guessing at.",
       trap: "Judging the tools from a small number of early attempts and treating that as a settled view." },
  4: { looksLike: "A strong independent foundation with thin practical fluency on top of it. You could do the work without help, and you would struggle to work well with help.",
       trap: "Calling a gap a principle. Some of this restraint is chosen and some of it is simply unpractised, and from inside they feel identical." },
  5: { looksLike: "Real judgment, real independence, and not much recent experience of what these tools now do. Your view of them is a year or two behind what they are.",
       trap: "Deciding about AI from a distance. The judgment may well be right, and it is not yet informed by practice." },
  6: { looksLike: "Well protected and lightly exposed. Verification, authorship and independent capability are in good order, and the fluency to use these tools well is undeveloped.",
       trap: "Assuming that because dependence is not your risk, nothing is. Underexposure is the other way to be left behind, and it arrives more slowly." },
};

export const STAGE_DETAIL: Record<number, { looksLike: string; trap: string }> = {
  1: { looksLike: "AI is essentially absent from how you work or learn. Whatever opinions you hold about it are not yet grounded in your own experience.",
       trap: "Deciding about AI from a distance. The judgment may be right, but it is not yet informed by practice." },
  2: { looksLike: "You follow the topic and have views on it, but very little of your own hands-on experience sits underneath those views.",
       trap: "Mistaking familiarity with the discourse for familiarity with the tools." },
  3: { looksLike: "Occasional experiments, without stable habits. Results vary a lot and you cannot yet predict which attempts will be useful.",
       trap: "Concluding the tools do not work from a small number of unstructured attempts." },
  4: { looksLike: "Regular use across a range of tasks, with evaluation and boundaries still thin. Breadth is ahead of discipline.",
       trap: "Volume growing faster than judgment, which is where dependency usually begins quietly." },
  5: { looksLike: "AI reliably completes real work. Judgment and independence are developing but are not yet the strongest parts of the picture.",
       trap: "Competence at using the tool being read as competence at the underlying task." },
  6: { looksLike: "AI is integrated into your workflows with active checking and retained authorship. The pattern is deliberate rather than habitual.",
       trap: "Integration becoming automatic, so verification quietly loosens as trust builds." },
  7: { looksLike: "You choose where AI belongs and where it does not, and you can explain the reasoning behind both.",
       trap: "Optimising the tasks you already do, rather than reconsidering which tasks are worth doing." },
  8: { looksLike: "AI is functioning as a genuine amplifier: the thinking is better, not only faster, and your unaided capability is stable or growing.",
       trap: "Assuming the people around you have the same habits, when the pattern you have built is uncommon." },
  9: { looksLike: "Your practices survive tool changes. New systems get absorbed without judgment or independence being renegotiated each time.",
       trap: "Stability turning into rigidity, where the routine outlives the reasons it was built." },
  10: { looksLike: "A mature working relationship with AI that also builds capability in other people, not only in you.",
        trap: "Complacency. At this point the risk is no longer collapse, it is a good pattern going unexamined as everything around it changes." },
};
