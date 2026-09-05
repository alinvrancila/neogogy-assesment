/**
 * The first step, derived from the constraint.
 *
 * The card at the top of the results page used to carry a fixed sentence,
 * "draft without assistance first", for everybody. It was handed to a person at
 * 89 and a person at 19, and to an AI-avoidant reader whose whole problem was
 * that they already draft without assistance. It was the first thing two
 * colleagues comparing reports would notice.
 *
 * Twenty entries: one per dimension, in each of the two directions a person can
 * be off the path. The constraint is already computed correctly for the plan
 * further down the page; this reads the same field.
 */

import type { ConstructId } from "./types";
import type { RiskLean } from "./display";

export interface FirstStep { title: string; body: string }

type Pair = { dependence: FirstStep; disconnection: FirstStep };

const STEPS: Record<ConstructId, Pair> = {
  agency: {
    dependence: {
      title: "Take one decision back.",
      body: "Pick one recurring decision you now make with AI in the room, and make the next one before you open it. Write your reasoning in two lines first, then let the tool argue with it.",
    },
    disconnection: {
      title: "Put one decision to the test.",
      body: "Take a decision you have already made and ask AI to argue the opposite case. You are not looking for a new answer, you are looking for the objection you had not considered.",
    },
  },
  verification: {
    dependence: {
      title: "Adopt a two source rule.",
      body: "For anything consequential, confirm it in one place the tool did not supply before you act on it. Start with the next thing that carries a number, a date or a name.",
    },
    disconnection: {
      title: "Check one thing on purpose.",
      body: "Ask AI something you already know the answer to, in your own field, and see exactly where it goes wrong. Knowing its failure shape is what verification is built on.",
    },
  },
  dependencySafety: {
    dependence: {
      title: "Do one task unaided this week.",
      body: "Choose something you would normally start with AI, do it without, and keep both versions. The gap between them is the reading you cannot get any other way.",
    },
    disconnection: {
      title: "Bring one task to the tool.",
      body: "Pick a task you already do well unaided and do it once with AI alongside you. You are protecting the capability by testing it, not replacing it.",
    },
  },
  fluency: {
    dependence: {
      title: "Learn what it is bad at.",
      body: "Spend twenty minutes finding the edge of the tool in your own work: the thing it is confidently wrong about. Fluency is knowing where the ground gives way.",
    },
    disconnection: {
      title: "Run one small experiment.",
      body: "Take one real task this week, not a demonstration, and work through it with AI end to end. One grounded attempt is worth more than a year of reading about it.",
    },
  },
  transfer: {
    dependence: {
      title: "Reconstruct one solution.",
      body: "The next time AI solves something for you, close it and rebuild the method in your own words. If you cannot, that is the finding, and it is worth knowing now.",
    },
    disconnection: {
      title: "Write down what you already know.",
      body: "Take one method you use well and write it out for somebody else. Making it explicit is what lets you carry it into unfamiliar ground, with or without a tool.",
    },
  },
  amplification: {
    dependence: {
      title: "Ask it to disagree with you.",
      body: "On your next real question, ask for the strongest case against your position before you ask for anything else. Use the tool to widen the thinking, not to finish it.",
    },
    disconnection: {
      title: "Use it on a hard problem, not an easy one.",
      body: "Bring AI to something genuinely difficult rather than something merely tedious. Amplification shows up on the problems where you were stuck, not the ones you were bored by.",
    },
  },
  skillGrowth: {
    dependence: {
      title: "Name one skill you are keeping.",
      body: "Choose a capability you are not willing to lose, and practise it unaided once a week. Deciding which skills to let go is legitimate; letting them go without deciding is not.",
    },
    disconnection: {
      title: "Push one skill past its edge.",
      body: "Take something you are competent at and use AI to attempt the version that is currently beyond you. Growth needs a harder problem, and the tool can hold the scaffolding.",
    },
  },
  adaptability: {
    dependence: {
      title: "Review one habit you never chose.",
      body: "Find one AI habit you have never examined, and ask what it is for. Most dependence is made of practices that were convenient once and were never revisited.",
    },
    disconnection: {
      title: "Re-examine a settled view.",
      body: "Your picture of what these tools do is probably a year old. Spend thirty minutes finding out what changed, then decide again rather than deciding once.",
    },
  },
  responsibleUse: {
    dependence: {
      title: "Write your line down.",
      body: "Decide, in one sentence, what you will never put into an AI tool. A rule you have written survives a deadline; a rule you merely hold does not.",
    },
    disconnection: {
      title: "Find out what is actually permitted.",
      body: "Check what your organisation, or the tool's own terms, allow for the information you handle. Caution built on a guess is fragile in both directions.",
    },
  },
  creativity: {
    dependence: {
      title: "Write yours before you read its.",
      body: "On the next piece that matters, put your own version down before you open the tool. Keep whatever is yours even when its version reads more smoothly.",
    },
    disconnection: {
      title: "Use it to widen, not to start.",
      body: "Take an idea that is already yours and ask AI for five ways it could be wrong or three directions it could go. The idea stays yours; the field around it gets larger.",
    },
  },
};

/**
 * The first step for this reading. A balanced profile takes the dependence
 * variant, because a person with no clear lean who is nonetheless held by a
 * constraint is nearly always being held by the protective half of it.
 */
export function firstStepFor(construct: ConstructId, lean: RiskLean): FirstStep {
  const pair = STEPS[construct];
  if (!pair) return STEPS.verification.dependence;
  return lean === "disconnection" ? pair.disconnection : pair.dependence;
}
