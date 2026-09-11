/**
 * The business layer of the copy, section 13.
 *
 * Where the platform already holds canonical wording, the canonical wording
 * wins and these supply only the employer's reading of it. Nothing here is
 * written into a template.
 */

export interface StageBusinessCopy {
  stage: number;
  looksLike: string;
  meansForBusiness: string;
  needNext: string;
}

export const STAGE_BUSINESS: StageBusinessCopy[] = [
  { stage: 1, looksLike: 'No meaningful use of AI in the work.',
    meansForBusiness: 'Nothing is being exposed through tools, and nothing is being formed either. If the role is moving towards assisted work, this person is not yet on the route.',
    needNext: 'A safe, bounded first task with a colleague alongside.' },
  { stage: 2, looksLike: 'Knows the tools exist and holds views about them; use is rare or second-hand.',
    meansForBusiness: 'Views about AI are being formed without practice behind them, which can shape team opinion in either direction.',
    needNext: 'One real task, taken end to end.' },
  { stage: 3, looksLike: 'Tries things occasionally; no routine.',
    meansForBusiness: 'Interest is present, and output quality varies from task to task.',
    needNext: 'A few recurring tasks with a stated standard to judge results against.' },
  { stage: 4, looksLike: 'Regular experimentation; use is broad but evaluation and boundaries are thin.',
    meansForBusiness: 'Use has grown faster than checking. This is the stage where an unverified claim or an unconsidered upload is likeliest to reach a client, a document, or a decision.',
    needNext: 'Verification and boundary habits taught alongside continued practice, not instead of it.' },
  { stage: 5, looksLike: 'AI reliably completes real tasks; judgment and independence are developing.',
    meansForBusiness: 'Dependable for routine assisted work. Consequential outputs still want a second look.',
    needNext: 'Unaided comparisons, and clear rules about where AI is and is not used.' },
  { stage: 6, looksLike: 'AI is part of the regular workflow, and what is learned with it can be reconstructed without it.',
    meansForBusiness: 'Can be trusted with assisted work of consequence, and can show others how.',
    needNext: 'Deliberate allocation of roles between human and AI, and opportunities to teach.' },
  { stage: 7, looksLike: 'Decides what stays human and what goes to AI, and can say why.',
    meansForBusiness: 'Can design how a team uses AI. A candidate for leading AI practice internally.',
    needNext: 'Whole-workflow redesign, and proof that insight transfers to settings with no AI present.' },
  { stage: 8, looksLike: 'Whole workflows redesigned around human and AI roles; output and capability rise together.',
    meansForBusiness: 'A multiplier. Can set the organisation’s standards for assisted work.',
    needNext: 'Scope to redesign further, and a review cycle so the practice keeps renewing.' },
  { stage: 9, looksLike: 'Practice renews itself as the tools change; habits are reviewed on a cycle.',
    meansForBusiness: 'Resilient to tool churn. This person’s routine will not be stranded when a tool changes.',
    needNext: 'Room to run experiments and share what they learn.' },
  { stage: 10, looksLike: 'Mature, self-renewing practice that produces new methods and passes them on.',
    meansForBusiness: 'The reference point for the organisation.',
    needNext: 'To be asked to teach.' },
];

export interface ProfileBusinessCopy {
  id: string; opportunity: string; risk: string; emphasis: string; firstConversation: string;
}

export const PROFILE_BUSINESS: Record<string, ProfileBusinessCopy> = {
  hesitant_starter: { id: 'hesitant_starter',
    opportunity: 'No bad habits to unlearn.', risk: 'Being outpaced by the work.',
    emphasis: 'Practical fluency.',
    firstConversation: 'One small, real task with a colleague alongside. Not a policy briefing.' },
  curious_explorer: { id: 'curious_explorer',
    opportunity: 'Energy to channel.', risk: 'Errors and uploads passing unchecked.',
    emphasis: 'Checking and boundaries, alongside continued practice.',
    firstConversation: 'Recurring tasks with a stated standard. Do not read enthusiasm as judgment.' },
  forming_practitioner: { id: 'forming_practitioner',
    opportunity: 'Dependable assisted output already.', risk: 'Consequential outputs going unreviewed.',
    emphasis: 'Unaided comparisons and role allocation.',
    firstConversation: 'Which decisions in this task are yours to make.' },
  uncritical_consumer: { id: 'uncritical_consumer',
    opportunity: 'Fluency is already present.', risk: 'Plausible errors and delegated decisions reaching real work.',
    emphasis: 'The two-source rule, and a one-line reason for every accepted suggestion.',
    firstConversation: 'Checking, before any more tool access.' },
  dependent_operator: { id: 'dependent_operator',
    opportunity: 'Fast and productive on assisted work.', risk: 'Capability thinning underneath the output.',
    emphasis: 'Independent capability and transfer.',
    firstConversation: 'One recurring task done without the tool, compared afterwards.' },
  capable_but_unexposed: { id: 'capable_but_unexposed',
    opportunity: 'A strong human foundation to build on.', risk: 'Being overtaken on fluency while the foundation holds.',
    emphasis: 'Bounded practical exposure on their own work.',
    firstConversation: 'Where in your week would this genuinely help, and where would it not.' },
  augmented_thinker: { id: 'augmented_thinker',
    opportunity: 'AI is measurably improving the thinking, not only the output.', risk: 'The practice being assumed rather than maintained.',
    emphasis: 'Protecting what is working, and teaching it.',
    firstConversation: 'What would you show a colleague first.' },
  grounded_selectivist: { id: 'grounded_selectivist',
    opportunity: 'Restraint that is chosen, with judgment intact.', risk: 'Being misread as resistance.',
    emphasis: 'Keeping the judgment while widening the practice, if the role needs it.',
    firstConversation: 'Where the line is, and why you drew it there.' },
  strategic_integrator: { id: 'strategic_integrator',
    opportunity: 'Can design how a team uses AI.', risk: 'Being left to do it alone.',
    emphasis: 'Whole-workflow redesign and mentoring.',
    firstConversation: 'Which workflow would you redesign first, and who would you take with you.' },
};

export const TIER_ORDER = [
  'Foundational', 'Practitioner', 'Critical', 'Human advantage', 'Strategic', 'Strategic and adaptive',
] as const;

export const TIER_BLURB: Record<string, string> = {
  'Foundational': 'Safe and effective AI use, from a standing start.',
  'Practitioner': 'Real workflow fluency on the work people actually do.',
  'Critical': 'Verification, judgment and decision ownership.',
  'Human advantage': 'Transfer, skill preservation and independent capability.',
  'Strategic': 'Cognitive amplification and workflow redesign.',
  'Strategic and adaptive': 'Continuous experimentation, renewal and teaching others.',
};
