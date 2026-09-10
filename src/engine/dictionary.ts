/**
 * The canonical dimension dictionary.
 *
 * One definition per dimension, consumed by every component. Nothing invents
 * terminology locally, and nothing decides for itself which way a dimension
 * runs.
 *
 * It exists because the platform speaks three vocabularies at once. The same
 * construct is "Human Agency" to a student, "Owner Decision Ownership" to a
 * business owner and "Decision Ownership" to a professional, and the reversed
 * dimension carries three risk names on top of that. A group report that mixes
 * editions has to pick one language and be able to show a reader how it maps
 * back to the report on their own desk, which is what `aliasesFor` is for.
 *
 * It also exists because the group report shipped an inversion. The dimension
 * row printed "Independent Capability (lower is healthier)" over values where
 * higher was healthier, and drew the healthy end in the warning colour. Every
 * other calculation on that row read the values correctly, so only the label
 * and the paint were wrong, and 111 passing tests went straight through it
 * because one of them asserted the flag rather than the direction. Direction is
 * declared here once, as data, and `tests/humanAdvantage/dictionary.ts` fails
 * if any surface contradicts it.
 */

import { CONSTRUCTS, SCORING, STAGES } from './config';
import { CONSTRUCT_IDS, type ConstructId, type Persona } from './types';
import { constructName, reportedConstructName } from './display';

export type Cluster = 'judgment and protection' | 'capability that lasts' | 'fluency and growth';

/** Which way healthier runs on the values a report actually plots. */
export type HealthyDirection = 'higher' | 'lower';

export interface BandCopy {
  strength: string;
  developing: string;
  watch: string;
}

export interface DimensionEntry {
  canonicalId: ConstructId;
  /** The engine's own name. Small print on a card, and the appendix. */
  canonicalName: string;
  /** What the organisation report calls it in the body, everywhere. */
  executiveName: string;
  cluster: Cluster;
  whatItMeasures: string;
  businessMeaning: string;
  bandCopy: BandCopy;
  /**
   * The direction of the values this dictionary tells a report to plot, which
   * is always the canonical `score`. Every dimension is healthy-high on that
   * scale, including the reliance dimension: it is stored as Independent
   * Capability and only inverted for editions that choose to print a risk.
   */
  healthyDirection: HealthyDirection;
  thresholds: { watch: number; vulnerability: number; strength: number };
  /** Which stage transitions this dimension gates, and the reading each asks. */
  practiceGateRole: Array<{ stage: number; minimum: number }>;
  relatedCompositeIds: string[];
  /** Set on the three dimensions the exposure line reports. */
  exposureLabel?: string;
  /** Practice library id reached when this dimension is the constraint. */
  recommendedPractice: string;
}

/* ----------------------------------------------------------- the entries */

const CLUSTER: Record<ConstructId, Cluster> = {
  agency: 'judgment and protection',
  verification: 'judgment and protection',
  dependencySafety: 'judgment and protection',
  responsibleUse: 'judgment and protection',
  transfer: 'capability that lasts',
  skillGrowth: 'capability that lasts',
  fluency: 'fluency and growth',
  adaptability: 'fluency and growth',
  amplification: 'fluency and growth',
  creativity: 'fluency and growth',
};

const EXECUTIVE_NAME: Record<ConstructId, string> = {
  agency: 'Decision Ownership',
  verification: 'Checking Before You Act',
  dependencySafety: 'Independent Capability',
  fluency: 'Practical AI Fluency',
  transfer: 'What You Keep',
  amplification: 'Better Thinking, Not Only Faster',
  skillGrowth: 'Craft That Still Grows',
  adaptability: 'Deliberate Practice',
  responsibleUse: 'The Line You Hold',
  creativity: 'Your Own Voice',
};

const WHAT_IT_MEASURES: Record<ConstructId, string> = {
  agency: 'Whether your people stay the author of the work and the owner of the decision when AI is in the room.',
  verification: 'Whether AI-supplied claims get checked somewhere the tool did not supply, in proportion to what being wrong would cost.',
  dependencySafety: 'Whether your people could still do the work in the week the tool is unavailable.',
  fluency: 'Whether your people know from use where a tool is reliable and where it is confidently wrong.',
  transfer: 'Whether work done with help becomes capability your people keep.',
  amplification: 'Whether AI is widening how your people think, or only speeding up what they produce.',
  skillGrowth: 'Whether the underlying craft keeps developing while AI carries more of the output.',
  adaptability: 'Whether your people review their own habits on purpose as the tools change.',
  responsibleUse: 'Whether the line about other people’s information holds when holding it is inconvenient.',
  creativity: 'Whether what your people produce still sounds like your organisation.',
};

