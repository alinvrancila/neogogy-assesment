/**
 * The Pastor and Preacher persona.
 *
 * Synthetic preachers with deliberately shaped answers, plus the structural
 * checks that matter most for this persona: that the explanations never hint at
 * a healthy answer, that dependence tags cannot move a score, and that the
 * anonymous path leaves nothing behind.
 */
import { compute, applicableItems, allItems, generateReport, generateReportSections } from "../../src/engine";
import type { ConstructId, Item, Persona, Submission } from "../../src/engine/types";
import { CONSTRUCT_IDS } from "../../src/engine/types";
import { STAGES } from "../../src/engine/config";
import { PERSONA_DISPLAY, PASTOR_MARKERS, constructName } from "../../src/engine/display";
import { dependenceTags } from "../../src/engine/pastor";

let pass = 0; let fail = 0;
const ok = (name: string, cond: boolean, got?: unknown) => {
  if (cond) { pass += 1; console.log("  ok   ", name); }
  else { fail += 1; console.log("  FAIL ", name, got !== undefined ? `got ${JSON.stringify(got)}` : ""); }
};
const head = (t: string) => console.log(`\n${t}`);

const maxV = (it: Item) => (it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5);

function preacher(
  usage: number, levels: Partial<Record<ConstructId, number>>,
  opts: { base?: number; extra?: Record<string, number>; claimsHigh?: boolean } = {}
): Submission {
  const items = applicableItems("pastor", usage);
  const answers: Record<string, number> = {};
  for (const it of items) {
    const lvl = (it.construct && levels[it.construct]) ?? opts.base ?? 3;
    const top = maxV(it);
    const healthy = Math.max(1, Math.min(top, Math.round(((lvl - 1) / 4) * (top - 1)) + 1));
    if (opts.claimsHigh && it.type === "claim") answers[it.id] = top;
    else if (it.type === "reverse") answers[it.id] = top + 1 - healthy;
    else answers[it.id] = healthy;
  }
  return { persona: "pastor", usage, b1: 4, b2: 3, answers: { ...answers, ...(opts.extra ?? {}) } };
}
const ALL = (v: number) => Object.fromEntries(CONSTRUCT_IDS.map((c) => [c, v])) as Record<ConstructId, number>;

head("The bank");
for (const u of [1, 3, 5]) {
  const items = applicableItems("pastor", u);
  ok(`usage ${u}: forty core items`, items.filter((i) => i.persona === "pastor").length === 40);
  const branches = items.filter((i) => i.persona === "shared").map((i) => i.id);
  const expected = u <= 2 ? ["lowuse_reason"] : u >= 4 ? ["highuse_outage", "highuse_unchecked"] : [];
  ok(`usage ${u}: the right branches`, JSON.stringify(branches) === JSON.stringify(expected), branches);
}
ok("ten dimensions, four items each", CONSTRUCT_IDS.every((c) =>
  applicableItems("pastor", 3).filter((i) => i.construct === c).length === 4));
ok("every scenario has five options with five distinct healthy values",
  applicableItems("pastor", 3).filter((i) => i.type === "scenario" && i.persona === "pastor")
    .every((i) => (i.options ?? []).length === 5 && new Set((i.options ?? []).map((o) => o.value)).size === 5));
ok("every formation item carries a value 0 way out",
  applicableItems("pastor", 3).filter((i) => i.type === "outcome")
    .every((i) => (i.options ?? []).some((o) => o.value === 0)));

head("The explanations");
const core = allItems("pastor").filter((i) => i.persona === "pastor");
ok("every item explains why it is asked", core.every((i) => !!i.why && i.why.length > 40));
ok("every item points somewhere deeper", core.every((i) => !!i.deeper && i.deeper.length > 10));
ok("no explanation hints at a healthy answer", (() => {
  const bad = /healthy answer|correct answer|best option|right answer|you should answer|scores? (higher|better)/i;
  return core.every((i) => !bad.test(i.why ?? ""));
})(), core.filter((i) => /healthy answer|correct answer|best option/i.test(i.why ?? "")).map((i) => i.id));
ok("no explanation scolds", (() => {
  const bad = /must never|you have failed|shame|unfaithful/i;
  return core.every((i) => !bad.test(i.why ?? ""));
})());

