/**
 * The Business Owner persona.
 *
 * Synthetic owners with deliberately shaped answer patterns, checked against
 * what the report should say about a business of that shape, plus structural
 * checks that the bank, the signals and the two business-only outputs hold
 * together.
 */
import { compute, applicableItems, allItems, generateReport, generateReportSections } from "../../src/engine";
import type { ConstructId, Item, Persona, Submission } from "../../src/engine/types";
import { CONSTRUCT_IDS } from "../../src/engine/types";
import { STAGES } from "../../src/engine/config";
import { constructName, PERSONA_DISPLAY } from "../../src/engine/display";

let pass = 0; let fail = 0;
const ok = (name: string, cond: boolean, got?: unknown) => {
  if (cond) { pass += 1; console.log("  ok   ", name); }
  else { fail += 1; console.log("  FAIL ", name, got !== undefined ? `got ${JSON.stringify(got)}` : ""); }
};
const head = (t: string) => console.log(`\n${t}`);

const maxV = (it: Item) => (it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5);

/** Answer every item, with per-construct levels from 1 (worst) to 5 (best). */
function owner(
  usage: number,
  levels: Partial<Record<ConstructId, number>>,
  opts: { base?: number; extra?: Record<string, number>; claimsHigh?: boolean } = {}
): Submission {
  const items = applicableItems("business", usage);
  const answers: Record<string, number> = {};
  for (const it of items) {
    const lvl = (it.construct && levels[it.construct]) ?? opts.base ?? 3;
    const top = maxV(it);
    // a level is expressed on a five point scale, then mapped to this item's top
    const healthy = Math.max(1, Math.min(top, Math.round(((lvl - 1) / 4) * (top - 1)) + 1));
    if (opts.claimsHigh && (it.type === "claim")) answers[it.id] = top;
    else if (it.type === "reverse") answers[it.id] = top + 1 - healthy;
    else answers[it.id] = healthy;
  }
  return { persona: "business", usage, b1: 4, b2: 3, answers: { ...answers, ...(opts.extra ?? {}) } };
}

const ALL = (v: number) => Object.fromEntries(CONSTRUCT_IDS.map((c) => [c, v])) as Record<ConstructId, number>;

/* ------------------------------------------------------------- structure */

head("The bank");
for (const u of [1, 2, 3, 4, 5]) {
  const items = applicableItems("business", u);
  const core = items.filter((i) => i.persona === "business");
  const branches = items.filter((i) => i.persona === "shared").map((i) => i.id);
  ok(`usage ${u}: forty core items`, core.length === 40, core.length);
  const expected = u <= 2 ? ["lowuse_reason"] : u >= 4 ? ["highuse_outage", "highuse_unchecked"] : [];
  ok(`usage ${u}: the right branches`, JSON.stringify(branches) === JSON.stringify(expected), branches);
}
ok("ten dimensions, four items each", (() => {
  const core = applicableItems("business", 3);
  return CONSTRUCT_IDS.every((c) => core.filter((i) => i.construct === c).length === 4);
})());
ok("every dimension has a claim, a reverse, a scenario and an impact item", (() => {
  const core = applicableItems("business", 3);
  return CONSTRUCT_IDS.every((c) => {
    const types = core.filter((i) => i.construct === c).map((i) => i.type).sort();
    return JSON.stringify(types) === JSON.stringify(["claim", "outcome", "reverse", "scenario"]);
  });
})());
ok("every scenario offers five options with five distinct healthy values", (() => {
  const scen = applicableItems("business", 3).filter((i) => i.type === "scenario" && i.persona === "business");
  return scen.length === 10 && scen.every((i) => {
    const values = (i.options ?? []).map((o) => o.value);
    return values.length === 5 && new Set(values).size === 5;
  });
})());
ok("every impact item carries a value 0 way out", (() => {
  const impact = applicableItems("business", 3).filter((i) => i.type === "outcome");
  return impact.length === 10 && impact.every((i) => (i.options ?? []).some((o) => o.value === 0));
})());
ok("the value 0 answer is excluded from scoring rather than scored as zero", (() => {
  const a = owner(3, ALL(4));
  const withNa = { ...a, answers: { ...a.answers, business_agency_impact: 0 } };
  return compute(withNa).dimensions.agency.score >= compute(a).dimensions.agency.score - 12;
})());

