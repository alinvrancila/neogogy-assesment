import type { Item } from "../engine/types";
import { claim, reverse, scenario } from "./shared";

const P = "student" as const;

export const STUDENT_ITEMS: Item[] = [
  // ---- AI Fluency ----------------------------------------------------------
  claim(P, "fluency",
    "When AI gives me a weak first answer, I know how to change my prompt, add context, or break the task apart until it becomes useful.",
    "confidence"),
  reverse(P, "fluency",
    "I use AI the same one-line way for every kind of task.",
    "frequency", "underexposure_fluency"),
  scenario(P, "fluency",
    "You need help with a hard assignment and the AI's first response misses the point.", [
      "I paste the assignment in again and take whatever comes back.",
      "I ask again in different words and use whichever answer sounds better.",
      "I add the actual instructions and one example, then compare the two answers.",
      "I break the task into parts, give context for each, and steer it step by step.",
      "I steer it step by step and also test the result against the rubric before using anything.",
    ], "underexposure_fluency",
    { effects: { 5: { verification: 6 } } }),

  // ---- Human Agency --------------------------------------------------------
  claim(P, "agency",
    "Even when AI helps, the final answer reflects decisions I made and can defend.",
    "agreement"),
  reverse(P, "agency",
    "I let AI decide what my final answer should be.",
    "frequency", "authority_transfer"),
  scenario(P, "agency",
    "An essay is due tomorrow, and AI has produced a full draft that reads better than what you had.", [
      "Submit it nearly as it is; it is better than mine.",
      "Change some wording so it sounds like me, then submit.",
      "Keep its structure but rewrite the arguments in my own words.",
      "Take its two best points, discard the rest, and finish from my own outline.",
      "Use it as a critic of my draft, then decide point by point what enters my essay.",
    ], "authority_transfer",
    { effects: { 1: { responsibleUse: -8 }, 2: { responsibleUse: -4 } } }),

  // ---- Cognitive Amplification --------------------------------------------
  claim(P, "amplification",
    "AI helps me see angles, objections, and connections I would have missed on my own.",
    "agreement"),
  reverse(P, "amplification",
    "After using AI I usually end up with the same ideas I started with, just written faster.",
    "agreement", "shallow_use"),
  scenario(P, "amplification",
    "You are stuck on a concept and the textbook explanation is not helping.", [
      "I ask AI for the answers to the homework built on that concept.",
      "I ask for a simple summary and move on once it sounds clear.",
      "I ask for an explanation, then ask for it a different way, until I actually understand it.",
      "I ask it to quiz me and to challenge my explanation of the concept.",
      "I explain the concept to the AI in my own words and have it attack the weak points.",
    ], "shallow_use",
    { effects: { 1: { dependencySafety: -6, agency: -4 }, 5: { transfer: 6 } } }),

  // ---- Independent Capability (dependency safety) --------------------------
  claim(P, "dependencySafety",
    "If AI disappeared tomorrow, I could still do my coursework at close to my current level.",
    "confidence"),
  reverse(P, "dependencySafety",
    "I open an AI tool before I have made any attempt of my own.",
    "frequency", "dependency_starting_tasks"),
  scenario(P, "dependencySafety",
    "In a proctored exam with no AI allowed, a problem appears just like the ones AI has been solving with you all term.", [
      "I would probably freeze, because I have not solved one without help in a while.",
      "I would recognize the type but struggle through the steps.",
      "I could work through it, more slowly than I would with AI.",
      "I could solve it; my practice with AI has included practice without it.",
      "I could solve it and explain each step, because I always re-derive what AI shows me.",
    ], "independent_capability_low",
    { effects: { 5: { transfer: 6 } } }),

  // ---- Verification --------------------------------------------------------
  claim(P, "verification",
    "Before an AI claim goes into my work, I check it against the textbook, a source, or my own calculation.",
    "frequency"),
  reverse(P, "verification",
    "If an AI answer sounds confident and well written, that is usually enough for me.",
    "agreement", "uncritical_acceptance"),
  scenario(P, "verification",
    "AI gives you a polished answer with two citations for a graded research task.", [
      "I use it; citations mean it is sourced.",
      "I skim it for anything that sounds off, then use it.",
      "I spot-check one citation before using the rest.",
      "I open both citations and keep only the claims I can actually see in them.",
      "I verify the citations, then cross-check the key claim in a source the AI did not give me.",
    ], "verification_low"),

  // ---- Skill Growth --------------------------------------------------------
  claim(P, "skillGrowth",
    "Since using AI, my own writing and problem-solving have become stronger, not just my grades.",
    "agreement"),
  reverse(P, "skillGrowth",
    "There are skills I used to have that feel weaker now because AI handles them.",
    "agreement", "skill_erosion"),
  scenario(P, "skillGrowth",
    "Your teacher announces that the next unit will be completed with no AI tools at all.", [
      "That worries me; my recent work does not reflect what I can do alone.",
      "I would need a lot of review time to reach the standard of the work I have been handing in.",
      "My grades might dip, but the basics are there.",
      "Fine by me; I practice the fundamentals even when AI could do them for me.",
      "I would welcome it; I use AI to train the skill, so unaided work is where the gains show.",
    ], "skill_erosion"),

  // ---- Creative Leverage ---------------------------------------------------
  claim(P, "creativity",
    "I generate my own ideas first and use AI to push past them, not to replace them.",
    "frequency"),
  reverse(P, "creativity",
    "For creative work, I usually accept the first idea AI gives me.",
    "frequency", "creativity_homogenization"),
  scenario(P, "creativity",
    "A creative project starts from a blank page.", [
      "I ask AI for a finished concept and run with it.",
      "I ask for ten ideas and pick the one I like most.",
      "I sketch my own idea first, then ask AI for variations on it.",
      "I draft my concept fully, then use AI to find its clichés and weak spots.",
      "I go back and forth with it: my idea, then its response, then my revision, until we reach something neither of us started with.",
    ], "creativity_homogenization"),

  // ---- Responsible Use -----------------------------------------------------
  claim(P, "responsibleUse",
    "For any assignment, I can say exactly what AI did and what was mine, and I would be comfortable if my teacher saw the whole chat.",
    "confidence"),
  reverse(P, "responsibleUse",
    "When the AI rules for an assignment are unclear, I use it anyway and keep quiet about it.",
    "frequency", "disclosure_risk"),
  scenario(P, "responsibleUse",
    "A group member drops AI-written text into your shared project without telling the teacher, and your name is on it.", [
      "I say nothing; it is their section.",
      "I quietly rewrite the worst parts so it is less obvious.",
      "I ask the group whether we are all actually okay with this.",
      "I push the group to disclose it or rewrite it properly.",
      "I raise it with the group and, if it stays unresolved, tell the teacher how the work was made.",
    ], "disclosure_risk"),

  // ---- Learning Transfer ---------------------------------------------------
  claim(P, "transfer",
    "When AI helps me learn something, I can use it later on a new problem without AI.",
    "confidence"),
  reverse(P, "transfer",
    "Once the AI chat is closed, I cannot continue the work at the same level.",
    "agreement", "transfer_low"),
  scenario(P, "transfer",
    "Yesterday AI helped you work through a hard problem step by step. Today in class you are given a different problem that uses the same method.", [
      "I would need AI again, starting from the beginning.",
      "I remember yesterday's answer, but not how it was worked out.",
      "I can start the steps, but I get stuck partway through.",
      "I can solve it on my own, because I learned the method yesterday.",
      "I can solve it and explain the method to a classmate.",
    ], "transfer_low"),

  // ---- Adaptive Growth -----------------------------------------------------
  claim(P, "adaptability",
    "I regularly step back and ask whether my AI habits are helping my learning or hurting it.",
    "frequency"),
  reverse(P, "adaptability",
    "I keep using AI the same way even when it has stopped helping.",
    "frequency", "workflow_stagnation"),
  scenario(P, "adaptability",
    "A new AI tool appears that your school starts using.", [
      "I avoid it until I am forced to use it.",
      "I wait for someone to show me exactly what to click.",
      "I poke around and learn what I need.",
      "I test it against my current tool on a real task.",
      "I test it, keep whichever wins, and deliberately update my routine.",
    ], "workflow_stagnation"),
];
