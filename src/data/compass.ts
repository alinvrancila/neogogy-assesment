export type AxisId = 'resilience' | 'readiness';
export type RoleId = 'student' | 'educator' | 'parent' | 'leader';
export type ItemType = 'agreement' | 'frequency' | 'confidence';
export type PersonaKey = 'guide' | 'anchor' | 'sprinter' | 'wanderer';

export type Item = {
  id: string;
  stem: string;
  type: ItemType;
  reverse?: boolean;
  star?: boolean;
};

export type Scenario = {
  id: string;
  stem: string;
  claimItem?: string;
  opts: Array<{ t: string; v: number }>;
};

export type Dimension = {
  id: string;
  n: number;
  axis: AxisId;
  title: string;
  principle: string;
  brief: string;
  critical?: boolean;
  tip: { text: string; src: string };
  items: Item[];
  scenario?: Scenario;
};

export type Persona = {
  name: string;
  emoji: string;
  accent: string;
  quad: string;
  tagline: string;
  portrait: string;
  looksLike: string;
  research: { text: string; src: string };
  strengths: string[];
  blindspots: string[];
  pull: string;
  moves: string[];
  nextstep: string;
  feed: string;
};

export const axes: Record<AxisId, { name: string; label: string }> = {
  resilience: { name: 'Resilience', label: 'Protected from harm' },
  readiness: { name: 'Readiness', label: 'Prepared for the future' }
};

export const roles: Array<{ id: RoleId; icon: string; name: string; q: string }> = [
  { id: 'student', icon: 'S', name: 'Student', q: 'How AI shapes my own learning' },
  { id: 'educator', icon: 'E', name: 'Educator', q: 'How AI shapes my learners' },
  { id: 'parent', icon: 'P', name: 'Parent', q: 'How AI shapes my child' },
  { id: 'leader', icon: 'L', name: 'Leader', q: 'How AI shapes my team' }
];

export const subjectLabel: Record<RoleId, string> = {
  student: 'my own learning',
  educator: 'my learners',
  parent: 'my child',
  leader: 'my team'
};

export const modalityExamples: Record<RoleId, string[]> = {
  student: ['how I use AI to write essays', 'AI help with math homework', 'studying with ChatGPT'],
  educator: ['AI-supported writing assignments', 'AI tutoring in my class', 'student use of chatbots'],
  parent: ['homework help with AI', 'AI use after school', 'AI as a study companion'],
  leader: ['AI in professional development', 'team research with AI', 'AI-supported lesson planning']
};

export const baselineLabels = ['Strongly no', 'Mostly no', 'Unsure', 'Mostly yes', 'Strongly yes'];

export const scales: Record<ItemType, string[]> = {
  agreement: ['Strongly disagree', 'Disagree', 'Not sure', 'Agree', 'Strongly agree'],
  frequency: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
  confidence: ['Not confident', 'Slightly', 'Moderately', 'Very', 'Completely']
};

export const applyRole = (text: string, role: RoleId | null): string => {
  const subject = role ? subjectLabel[role] : 'this learner';
  const learner = role === 'student' ? 'I' : role === 'parent' ? 'my child' : role === 'educator' ? 'my learners' : 'my team';
  const their = role === 'student' ? 'my' : 'their';
  const usageSubject =
    role === 'student'
      ? 'my learning or work'
      : role === 'parent'
        ? "my child's learning"
        : role === 'educator'
          ? "my learners' learning"
          : "my team's learning or work";
  return text
    .split('{subject}').join(subject)
    .split('{learner}').join(learner)
    .split('{their}').join(their)
    .split('{usageSubject}').join(usageSubject);
};

const scenarioOpts = [
  { t: '{learner} would let AI do most of the work and move on.', v: 1 },
  { t: '{learner} would use AI for a quick answer, then lightly check it.', v: 2 },
  { t: '{learner} would compare AI help with independent thinking.', v: 3 },
  { t: '{learner} would ask AI for feedback while keeping ownership.', v: 4 },
  { t: '{learner} would use AI to deepen understanding and test judgment.', v: 5 }
];

export const usageItem = {
  stem: 'How often is AI currently used in {usageSubject}?',
  opts: [
    { t: 'Almost never', v: 1 },
    { t: 'A few times a month', v: 2 },
    { t: 'Weekly', v: 3 },
    { t: 'Several times a week', v: 4 },
    { t: 'Daily or almost daily', v: 5 }
  ]
};