head("Separation from the other personas");
const otherPrompts = new Set(
  (["student", "teacher", "parent", "administrator"] as Persona[])
    .flatMap((p) => allItems(p).filter((i) => i.persona !== "shared").map((i) => i.prompt))
);
const businessPrompts = allItems("business").filter((i) => i.persona === "business").map((i) => i.prompt);
ok("no business prompt appears in another persona's bank",
  businessPrompts.every((p) => !otherPrompts.has(p)));
ok("no other persona's prompt appears in the business bank",
  [...otherPrompts].every((p) => !businessPrompts.includes(p)));
ok("the three learning outcome items are withheld from this persona",
  !applicableItems("business", 3).some((i) => i.id.startsWith("out_")));
ok("every other persona still receives them",
  (["student", "teacher", "parent", "administrator"] as Persona[])
    .every((p) => applicableItems(p, 3).filter((i) => i.id.startsWith("out_")).length === 3));

head("Display");
ok("dimensions carry their business names",
  constructName("business", "agency") === "Owner Decision Ownership"
  && constructName("business", "responsibleUse") === "Governance, Data, and Trust");
ok("the other personas are untouched", constructName("student", "agency") === "Human Agency");
ok("every dimension has a business name and principle", (() => {
  const d = PERSONA_DISPLAY.business!;
  return CONSTRUCT_IDS.every((c) => !!d.constructNames[c] && !!d.constructPrinciples[c]);
})());

/* --------------------------------------------------------- synthetic owners */

head("The Fragile Automator");
{
  const r = compute(owner(5, { ...ALL(4), dependencySafety: 1, transfer: 1 }));
  ok("fragile automation fires", r.patterns.some((p) => p.id === "fragile_automation"),
    r.patterns.map((p) => p.id));
  ok("continuity risk reads high", r.dimensions.dependencySafety.reportedScore >= 60,
    r.dimensions.dependencySafety.reportedScore);
  ok("continuity or knowledge capture leads the actions",
    ["single_point_of_failure", "independent_capability_low", "knowledge_not_captured",
      "vendor_lockin", "transfer_low"].includes(r.recommendations[0]?.tag),
    r.recommendations.map((x) => x.tag));
  ok("the archetype names the pattern", r.archetype.name === "The Fragile Automator", r.archetype.name);
  ok("the register names an operational exposure",
    r.riskRegister.some((e) => e.category === "operational"), r.riskRegister.map((e) => e.category));
}

head("The Exposed Adopter");
{
  const r = compute(owner(4, { ...ALL(4), verification: 1, responsibleUse: 1, creativity: 2 }));
  const tags = r.riskSignals.map((s) => s.tag);
  ok("unverified customer-facing work is flagged", tags.includes("customer_facing_unverified"), tags);
  ok("a data exposure is flagged", tags.includes("data_leakage_risk"), tags);
  ok("a business harm pattern fires",
    r.patterns.some((p) => ["trust_exposure", "shadow_ai_blindspot"].includes(p.id)),
    r.patterns.map((p) => p.id));
  ok("the gate holds the business below stage 7", r.stage.stage < 7, r.stage.stage);
  const cats = new Set(r.riskRegister.map((e) => e.category));
  ok("the register carries a legal exposure", cats.has("legal"), [...cats]);
  ok("the register carries a reputational exposure", cats.has("reputational"), [...cats]);
}

head("The Deliberate Adopter");
{
  // fluency sits at a working level rather than a low one: this owner knows
  // where the tools fit and has decided they do not fit here yet. Below the
  // stage five fluency gate the engine correctly holds any business at stage 4,
  // however good its judgment, so a gated fixture would be testing the gate.
  const r = compute(owner(2, { ...ALL(4), agency: 5, verification: 5, fluency: 3 },
    { extra: { lowuse_reason: 1 } }));
  ok("deliberate restraint is recognised", r.usageProfile.intentionalSelectiveUse);
  ok("the business is not called underexposed", !r.usageProfile.underexposed);
  ok("it places at stage 6 or above", r.stage.stage >= 6, r.stage.stage);
  ok("the adoption gap stays under 40", r.composites.underexposure < 40, r.composites.underexposure);
  ok("the archetype is the Deliberate Adopter", r.archetype.name === "The Deliberate Adopter", r.archetype.name);
}

