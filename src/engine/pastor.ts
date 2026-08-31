/**
 * Pastor and Preacher outputs that no other persona produces.
 *
 * The Dependence Check is a mirror, not a measure: it reads the dependence tags
 * carried by answers and the two unscored reflection prompts, and says in plain
 * words where prayer and the text sit in this preacher's preparation. It never
 * touches a score, a stage, or an archetype.
 *
 * The Formation Roadmap sequences the chosen practices into this week, this
 * month, and this season, each with the checkpoint that tells a preacher it has
 * actually happened.
 */

import type {
  DependenceCheck, FormationPhase, Item, Recommendation, Submission, UsageProfile,
} from "./types";

/** Dependence tags raised by a submission. Recorded, never scored. */
export function dependenceTags(items: Item[], sub: Submission): string[] {
  const out: string[] = [];
  for (const it of items) {
    const raw = sub.answers[it.id];
    if (raw === undefined) continue;
    for (const tag of it.dependenceTags?.[raw] ?? []) out.push(tag);
    const opt = it.options?.find((o) => o.value === raw);
    for (const tag of opt?.dependence ?? []) out.push(tag);
  }
  return out;
}

/**
 * Three readings, from the tags and the two reflection prompts. The prompts are
 * never stored; they arrive with the submission and leave with it.
 */
export function buildDependenceCheck(tags: string[], sub: Submission): DependenceCheck {
  const count = (t: string) => tags.filter((x) => x === t).length;
  const prayer = count("prayer_present") - count("prayer_absent");
  const order = count("text_first") - count("tool_first");

  // the two unscored prompts, when they were answered
  const prayerPrompt = sub.answers.reflect_prayer;   // 1 rarely .. 4 before the tool
  const unaidedPrompt = sub.answers.reflect_unaided; // 1 cannot remember .. 5 regular practice

  let score = prayer + order;
  if (prayerPrompt !== undefined) score += prayerPrompt >= 4 ? 2 : prayerPrompt <= 1 ? -2 : 0;
  if (unaidedPrompt !== undefined) score += unaidedPrompt >= 4 ? 2 : unaidedPrompt <= 2 ? -2 : 0;

  if (score >= 3) {
    return {
      level: "led",
      heading: "Prayer and the text lead your preparation",
      narrative: "Your answers are consistent with preparation that begins where you would want it to begin. Prayer is present in the work rather than around it, the text is opened before the tool, and you still prepare without any tool often enough to know you can. Nothing here needs fixing. It is worth naming so that you notice if it starts to change, because this is the kind of thing that shifts a little at a time in heavy seasons.",
    };
  }
  if (score >= -1) {
    return {
      level: "present",
      heading: "Prayer and the text are present, and the tool often leads",
      narrative: "Your answers suggest prayer and study are genuinely part of your preparation, and that the tool frequently gets there first. That order matters more than the amount of use: what shapes a preacher is what they wrestle with before help arrives. This is a small adjustment rather than an overhaul, and most preachers make it in a week or two.",
      practice: "For the next month, open the passage and pray before opening any tool. Write your own outline first, then bring the tool in for feedback.",
      resource: "Faith at Work: “I read first, think first, write first, and then use AI for feedback or clarification.”",
    };
  }
  return {
    level: "trailing",
    heading: "The tool leads, and prayer is hard to locate in the week",
    narrative: "Your answers suggest the tool is where preparation now begins, and that prayer and unaided study have become hard to place in the week. That is said without judgment: it is usually what a heavy season does to a good pastor, not a decision anyone made. It is also the reading most worth acting on, because everything else in this check sits downstream of it. One changed rhythm moves it, and it does not have to be dramatic.",
    practice: "Take one message this month and prepare it with the text, prayer, and no tool at all. Tell one person you are doing it, and tell them afterwards what you noticed.",
    resource: "Faith at Work, on the deliberate recovery of friction, and on limits that protect prayer.",
  };
}

/** This week, this month, this season. */
export function buildFormationRoadmap(
  recommendations: Array<Recommendation & { resource?: string }>,
  up: UsageProfile
): FormationPhase[] {
  const week: Recommendation[] = [];
  const month: Recommendation[] = [];
  const season: Recommendation[] = [];
  for (const rec of recommendations) {
    if (rec.priority === "immediate") week.push(rec);
    else if (rec.priority === "important") month.push(rec);
    else season.push(rec);
  }
  while (!month.length && week.length > 1) month.push(week.pop()!);
  while (!season.length && month.length > 1) season.push(month.pop()!);

  const phase = (title: string, window: string, note: string, items: Recommendation[]): FormationPhase => ({
    title, window, note,
    actions: items.map((r) => ({
      capability: r.capability, change: r.behaviorChange, practice: r.practice,
      checkpoint: r.evidenceOfProgress, resource: r.resource,
    })),
  });

  return [
    phase("Start here", "This week",
      "One thing, chosen because it changes the most for the least effort.", week),
    phase("Build the rhythm", "This month",
      "Practices that need a few repetitions before they feel like yours.", month),
    phase("Let it settle", "This season",
      up.intentionalSelectiveUse
        ? "Work that keeps a considered position current rather than inherited."
        : "The slower work, which is usually what holds when a heavy week comes.",
      season),
  ].filter((p) => p.actions.length > 0);
}