export const dimensions: Dimension[] = [
  {
    id: 'agency',
    n: 1,
    axis: 'resilience',
    title: 'Learning Agency',
    principle: 'The learner remains the author of the work.',
    brief: 'AI can support learning without taking over the learner effort that builds capacity.',
    critical: true,
    tip: { text: 'The strongest learning happens when assistance preserves effort, choice, and reflection.', src: 'Neogogy framework synthesis' },
    items: [
      { id: 'agency_1', stem: '{learner} can explain the answer without leaning on AI.', type: 'agreement', star: true },
      { id: 'agency_2', stem: '{learner} lets AI decide what the final answer should be.', type: 'frequency', reverse: true }
    ],
    scenario: { id: 'agency_s', claimItem: 'agency_1', stem: 'A hard task is due soon. What is most likely?', opts: scenarioOpts }
  },
  {
    id: 'attention',
    n: 2,
    axis: 'resilience',
    title: 'Attention Discipline',
    principle: 'Depth needs protected attention.',
    brief: 'AI works best when it supports concentration instead of fragmenting it.',
    tip: { text: 'Frequent context switching weakens comprehension and memory.', src: 'Cognitive load and attention research' },
    items: [
      { id: 'attention_1', stem: '{learner} can stay with a difficult idea before asking AI.', type: 'frequency' },
      { id: 'attention_2', stem: 'AI use pulls {learner} into faster but shallower work.', type: 'agreement', reverse: true }
    ],
    scenario: { id: 'attention_s', claimItem: 'attention_1', stem: 'A confusing concept appears. What happens first?', opts: scenarioOpts }
  },
  {
    id: 'judgment',
    n: 3,
    axis: 'resilience',
    title: 'Critical Judgment',
    principle: 'Trust is earned, not outsourced.',
    brief: 'Healthy AI use includes checking sources, assumptions, and reasoning.',
    critical: true,
    tip: { text: 'Learners need verification habits when fluent AI output sounds authoritative.', src: 'AI literacy research' },
    items: [
      { id: 'judgment_1', stem: '{learner} checks AI claims against evidence or prior knowledge.', type: 'frequency', star: true },
      { id: 'judgment_2', stem: 'If AI sounds confident, {learner} usually accepts it.', type: 'agreement', reverse: true }
    ],
    scenario: { id: 'judgment_s', claimItem: 'judgment_1', stem: 'AI gives a polished answer with no source. What is most likely?', opts: scenarioOpts }
  },
  {
    id: 'memory',
    n: 4,
    axis: 'resilience',
    title: 'Memory Formation',
    principle: 'The mind must still carry what matters.',
    brief: 'AI should not replace retrieval, practice, and durable understanding.',
    tip: { text: 'Retrieval practice and generation strengthen long-term learning.', src: 'Learning science consensus' },
    items: [
      { id: 'memory_1', stem: '{learner} practices recalling ideas without AI nearby.', type: 'frequency' },
      { id: 'memory_2', stem: '{learner} mostly recognizes good answers instead of producing them.', type: 'agreement', reverse: true }
    ],
    scenario: { id: 'memory_s', claimItem: 'memory_1', stem: 'A test or performance moment is coming. What preparation is most likely?', opts: scenarioOpts }
  },
  {
    id: 'integrity',
    n: 5,
    axis: 'resilience',
    title: 'Integrity And Ownership',
    principle: 'Assistance must remain honest.',
    brief: 'Formation requires truthful authorship and clear boundaries around help.',
    critical: true,
    tip: { text: 'Clear norms about AI assistance support both trust and learning.', src: 'Academic integrity guidance' },
    items: [
      { id: 'integrity_1', stem: '{learner} can say exactly what AI did and what remained human work.', type: 'confidence' },
      { id: 'integrity_2', stem: '{learner} hides AI help when the rules are unclear.', type: 'frequency', reverse: true }
    ],
    scenario: { id: 'integrity_s', claimItem: 'integrity_1', stem: 'AI helps improve an assignment. What is most likely?', opts: scenarioOpts }
  },
  {
    id: 'fluency',
    n: 6,
    axis: 'readiness',
    title: 'AI Fluency',
    principle: 'Skillful use is learned, not assumed.',
    brief: 'Future-ready learners know how to prompt, iterate, and evaluate AI use.',
    tip: { text: 'AI literacy includes knowing what to ask, when to ask, and how to judge the answer.', src: 'Digital and AI literacy frameworks' },
    items: [
      { id: 'fluency_1', stem: '{learner} can shape prompts to get useful, specific support.', type: 'confidence', star: true },
      { id: 'fluency_2', stem: '{learner} uses AI in the same simple way every time.', type: 'frequency', reverse: true }
    ],
    scenario: { id: 'fluency_s', claimItem: 'fluency_1', stem: 'The first AI answer is weak. What is most likely?', opts: scenarioOpts }
  },
  {
    id: 'transfer',
    n: 7,
    axis: 'readiness',
    title: 'Transfer To Real Tasks',
    principle: 'Learning must travel beyond the chat window.',
    brief: 'AI-supported learning matters when it improves unaided work and real performance.',
    tip: { text: 'Transfer grows when learners apply ideas in varied contexts.', src: 'Transfer of learning research' },
    items: [
      { id: 'transfer_1', stem: '{learner} can use what AI helped with in a new situation.', type: 'confidence' },
      { id: 'transfer_2', stem: 'Once AI is removed, {learner} cannot continue the work.', type: 'agreement', reverse: true }
    ],
    scenario: { id: 'transfer_s', claimItem: 'transfer_1', stem: 'The same idea appears in a different task. What is most likely?', opts: scenarioOpts }
  },
  {
    id: 'creation',
    n: 8,
    axis: 'readiness',
    title: 'Creative Leverage',
    principle: 'AI should widen imagination, not narrow it.',
    brief: 'Strong learners use AI to explore alternatives while keeping personal judgment alive.',
    tip: { text: 'Creativity improves when tools expand options and humans still make choices.', src: 'Human-AI creativity research' },
    items: [
      { id: 'creation_1', stem: '{learner} uses AI to generate several possible directions before choosing.', type: 'frequency' },
      { id: 'creation_2', stem: '{learner} usually accepts the first AI-generated idea.', type: 'frequency', reverse: true }
    ],
    scenario: { id: 'creation_s', claimItem: 'creation_1', stem: 'A creative task begins from a blank page. What is most likely?', opts: scenarioOpts }
  },
  {
    id: 'collaboration',
    n: 9,
    axis: 'readiness',
    title: 'Human Collaboration',
    principle: 'Technology should strengthen human exchange.',
    brief: 'AI should make discussion, feedback, and shared work richer, not lonelier.',
    tip: { text: 'Social learning and feedback remain central to durable growth.', src: 'Collaborative learning research' },
    items: [
      { id: 'collaboration_1', stem: '{learner} uses AI help to prepare for better human conversation.', type: 'frequency' },
      { id: 'collaboration_2', stem: 'AI replaces the need to ask people for feedback.', type: 'agreement', reverse: true }
    ],
    scenario: { id: 'collaboration_s', claimItem: 'collaboration_1', stem: 'Feedback is needed. What is most likely?', opts: scenarioOpts }
  },
  {
    id: 'adaptability',
    n: 10,
    axis: 'readiness',
    title: 'Adaptive Growth',
    principle: 'The learner keeps learning as tools change.',
    brief: 'Readiness means adjusting habits as AI, expectations, and contexts evolve.',
    tip: { text: 'Metacognition helps learners adapt strategies across changing environments.', src: 'Self-regulated learning research' },
    items: [
      { id: 'adaptability_1', stem: '{learner} reflects on whether AI habits are helping or harming over time.', type: 'frequency', star: true },
      { id: 'adaptability_2', stem: '{learner} keeps using AI the same way even when it stops helping.', type: 'frequency', reverse: true }
    ],
    scenario: { id: 'adaptability_s', claimItem: 'adaptability_1', stem: 'A familiar AI workflow starts producing weaker results. What is most likely?', opts: scenarioOpts }
  }
];