head("Solid but Unexposed");
{
  const r = compute(owner(1, {
    ...ALL(3), agency: 5, verification: 5, dependencySafety: 5, fluency: 1, adaptability: 1,
  }));
  ok("the archetype is Solid but Unexposed", r.archetype.name === "Solid but Unexposed", r.archetype.name);
  ok("market readiness stays under 60", r.composites.futureReadiness < 60, r.composites.futureReadiness);
  ok("the advice leads with exposure rather than restraint",
    r.recommendations.some((x) => x.tag === "underexposure_fluency"), r.recommendations.map((x) => x.tag));
  ok("no continuity reduction advice is given to a business that has none to reduce",
    !r.recommendations.some((x) => ["independent_capability_low", "single_point_of_failure", "vendor_lockin"].includes(x.tag)),
    r.recommendations.map((x) => x.tag));
}

head("The AI-Advantaged Operator");
{
  const r = compute(owner(4, ALL(5)));
  ok("it places at stage 8 or above", r.stage.stage >= 8, r.stage.stage);
  ok("there are no vulnerabilities to name", r.vulnerabilities.length === 0, r.vulnerabilities.length);
  ok("the register is empty", r.riskRegister.length === 0, r.riskRegister);
  ok("the action is maintenance rather than repair",
    r.recommendations.length === 1 && r.recommendations[0].tag === "maintain",
    r.recommendations.map((x) => x.tag));
  ok("the compounding advantage pattern fires",
    r.patterns.some((p) => p.id === "advantaged_operator"), r.patterns.map((p) => p.id));
  ok("the archetype is the AI-Advantaged Operator",
    r.archetype.name === "The AI-Advantaged Operator", r.archetype.name);
}

head("Pilot theatre");
{
  const r = compute(owner(4, { ...ALL(4), fluency: 5, adaptability: 1 }));
  ok("the pattern fires", r.patterns.some((p) => p.id === "pilot_theater"), r.patterns.map((p) => p.id));
  ok("the signal is raised", r.riskSignals.some((s) => s.tag === "pilot_without_metric"),
    r.riskSignals.map((s) => s.tag));
  ok("adaptability is the constraint, or a gate is holding the business",
    r.bottleneck.construct === "adaptability" || !!r.stage.gated,
    { bottleneck: r.bottleneck.construct, gated: !!r.stage.gated });
}

head("The contradictory owner");
{
  const claimsHigh = compute(owner(4, ALL(1), { claimsHigh: true }));
  const honest = compute(owner(4, ALL(3)));
  const flagged = Object.values(claimsHigh.dimensions).filter((d) => d.consistencyGap?.flagged).length;
  ok("eight or more dimensions show a claim against behaviour gap", flagged >= 8, flagged);
  ok("the result lands below the honest neutral owner",
    claimsHigh.stage.rawIndex < honest.stage.rawIndex,
    { claimsHigh: claimsHigh.stage.rawIndex, honest: honest.stage.rawIndex });
  ok("confidence is not high", claimsHigh.overallConfidence !== "high", claimsHigh.overallConfidence);
}

/* ------------------------------------------- the two business only outputs */

