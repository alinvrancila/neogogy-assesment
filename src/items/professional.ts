import type { Item } from "../engine/types";
import { claim, reverse, scenario } from "./shared";

/**
 * The Professional set.
 *
 * The catch-all: anyone whose work is not a classroom, a congregation, a
 * household or a business they own. It asks about the AI in a working life and
 * the AI in the rest of it, because for most people those are the same tools an
 * hour apart, and a set that only asked about the office would miss half of
 * what is forming them.
 *
 * Ten constructs, one claim, one reverse item and one real situation each, on
 * the same scoring, the same gates and the same route as every other set.
 * Nothing here is specific to a sector, a rank or a qualification.
 */

const P = "professional" as const;

export const PROFESSIONAL_ITEMS: Item[] = [
  claim(P, "fluency",
    "I use AI hands-on in my own work, and I know what it is good at and where it falls over.",
    "confidence"),
  reverse(P, "fluency",
    "I have opinions about AI that are far ahead of any real experience of using it.",
    "agreement", "underexposure_fluency"),
  scenario(P, "fluency",
    "A task lands that you have never done before and the deadline is tomorrow.", [
      "I avoid AI and work it out the long way, whatever that costs.",
      "I ask AI for the answer and use what comes back.",
      "I ask AI to explain the shape of the task, then do it myself with that map.",
      "I do that, and check the map against one source the tool did not give me.",
      "I do that, and keep a short note of what I learned so the next one is unaided.",
    ], "underexposure_fluency",
    { effects: { 5: { transfer: 6 } } }),

  claim(P, "agency",
    "AI informs what I do; the decision and the responsibility for it stay with me.",
    "agreement"),
  reverse(P, "agency",
    "I go along with what AI suggests even when something about it does not sit right.",
    "frequency", "authority_transfer"),
  scenario(P, "agency",
    "AI drafts a message that settles something contested with a colleague or a family member.", [
      "I send it. It says it better than I would have.",
      "I change a few words and send it.",
      "I use its structure but write the substance in my own words.",
      "I do that, and cut anything I would not defend if I were asked about it later.",
      "I do that, and ask myself first whether this is a message I should be writing rather than drafting.",
    ], "authority_transfer",
    { effects: { 1: { responsibleUse: -6 } } }),

  claim(P, "amplification",
    "AI makes my thinking better, not only my output faster: I see angles I would have missed.",
    "agreement"),
  reverse(P, "amplification",
    "AI produces more for me, but what I actually think has not changed because of it.",
    "agreement", "shallow_use"),
  scenario(P, "amplification",
    "You are weighing a decision that matters, at work or at home, with real trade-offs.", [
      "I do not involve AI in decisions like that.",
      "I ask it what it would do and weigh that heavily.",
      "I ask it to lay out the options and the trade-offs, then decide myself.",
      "I do that, and ask it to argue against the option I am leaning towards.",
      "I do that, and write my own reasoning down before I read its version of it.",
    ], "shallow_use",
    { effects: { 5: { agency: 5 } } }),

  claim(P, "dependencySafety",
    "If every AI tool disappeared tomorrow, I could still do the core of my work.",
    "confidence"),
  reverse(P, "dependencySafety",
    "There are tasks I now start by opening AI because I no longer know how to begin without it.",
    "agreement", "dependency_starting_tasks"),
  scenario(P, "dependencySafety",
    "Your usual AI tool is down for a week and there is no substitute.", [
      "The work stops or slips badly. There is no version of it without the tool.",
      "I get through it, much slower, and the quality drops.",
      "I get through it at close to normal quality, slower.",
      "I get through it at normal quality; the tool saves me time rather than carrying me.",
      "I get through it, and notice which habits had quietly become dependencies.",
    ], "independent_capability_low"),

  claim(P, "verification",
    "Before I act on something AI told me, I check it somewhere the tool did not supply.",
    "frequency"),
  reverse(P, "verification",
    "If an AI answer sounds right and is well written, I usually take it as read.",
    "agreement", "uncritical_acceptance"),
  scenario(P, "verification",
    "AI gives you a confident figure, a date or a rule that you are about to rely on.", [
      "I use it. It is usually right.",
      "I skim it for anything that looks obviously wrong.",
      "I check it against one independent source before I use it.",
      "I do that, and check twice when the cost of being wrong is high.",
      "I do that, and I can tell you which claims I checked and which I did not.",
    ], "verification_low",
    { effects: { 1: { responsibleUse: -8 }, 2: { responsibleUse: -4 } } }),

  claim(P, "skillGrowth",
    "I am better at my work than I was a year ago, in ways that would show without AI.",
    "agreement"),
  reverse(P, "skillGrowth",
    "My output has improved but the underlying skill has not moved with it.",
    "agreement", "skill_erosion"),
  scenario(P, "skillGrowth",
    "A skill you used to be good at is now something AI does for you every time.", [
      "I have not thought about it. The tool does it, so I do not.",
      "I have noticed the skill fading and accepted it.",
      "I keep my hand in occasionally so it does not go entirely.",
      "I practise it deliberately, unaided, on a schedule I actually keep.",
      "I do that, and I have decided which skills I am willing to let go and which I am not.",
    ], "skill_erosion"),

  claim(P, "creativity",
    "What I make with AI still sounds like me rather than like everything else it produces.",
    "agreement"),
  reverse(P, "creativity",
    "My work has flattened towards a standard AI style and I have stopped noticing.",
    "agreement", "creativity_homogenization"),
  scenario(P, "creativity",
    "You need an idea, not a document: a way through something that has no template.", [
      "I ask AI for ideas and pick from its list.",
      "I ask AI for ideas and adapt the best one.",
      "I write down my own ideas first, then ask AI to widen the field.",
      "I do that, and use it to attack my ideas rather than to replace them.",
      "I do that, and keep the ideas that are mine even when its version is smoother.",
    ], "creativity_homogenization",
    { effects: { 3: { agency: 4 }, 4: { agency: 5 } } }),

  claim(P, "responsibleUse",
    "I know what I will and will not put into an AI tool, and I hold that line under pressure.",
    "confidence"),
  reverse(P, "responsibleUse",
    "I have pasted something into AI that I would not want the person it concerns to know about.",
    "frequency", "privacy_risk"),
  scenario(P, "responsibleUse",
    "The fastest way to solve a problem involves pasting in something confidential about someone else.", [
      "I paste it. It saves real time and nothing has ever gone wrong.",
      "I paste it and take the name off.",
      "I remove enough that the person could not be identified, and check that I have.",
      "I use a tool approved for that kind of information, or I do it without AI.",
      "I do that, and I could explain my rule to the person concerned without embarrassment.",
    ], "privacy_risk",
    { effects: { 1: { agency: -6 } } }),

  claim(P, "transfer",
    "What I learn with AI stays with me: I could do it again later without the tool.",
    "agreement"),
  reverse(P, "transfer",
    "I have solved things with AI that I could not solve again a week later.",
    "frequency", "transfer_low"),
  scenario(P, "transfer",
    "AI walks you through something new and it works first time.", [
      "I move on. It worked, and that is what mattered.",
      "I save the answer in case it comes up again.",
      "I read back through it so I understand why it worked.",
      "I close the tool and reconstruct the method in my own words.",
      "I do that, and do the next one of its kind unaided to see whether it stuck.",
    ], "transfer_low",
    { effects: { 4: { skillGrowth: 5 }, 5: { skillGrowth: 6 } } }),

  claim(P, "adaptability",
    "I review how I use AI and change it deliberately rather than drifting with whatever is new.",
    "agreement"),
  reverse(P, "adaptability",
    "I use AI the same way I did when I started, out of habit rather than choice.",
    "agreement", "workflow_stagnation"),
  scenario(P, "adaptability",
    "The tools change again and something you relied on now behaves differently.", [
      "I carry on as before until it breaks properly.",
      "I adjust when I have to, not before.",
      "I test what changed on a task that does not matter, then adapt.",
      "I do that, and re-check the work I had trusted to the old behaviour.",
      "I do that, and treat reviewing my own habits as a standing part of the work.",
    ], "workflow_stagnation"),
];