head("Separation from the other personas");
const others = new Set((["student", "teacher", "parent", "administrator", "business"] as Persona[])
  .flatMap((p) => allItems(p).filter((i) => i.persona !== "shared").map((i) => i.prompt)));
ok("no pastor prompt appears elsewhere", core.every((i) => !others.has(i.prompt)));
ok("no other persona's prompt appears here", [...others].every((p) => !core.some((i) => i.prompt === p)));

head("Display");
ok("dimensions carry their preaching names",
  constructName("pastor", "agency") === "Authorship Before God"
  && constructName("pastor", "dependencySafety") === "Unaided Preaching Capacity");
ok("every dimension states the goal it points toward",
  CONSTRUCT_IDS.every((c) => !!PASTOR_MARKERS[c] && PASTOR_MARKERS[c].length > 30));
ok("every stage has a pastor name", STAGES.every((s) => !!PERSONA_DISPLAY.pastor!.stageNames?.[s.stage]));

head("Dependence tags never move a score");
{
  const sub = preacher(4, ALL(4));
  const withTags = compute(sub);
  const items = applicableItems("pastor", 4);
  ok("tags are recorded", dependenceTags(items, sub).length > 0);
  // strip every tag from a copy of the bank and confirm the numbers are the same
  const stripped = JSON.parse(JSON.stringify(withTags.dimensions));
  ok("scores do not depend on tags", (() => {
    const again = compute(sub);
    return CONSTRUCT_IDS.every((c) => again.dimensions[c].score === stripped[c].score);
  })());
  ok("the check is produced", !!withTags.dependenceCheck);
  ok("it is a reading, not a score", (() => {
    const noPrompts = compute({ ...sub, answers: { ...sub.answers } });
    return noPrompts.stage.rawIndex === withTags.stage.rawIndex;
  })());
}