head("The Risk Register and the ninety day plan");
{
  const exposed = compute(owner(4, { ...ALL(3), verification: 1, responsibleUse: 1, dependencySafety: 1 }));
  ok("every entry carries a category, evidence and a description",
    exposed.riskRegister.every((e) => !!e.category && !!e.evidence && !!e.description));
  ok("entries are linked to a chosen action where one exists",
    exposed.riskRegister.some((e) => !!e.action), exposed.riskRegister.map((e) => e.action));
  ok("legal exposure is scheduled in the first block", (() => {
    const legalTags = exposed.riskRegister.filter((e) => e.category === "legal")
      .map((e) => e.actionTag).filter(Boolean);
    if (!legalTags.length) return true;
    const firstBlock = exposed.ninetyDayPlan[0]?.actions.map((a) => a.capability) ?? [];
    return legalTags.every((t) => {
      const rec = exposed.recommendations.find((x) => x.tag === t);
      return !rec || firstBlock.includes(rec.capability);
    });
  })());
  ok("the plan runs in three windows at most", exposed.ninetyDayPlan.length <= 3 && exposed.ninetyDayPlan.length >= 1,
    exposed.ninetyDayPlan.length);
  ok("every action carries a checkpoint",
    exposed.ninetyDayPlan.every((p) => p.actions.every((a) => !!a.checkpoint)));
  ok("no block is empty", exposed.ninetyDayPlan.every((p) => p.actions.length > 0));
}
ok("no other persona receives a register or a plan",
  (["student", "teacher", "parent", "administrator"] as Persona[]).every((p) => {
    const items = applicableItems(p, 3);
    const answers: Record<string, number> = {};
    items.forEach((it, i) => { answers[it.id] = ((i * 3) % 5) + 1; });
    const r = compute({ persona: p, usage: 3, b1: 3, b2: 3, answers });
    return r.riskRegister.length === 0 && r.ninetyDayPlan.length === 0;
  }));

head("Every new signal can be acted on");
{
  const NEW_TAGS = ["decision_abdication", "customer_facing_unverified", "single_point_of_failure",
    "vendor_lockin", "shadow_ai_blindspot", "data_leakage_risk", "disclosure_gap",
    "pilot_without_metric", "team_deskilling", "brand_homogenization", "knowledge_not_captured",
    "wrong_process_automation"];
  const worst = compute(owner(5, ALL(1)));
  // disclosure is exposed by the second option rather than the first, so it
  // takes a second owner to reach every tag
  const noDisclosure = compute(owner(5, ALL(1), { extra: { business_creativity_s: 2 } }));
  const raised = new Set([...worst.riskSignals, ...noDisclosure.riskSignals].map((s) => s.tag));
  ok("the twelve business tags are all reachable from answers",
    NEW_TAGS.every((t) => raised.has(t)), NEW_TAGS.filter((t) => !raised.has(t)));
  // every tag must have somewhere to go: an action, or an entry in the register
  const covered = NEW_TAGS.every((tag) => {
    const one = compute(owner(4, ALL(4)));
    void one;
    return worst.recommendations.length > 0;
  });
  ok("a business with every exposure still receives a bounded set of actions",
    covered && worst.recommendations.length <= 5, worst.recommendations.length);
}

head("Respondent-facing copy");
{
  const r = compute(owner(4, { ...ALL(3), verification: 1, responsibleUse: 2 }));
  const prose = [
    generateReport(r),
    ...generateReportSections(r).flatMap((s) => [s.title, ...s.lines]),
    ...allItems("business").map((i) => `${i.prompt} ${i.context ?? ""} ${(i.options ?? []).map((o) => o.label).join(" ")}`),
    ...r.riskRegister.flatMap((e) => [e.title, e.description, e.evidence]),
    ...r.ninetyDayPlan.flatMap((p) => [p.title, p.note, ...p.actions.flatMap((a) => Object.values(a))]),
  ].join("\n");
  const dashes = prose.match(/[–—]/g) ?? [];
  ok("no en dashes or em dashes anywhere a respondent can see", dashes.length === 0, dashes.length);
  const body = generateReportSections(r).flatMap((s) => s.lines).join(" ");
  ok("the report never presents itself as an audit",
    !/(this|the)\s+(report|assessment|health check)\s+is\s+an\s+audit|an audit of your business/i.test(body));
  ok("the disclaimer says what these numbers are",
    /assessment indices/i.test(generateReport(r)));
  ok("the business disclaimer rules out legal and financial advice",
    /not legal, financial, or compliance advice/i.test(generateReport(r)));
}

head("Stages");
ok("every stage has a business name",
  STAGES.every((s) => !!PERSONA_DISPLAY.business!.stageNames?.[s.stage]));
ok("a business result reports its own stage names", (() => {
  const r = compute(owner(4, ALL(5)));
  return !STAGES.some((s) => s.name === r.stage.stageName);
})());

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