export const personas: Record<PersonaKey, Persona> = {
  guide: {
    name: 'The Guide',
    emoji: 'G',
    accent: '#2F6F62',
    quad: 'High resilience / high readiness',
    tagline: 'You are using AI with skill while keeping judgment, effort, and ownership intact.',
    portrait: 'The Guide is both protected and prepared: able to use AI well without becoming dependent on it.',
    looksLike: 'AI becomes a thinking partner, not a substitute. You can explain, verify, adapt, and help others use the tool wisely.',
    research: { text: 'High-support, high-agency environments produce stronger learning than either avoidance or automation.', src: 'Neogogy framework synthesis' },
    strengths: ['Strong independent judgment', 'Healthy AI fluency', 'Clear ownership of learning'],
    blindspots: ['Complacency after strong results', 'Assuming others have the same habits'],
    pull: 'The danger is not collapse, but comfort: letting a good pattern go unexamined as tools change.',
    moves: ['Teach one AI habit to someone else.', 'Schedule unaided practice after AI-supported work.', 'Review your prompts and outputs for hidden assumptions.'],
    nextstep: 'Keep moving outward. The Guide protects personal formation and helps the surrounding learning culture mature.',
    feed: 'Your profile is strong. Keep auditing the habits underneath it.'
  },
  anchor: {
    name: 'The Anchor',
    emoji: 'A',
    accent: '#85714E',
    quad: 'High resilience / low readiness',
    tagline: 'You are protected from many AI harms, but you may be underprepared for AI-shaped work.',
    portrait: 'The Anchor keeps independence and judgment, yet risks mistaking avoidance for readiness.',
    looksLike: 'You can think without AI, which is valuable. The next step is learning to use AI deliberately without surrendering that strength.',
    research: { text: 'Avoidance can preserve current strengths while delaying fluency needed in future contexts.', src: 'AI literacy and workforce readiness research' },
    strengths: ['Independent effort', 'Lower dependency risk', 'Stable judgment'],
    blindspots: ['Low practical fluency', 'Slow adaptation', 'False safety from non-use'],
    pull: 'The pull is toward staying safe by staying still.',
    moves: ['Practice one bounded AI workflow each week.', 'Use AI for feedback, then revise independently.', 'Compare AI output against your own first draft.'],
    nextstep: 'Build readiness without giving away resilience. Add small, deliberate AI practice to already strong habits.',
    feed: 'Your independence is an asset. Now turn it into future-ready fluency.'
  },
  sprinter: {
    name: 'The Sprinter',
    emoji: 'S',
    accent: '#9E1D20',
    quad: 'Low resilience / high readiness',
    tagline: 'You can move quickly with AI, but the underlying capacity may be thinning.',
    portrait: 'The Sprinter is capable and fast, yet risks outsourcing the very effort that forms understanding.',
    looksLike: 'Outputs improve, speed rises, and confidence grows, but unaided explanation and verification may lag behind.',
    research: { text: 'Unrestricted AI support can raise immediate performance while weakening later unaided performance.', src: 'Emerging AI tutoring and learning-transfer studies' },
    strengths: ['Practical AI skill', 'High experimentation', 'Fast production'],
    blindspots: ['Dependency risk', 'Shallow transfer', 'Overconfidence from polished output'],
    pull: 'The pull is speed: because the work gets easier, it feels healthier than it is.',
    moves: ['Do a no-AI recall pass after each AI session.', 'Verify one important AI claim before using it.', 'Write your own explanation before asking for improvement.'],
    nextstep: 'Protect the mind under the speed. Keep your fluency, but add friction where formation needs effort.',
    feed: 'You have capability. The work now is keeping that capability truly yours.'
  },
  wanderer: {
    name: 'The Wanderer',
    emoji: 'W',
    accent: '#7a6b5c',
    quad: 'Low resilience / low readiness',
    tagline: 'AI is not yet forming strong habits, but your profile has the most room to grow.',
    portrait: 'The Wanderer is still finding a stable way to learn with AI.',
    looksLike: 'AI use may be inconsistent, reactive, or unclear. The path forward starts with simple boundaries and one repeatable practice.',
    research: { text: 'Learners benefit from explicit routines, feedback, and reflection when new tools enter learning.', src: 'Self-regulated learning research' },
    strengths: ['Room for rapid improvement', 'Openness to new routines', 'A clear starting point'],
    blindspots: ['Unclear boundaries', 'Low fluency', 'Weak unaided practice'],
    pull: 'The pull is drift: using AI when pressure rises without a plan for learning.',
    moves: ['Choose one task where AI is allowed and one where it is not.', 'Ask AI for questions before answers.', 'End each session by writing what you can now do alone.'],
    nextstep: 'Start small and make the pattern visible. Formation begins when AI use becomes deliberate.',
    feed: 'This is a beginning profile, not a fixed identity. The next move can change the pattern.'
  }
};