const BUSINESS_MEANING: Record<ConstructId, string> = {
  agency: 'When a decision is questioned later, someone in your organisation can explain why it was made. Where this is weak, accountability moves to a tool that cannot carry it.',
  verification: 'This is the capability standing between a confident wrong answer and a customer, a contract or your accounts.',
  dependencySafety: 'This is your continuity reading. It tells you how much of your output would survive a tool outage, a price change or a vendor disappearing.',
  fluency: 'This is whether AI is producing real leverage in your organisation or only activity. Fluency is learned from use, so it responds quickly to practice.',
  transfer: 'This is whether you are buying output or building capability. Where it is weak you are renting the same result again every time.',
  amplification: 'This separates a faster organisation from a better one. Speed without better thinking compounds mistakes as readily as it compounds work.',
  skillGrowth: 'This is your bench. Where it thins, you lose the people who can tell whether AI output is any good.',
  adaptability: 'Tools change faster than habits do. This reads whether your people revise their practice deliberately or drift with whatever the vendor ships.',
  responsibleUse: 'This is your exposure on confidential information and on honest dealing. It is the dimension a regulator, a client or a journalist would ask about.',
  creativity: 'This is whether your work still sounds like you. Where it is weak, your organisation produces what every competitor’s AI produces.',
};

const BAND_COPY: Record<ConstructId, BandCopy> = {
  agency: {
    strength: 'Your people hold the decision and can account for it.',
    developing: 'Ownership is real but uneven, and it thins under time pressure.',
    watch: 'Decisions are moving to the tool faster than the responsibility for them is.',
  },
  verification: {
    strength: 'Checking is routine and scaled to what is at stake.',
    developing: 'Some checking happens, but not yet at the level mature AI use needs.',
    watch: 'Confident output is being taken at face value.',
  },
  dependencySafety: {
    strength: 'The work would still get done without the tool.',
    developing: 'Some of the work would be slower or harder to reproduce unaided.',
    watch: 'A meaningful share of the output would be difficult to reproduce without the tool.',
  },
  fluency: {
    strength: 'Your people know from experience where these tools help and where they fail.',
    developing: 'Use is real but shallow, and the failure modes are not yet familiar.',
    watch: 'There is little practical experience to judge the tools by.',
  },
  transfer: {
    strength: 'Assisted work is becoming capability your people keep.',
    developing: 'Some of what is done with help is retained, and some is not.',
    watch: 'The same help is needed again each time, so nothing is accumulating.',
  },
  amplification: {
    strength: 'AI is improving the quality of thinking, not only the speed of output.',
    developing: 'The gains are mostly in speed, with some improvement in quality.',
    watch: 'AI is producing more work rather than better work.',
  },
  skillGrowth: {
    strength: 'The underlying craft is still developing alongside AI.',
    developing: 'Skills are holding rather than growing.',
    watch: 'The foundational capability is thinning behind the assisted output.',
  },
  adaptability: {
    strength: 'Habits are reviewed on purpose as the tools change.',
    developing: 'Practice updates occasionally, usually in reaction to something.',
    watch: 'Habits formed early are being carried unchanged into different tools.',
  },
  responsibleUse: {
    strength: 'The boundary on confidential information and honest use holds.',
    developing: 'The boundary is understood but not consistently applied.',
    watch: 'Confidential information and disclosure are being handled case by case.',
  },
  creativity: {
    strength: 'The work keeps a distinct voice.',
    developing: 'Some of the output is distinctive and some of it is generic.',
    watch: 'The output is drifting towards what any tool would produce.',
  },
};

const EXPOSURE_LABEL: Partial<Record<ConstructId, string>> = {
  responsibleUse: 'confidential information',
  verification: 'unverified claims',
  agency: 'delegated decisions',
};

const RELATED_COMPOSITES: Record<ConstructId, string[]> = {
  agency: ['judgment', 'augmentation', 'dependencyIndex'],
  verification: ['judgment', 'futureReadiness'],
  dependencySafety: ['capabilityTransfer', 'dependencyIndex'],
  fluency: ['futureReadiness', 'augmentation', 'underexposure'],
  transfer: ['capabilityTransfer', 'augmentation', 'futureReadiness'],
  amplification: ['augmentation', 'futureReadiness'],
  skillGrowth: ['capabilityTransfer'],
  adaptability: ['futureReadiness', 'underexposure'],
  responsibleUse: ['judgment'],
  creativity: [],
};

/** Kept in step with recommendations.ts BOTTLENECK_TAG. */
const PRACTICE: Record<ConstructId, string> = {
  fluency: 'underexposure_fluency', agency: 'authority_transfer', amplification: 'shallow_use',
  dependencySafety: 'independent_capability_low', verification: 'verification_low',
  skillGrowth: 'skill_erosion', creativity: 'creativity_homogenization',
  responsibleUse: 'privacy_risk', transfer: 'transfer_low', adaptability: 'workflow_stagnation',
};

const gateRoleOf = (id: ConstructId) => STAGES
  .filter((s) => s.gates && s.gates[id] !== undefined)
  .map((s) => ({ stage: s.stage, minimum: s.gates![id] as number }));