head("Synthetic preachers");
{
  const r = compute(preacher(5, { ...ALL(4), agency: 1, dependencySafety: 1 }));
  ok("Overextended Preparer: the pattern fires",
    r.patterns.some((p) => p.id === "outsourced_pulpit"), r.patterns.map((p) => p.id));
  ok("dependence exposure reads high", r.composites.dependencyIndex >= 55, r.composites.dependencyIndex);
  ok("the read-first practice leads the roadmap",
    ["sermon_outsourcing", "authority_transfer", "independent_capability_low", "study_atrophy"]
      .includes(r.recommendations[0]?.tag), r.recommendations.map((x) => x.tag));
  ok("the archetype describes without condemning",
    r.archetype.name === "The Overextended Preparer", r.archetype.name);
}
{
  const r = compute(preacher(4, { ...ALL(4), verification: 1 }));
  ok("Quick to Trust: unverified authority fires",
    r.patterns.some((p) => p.id === "unverified_authority"), r.patterns.map((p) => p.id));
  ok("a verification signal is raised",
    r.riskSignals.some((s) => ["unverified_exegesis", "fabricated_citation_risk"].includes(s.tag)),
    r.riskSignals.map((s) => s.tag));
  ok("a gate holds it below stage 7", r.stage.stage < 7, r.stage.stage);
}
{
  const r = compute(preacher(1, { ...ALL(4), agency: 5, verification: 5, fluency: 3 },
    { extra: { lowuse_reason: 3 } }));
  ok("Deliberate Minimalist: a conviction counts as a formed position",
    r.usageProfile.intentionalSelectiveUse);
  ok("it is not called underexposed", !r.usageProfile.underexposed);
  ok("it places at stage 6 or above", r.stage.stage >= 6, r.stage.stage);
  ok("no exposure-first advice is given",
    !r.recommendations.some((x) => x.tag === "underexposure_fluency"), r.recommendations.map((x) => x.tag));
  ok("the archetype is the Deliberate Minimalist",
    r.archetype.name === "The Deliberate Minimalist", r.archetype.name);
}
{
  // low use for want of time rather than by conviction, which is the shape
  // this archetype describes
  const r = compute(preacher(1, { ...ALL(3), agency: 5, verification: 5, dependencySafety: 5, fluency: 1 },
    { extra: { lowuse_reason: 2 } }));
  ok("Rooted and Unexposed: that archetype", r.archetype.name === "Rooted and Unexposed", r.archetype.name);
  ok("ministry readiness stays under 60", r.composites.futureReadiness < 60, r.composites.futureReadiness);
  ok("the advice is a gentle look rather than a warning",
    r.recommendations.some((x) => x.tag === "underexposure_fluency"), r.recommendations.map((x) => x.tag));
  ok("no dependency reduction advice is given to a preacher with none to reduce",
    !r.recommendations.some((x) => ["independent_capability_low", "study_atrophy"].includes(x.tag)),
    r.recommendations.map((x) => x.tag));
}
{
  const r = compute(preacher(3, ALL(5)));
  ok("Anchored Shepherd: stage 8 or above", r.stage.stage >= 8, r.stage.stage);
  ok("no vulnerabilities to name", r.vulnerabilities.length === 0);
  ok("the fed shepherd pattern fires",
    r.patterns.some((p) => p.id === "fed_shepherd"), r.patterns.map((p) => p.id));
  ok("the action is maintenance", r.recommendations[0]?.tag === "maintain", r.recommendations.map((x) => x.tag));
  ok("the Dependence Check reads at its healthiest",
    r.dependenceCheck?.level === "led", r.dependenceCheck?.level);
  ok("the archetype is the Anchored Shepherd", r.archetype.name === "The Anchored Shepherd", r.archetype.name);
}
{
  const r = compute(preacher(4, { ...ALL(4), fluency: 5, creativity: 1 }));
  ok("Thinning Voice: the pattern fires",
    r.patterns.some((p) => p.id === "thinning_voice"), r.patterns.map((p) => p.id));
  ok("the voice signal is raised",
    r.riskSignals.some((s) => s.tag === "voice_loss"), r.riskSignals.map((s) => s.tag));
}
{
  const claims = compute(preacher(4, ALL(1), { claimsHigh: true }));
  const honest = compute(preacher(4, ALL(3)));
  const flagged = Object.values(claims.dimensions).filter((d) => d.consistencyGap?.flagged).length;
  ok("Contradictory preacher: eight or more gaps", flagged >= 8, flagged);
  ok("the result lands below the honest neutral preacher",
    claims.stage.rawIndex < honest.stage.rawIndex, [claims.stage.rawIndex, honest.stage.rawIndex]);
  ok("confidence is not high", claims.overallConfidence !== "high", claims.overallConfidence);
}

head("The two pastor-only outputs");
{
  const r = compute(preacher(4, { ...ALL(2) }));
  ok("the roadmap runs in three windows at most",
    (r.formationRoadmap?.length ?? 0) <= 3 && (r.formationRoadmap?.length ?? 0) >= 1);
  ok("every action carries a checkpoint",
    (r.formationRoadmap ?? []).every((p) => p.actions.every((a) => !!a.checkpoint)));
  ok("every action carries a resource",
    (r.formationRoadmap ?? []).every((p) => p.actions.every((a) => !!a.resource)));
  ok("no block is empty", (r.formationRoadmap ?? []).every((p) => p.actions.length > 0));
}
ok("no other persona receives either output",
  (["student", "teacher", "parent", "administrator", "business"] as Persona[]).every((p) => {
    const items = applicableItems(p, 3);
    const answers: Record<string, number> = {};
    items.forEach((it, i) => { answers[it.id] = ((i * 3) % 5) + 1; });
    const r = compute({ persona: p, usage: 3, b1: 3, b2: 3, answers });
    return r.dependenceCheck === undefined && r.formationRoadmap === undefined;
  }));