export const evidence = [
  'AI can improve visible output while changing the kind of effort learners practice.',
  'Retrieval, explanation, verification, and transfer remain central to durable learning.',
  'AI literacy includes technical fluency, ethical boundaries, and critical judgment.',
  'Human feedback and social learning continue to matter in AI-supported education.',
  'The Neogogy framework treats AI use as a formation question, not only a productivity question.'
];

export const microInsights: Record<string, { strong: string; watch: string }> = {
  agency: { strong: 'Ownership is visible in how work is explained.', watch: 'Protect the learner role before AI becomes the author.' },
  attention: { strong: 'Attention can stay with difficulty long enough to learn.', watch: 'Slow the workflow down before speed becomes shallowness.' },
  judgment: { strong: 'Verification habits are already present.', watch: 'Treat polished AI output as a claim, not a conclusion.' },
  memory: { strong: 'Unaided recall is helping learning stick.', watch: 'Add retrieval practice so recognition becomes real memory.' },
  integrity: { strong: 'Boundaries around help are clear.', watch: 'Name AI assistance honestly and define what remains human.' },
  fluency: { strong: 'AI is being used with growing skill.', watch: 'Practice prompt iteration and output evaluation.' },
  transfer: { strong: 'Learning is traveling beyond the immediate answer.', watch: 'Test whether the work can continue without AI.' },
  creation: { strong: 'AI is expanding options without replacing choice.', watch: 'Generate alternatives before accepting the first answer.' },
  collaboration: { strong: 'AI support is feeding better human exchange.', watch: 'Keep people in the feedback loop.' },
  adaptability: { strong: 'Habits are being reviewed as tools change.', watch: 'Build a rhythm of reflection and adjustment.' }
};