export const DIMENSIONS: Record<ConstructId, DimensionEntry> = Object.fromEntries(
  CONSTRUCT_IDS.map((id) => [id, {
    canonicalId: id,
    canonicalName: CONSTRUCTS[id].name,
    executiveName: EXECUTIVE_NAME[id],
    cluster: CLUSTER[id],
    whatItMeasures: WHAT_IT_MEASURES[id],
    businessMeaning: BUSINESS_MEANING[id],
    bandCopy: BAND_COPY[id],
    // Every dimension is plotted from the canonical score, which is healthy-high
    // by construction. There is no exception, and the reliance dimension is the
    // one that used to be treated as one.
    healthyDirection: 'higher' as HealthyDirection,
    thresholds: {
      watch: SCORING.microWatch,
      vulnerability: SCORING.vulnerabilityCeiling,
      strength: SCORING.strengthFloor,
    },
    practiceGateRole: gateRoleOf(id),
    relatedCompositeIds: RELATED_COMPOSITES[id],
    exposureLabel: EXPOSURE_LABEL[id],
    recommendedPractice: PRACTICE[id],
  } satisfies DimensionEntry]),
) as Record<ConstructId, DimensionEntry>;

/* ------------------------------------------------------------- composites */

export interface CompositeEntry {
  id: string;
  executiveName: string;
  question: string;
  healthyDirection: HealthyDirection;
  bandCopy: BandCopy;
}

export const COMPOSITES: CompositeEntry[] = [
  {
    id: 'futureReadiness', executiveName: 'Future readiness', healthyDirection: 'higher',
    question: 'Are your people equipped for how this work is going to change?',
    bandCopy: {
      strength: 'Your people are equipped for the direction this work is moving in.',
      developing: 'The foundations are there and the practice is not yet consistent.',
      watch: 'Your people are not yet equipped for how this work is changing.',
    },
  },
  {
    id: 'judgment', executiveName: 'Judgment', healthyDirection: 'higher',
    question: 'Can your people tell when the tool is wrong, and act on it?',
    bandCopy: {
      strength: 'Checking, ownership and restraint are working together.',
      developing: 'Judgment is present but does not yet hold under pressure.',
      watch: 'Output is being trusted at a level the checking does not support.',
    },
  },
  {
    id: 'augmentation', executiveName: 'Augmentation', healthyDirection: 'higher',
    question: 'Is AI making the work better, or only faster?',
    bandCopy: {
      strength: 'AI is improving the quality of the work, not only its speed.',
      developing: 'The gains are mixed between speed and quality.',
      watch: 'The gains are almost entirely in speed.',
    },
  },
  {
    id: 'capabilityTransfer', executiveName: 'Capability transfer', healthyDirection: 'higher',
    question: 'Is assisted work becoming capability your organisation keeps?',
    bandCopy: {
      strength: 'What is done with help is being retained.',
      developing: 'Some of it is retained and some of it is not.',
      watch: 'Little is being retained, so the same help is needed again each time.',
    },
  },
  {
    id: 'dependencyIndex', executiveName: 'How much depends on the tool', healthyDirection: 'lower',
    question: 'How much of the work would be hard to reproduce without AI?',
    bandCopy: {
      strength: 'Little of the work depends on the tool being there.',
      developing: 'A moderate share of the work would be harder without it.',
      watch: 'A large share of the work would be difficult to reproduce without it.',
    },
  },
  {
    id: 'underexposure', executiveName: 'How much practice is missing', healthyDirection: 'lower',
    question: 'How much real practice is missing from your people’s view of AI?',
    bandCopy: {
      strength: 'There is real practice behind how your people see these tools.',
      developing: 'Practice is uneven across your people.',
      watch: 'There is little real practice behind your people’s view of AI.',
    },
  },
];

export const compositeEntry = (id: string): CompositeEntry | undefined =>
  COMPOSITES.find((c) => c.id === id);

/* ---------------------------------------------------------------- lookups */

const EDITIONS: Persona[] = [
  'student', 'teacher', 'parent', 'administrator', 'business', 'pastor', 'professional',
];

/**
 * Every other name this dimension answers to, and which editions use it.
 *
 * Derived from the display layer rather than retyped, so a rename in one place
 * cannot leave the appendix describing a vocabulary the product stopped using.
 */
export function aliasesFor(id: ConstructId): Array<{ name: string; editions: Persona[] }> {
  const byName = new Map<string, Persona[]>();
  const note = (name: string, p: Persona) => byName.set(name, [...(byName.get(name) ?? []), p]);
  for (const p of EDITIONS) {
    note(constructName(p, id), p);
    const risk = reportedConstructName(p, id);
    if (risk !== constructName(p, id)) note(risk, p);
  }
  const exec = DIMENSIONS[id].executiveName;
  return [...byName.entries()]
    .filter(([name]) => name !== exec)
    .map(([name, editions]) => ({ name, editions }));
}

/** The band a canonical score sits in. Four classifications, not three. */
export function bandOf(score: number): 'strength' | 'developing' | 'watch' {
  if (score >= SCORING.strengthFloor) return 'strength';
  if (score >= SCORING.microWatch) return 'developing';
  return 'watch';
}

/** Independent of the band: at or below the line is vulnerable, in any band. */
export const isVulnerable = (score: number): boolean => score <= SCORING.vulnerabilityCeiling;

export const executiveName = (id: ConstructId): string => DIMENSIONS[id].executiveName;