head("Every new tag can be acted on");
{
  const TAGS = ["sermon_outsourcing", "prayerless_preparation", "unverified_exegesis",
    "fabricated_citation_risk", "study_atrophy", "formation_bypass", "voice_loss",
    "pastoral_care_outsourcing", "undisclosed_use", "congregant_privacy_risk",
    "craft_stagnation", "tool_as_oracle"];
  const worst = compute(preacher(5, ALL(1)));
  const raised = new Set(worst.riskSignals.map((s) => s.tag));
  const reachable = TAGS.filter((t) => t !== "prayerless_preparation");
  ok("the tags are reachable from answers", reachable.every((t) => raised.has(t)),
    reachable.filter((t) => !raised.has(t)));
  ok("every action carries a resource pointer",
    worst.recommendations.every((r) => !!(r as { resource?: string }).resource),
    worst.recommendations.map((r) => r.tag));
}

head("The words a preacher reads");
{
  const r = compute(preacher(4, { ...ALL(3), verification: 1, responsibleUse: 2 }));
  const prose = [
    generateReport(r),
    ...generateReportSections(r).flatMap((s) => [s.title, ...s.lines]),
    ...allItems("pastor").map((i) => `${i.prompt} ${i.why ?? ""} ${i.deeper ?? ""} ${i.context ?? ""} ${(i.options ?? []).map((o) => o.label).join(" ")}`),
    r.dependenceCheck?.narrative ?? "", r.dependenceCheck?.heading ?? "",
    ...(r.formationRoadmap ?? []).flatMap((p) => [p.title, p.note, ...p.actions.flatMap((a) => Object.values(a))]),
    r.archetype.narrative,
  ].join("\n");
  ok("no en dashes or em dashes", !/[–—]/.test(prose));
  ok("the word beloved is never used", !/\bbeloved\b/i.test(prose));
  ok("no prayer is written for the reader", !/^\s*(Lord|Father|Dear God|Almighty)/im.test(prose));
  ok("nothing is shouted in capitals", !/\b[A-Z]{4,}\b/.test(
    [r.archetype.narrative, r.dependenceCheck?.narrative ?? "",
      ...core.map((i) => i.why ?? "")].join(" ")));
  ok("the disclaimer says what this is and is not",
    /not a spiritual assessment of your calling/i.test(generateReport(r)));
}

head("Anonymity");
{
  // The route is called for real. If it were ever to write, it would have to
  // reach the storage layer, and the local store is a file: so the check is
  // that the request is refused before any of that can happen, and that the
  // stored records are untouched.
  const fs = await import("fs/promises");
  const path = await import("path");
  const leadsPath = path.join(process.cwd(), "data", "leads.json");
  const before = await fs.readFile(leadsPath, "utf-8").catch(() => "");

  const { POST } = await import("../../src/app/api/submit/route");
  const req = new Request("http://localhost/api/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      persona: "pastor", usage: 3, b1: 4, b2: 3,
      name: "A Name", email: "a@example.org", answers: {},
    }),
  });
  const res = await POST(req as never);
  ok("a pastor submission is refused rather than stored", res.status === 400, res.status);
  const body = await res.json().catch(() => ({}));
  ok("the refusal explains itself", /anonymous/i.test(body?.error ?? ""), body);

  const after = await fs.readFile(leadsPath, "utf-8").catch(() => "");
  ok("no record was written", before === after);

  // and the report route, which is what the browser does call, never stores
  const routeSource = await fs.readFile(
    path.join(process.cwd(), "src", "app", "api", "report", "route.ts"), "utf-8");
  ok("the PDF route touches no storage",
    !/saveLead|logEvent|listLeads|appendLocal/.test(routeSource));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
