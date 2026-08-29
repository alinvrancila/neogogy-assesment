/**
 * Analytics checks. The admin makes decisions about people from these numbers,
 * so the properties that matter are: cohorts count people not attempts,
 * reversed scales stay reversed, personal email domains never form an
 * organisation, and movement is measured first-to-latest.
 */
import assert from "node:assert";
import { compute, applicableItems } from "../../src/engine/index";
import type { Persona } from "../../src/engine/types";
import type { LeadRecord } from "../../src/lib/storage";
import {
  toAttempts, toPeople, buildCohortReport, buildOrgReports, spread, correlate, domainOf, isOrgDomain,
  buildAudienceReport, buildQualityReport, buildItemStats, longestRun,
} from "../../src/lib/analytics";

let pass = 0, fail = 0;
const check = (name: string, fn: () => void) => {
  try { fn(); console.log(`  ok    ${name}`); pass++; }
  catch (e) { console.log(`  FAIL  ${name}\n        ${(e as Error).message}`); fail++; }
};

type It = ReturnType<typeof applicableItems>[number];
const mx = (it: It) => (it.options?.length ? Math.max(...it.options.map(o => o.value)) : 5);

function lead(p: Persona, usage: number, level: number, email: string, at: string): LeadRecord {
  const items = applicableItems(p, usage);
  const answers: Record<string, number> = {};
  items.forEach((it) => { answers[it.id] = it.type === "reverse" ? 6 - level : Math.min(mx(it), level); });
  const r = compute({ persona: p, usage, b1: 4, b2: 3, answers });
  return {
    id: `${email}-${at}`, name: "T", email, role: p, modality: "", consent: true,
    persona: r.archetype.id, personaName: r.archetype.name, overall: r.stage.rawIndex,
    createdAt: at, engineVersion: 2, result: r,
  } as LeadRecord;
}

console.log("\n== Analytics ==");

const leads = [
  lead("student", 4, 2, "a@acme.com", "2026-06-01T10:00:00Z"),
  lead("student", 4, 5, "a@acme.com", "2026-08-01T10:00:00Z"),
  lead("teacher", 5, 2, "b@acme.com", "2026-07-01T10:00:00Z"),
  lead("parent", 1, 3, "c@gmail.com", "2026-07-05T10:00:00Z"),
  lead("administrator", 4, 5, "d@acme.com", "2026-07-09T10:00:00Z"),
];
const attempts = toAttempts(leads);
const people = toPeople(attempts);
const cohort = buildCohortReport(attempts, people);

check("attempts group into people by email", () => {
  assert.strictEqual(attempts.length, 5);
  assert.strictEqual(people.length, 4, "two attempts by one address must be one person");
});

check("cohort statistics count people, not attempts", () => {
  assert.strictEqual(cohort.n, 4, "a repeat taker must not be double counted");
  assert.strictEqual(cohort.people, 4);
  assert.strictEqual(cohort.repeatTakers, 1);
});

check("the cohort uses each person's latest attempt", () => {
  const person = people.find(p => p.email === "a@acme.com")!;
  assert.strictEqual(person.attempts.length, 2);
  assert(person.latest.createdAt > person.first.createdAt, "latest must be the newer attempt");
  assert(person.latest.result.stage.rawIndex > person.first.result.stage.rawIndex);
});

check("movement is measured first to latest", () => {
  assert.strictEqual(cohort.movement.tracked, 1);
  assert.strictEqual(cohort.movement.improved, 1);
  assert.strictEqual(cohort.movement.declined, 0);
  assert(cohort.movement.meanDelta > 0);
});

check("a decline is reported as a decline", () => {
  const down = [
    lead("student", 4, 5, "x@acme.com", "2026-06-01T10:00:00Z"),
    lead("student", 4, 2, "x@acme.com", "2026-08-01T10:00:00Z"),
  ];
  const c = buildCohortReport(toAttempts(down), toPeople(toAttempts(down)));
  assert.strictEqual(c.movement.declined, 1);
  assert(c.movement.meanDelta < 0);
});

check("every distribution sums to the cohort size", () => {
  const sum = (a: Array<{ count: number }>) => a.reduce((x, y) => x + y.count, 0);
  assert.strictEqual(sum(cohort.stages), cohort.n, "stages");
  assert.strictEqual(sum(cohort.archetypes), cohort.n, "archetypes");
  assert.strictEqual(sum(cohort.personas), cohort.n, "personas");
  assert.strictEqual(sum(cohort.usage), cohort.n, "usage");
  assert.strictEqual(sum(cohort.confidence), cohort.n, "confidence");
});

check("indicator shares never exceed the cohort", () => {
  for (const i of cohort.indicators) {
    assert(i.count <= cohort.n, `${i.label} counts more than the cohort`);
    assert(i.share >= 0 && i.share <= 100, `${i.label} share out of range`);
  }
});

check("dependency is reported by capability so higher is healthier everywhere", () => {
  const dep = cohort.dimensions.find(d => d.construct === "dependencySafety")!;
  assert(dep.reportedAsRisk, "must be flagged as a risk scale");
  // the stat is built from the healthy reading, so it should track capability
  const capabilities = people.map(p => p.latest.result.dimensions.dependencySafety.score);
  assert.strictEqual(dep.stat.mean, spread(capabilities).mean);
});

check("personal email domains never form an organisation", () => {
  assert.strictEqual(domainOf("c@gmail.com"), "gmail.com");
  assert(!isOrgDomain("gmail.com"));
  assert(!isOrgDomain("outlook.com"));
  assert(isOrgDomain("acme.com"));
  const orgs = buildOrgReports(people);
  assert(!orgs.some(o => o.domain === "gmail.com"), "gmail must not appear as an organisation");
});

check("organisations need at least two people", () => {
  const orgs = buildOrgReports(people);
  const acme = orgs.find(o => o.domain === "acme.com");
  assert(acme, "acme has three people and should appear");
  assert.strictEqual(acme!.people, 3);
  assert(orgs.every(o => o.people >= 2));
});

check("org rollups count attempts separately from people", () => {
  const acme = buildOrgReports(people).find(o => o.domain === "acme.com")!;
  assert.strictEqual(acme.people, 3);
  assert.strictEqual(acme.attempts, 4, "a@acme.com contributed two attempts");
});

check("spread reports real quartiles and handles the empty case", () => {
  const s = spread([10, 20, 30, 40, 50]);
  assert.strictEqual(s.n, 5);
  assert.strictEqual(s.median, 30);
  assert(s.p25 <= s.median && s.median <= s.p75);
  const empty = spread([]);
  assert.strictEqual(empty.n, 0);
  assert.strictEqual(empty.mean, 0);
});

check("correlation refuses to report on too few pairs", () => {
  assert.strictEqual(correlate([1, 2], [1, 2]).n, 2);
  assert.strictEqual(correlate([1, 2], [1, 2]).r, 0, "under three pairs must not claim a correlation");
  const perfect = correlate([1, 2, 3, 4], [2, 4, 6, 8]);
  assert.strictEqual(perfect.r, 1);
});

check("legacy v1 records are excluded from analytics", () => {
  const withLegacy = [...leads, { id: "old", name: "Legacy", email: "z@acme.com", role: "student",
    modality: "", consent: true, persona: "sprinter", personaName: "The Sprinter",
    overall: 50, createdAt: "2026-01-01T10:00:00Z" } as LeadRecord];
  assert.strictEqual(toAttempts(withLegacy).length, 5, "a record without engineVersion 2 must be skipped");
});

check("an empty cohort does not throw", () => {
  const c = buildCohortReport([], []);
  assert.strictEqual(c.n, 0);
  assert.strictEqual(c.index.mean, 0);
  assert.strictEqual(c.segments.length, 0);
});

/* ------------------------------------------- audience, quality and items */

console.log("\n== Audience, quality and items ==");

// The fast completion is given to a single-attempt person, because the cohort
// reads each person's latest attempt and a fast first attempt would be
// superseded.
const withExtras = leads.map((l, i) => ({
  ...l,
  heardFrom: i % 2 ? "Search engine" : "",
  consent: i !== 0,
  mobilePhone: i === 1 ? "+63 900" : "",
  meta: {
    durationMs: l.email === "c@gmail.com" ? 60_000 : 900_000,
    revisions: i, device: i ? "desktop" : "phone",
    referrerHost: i ? "google.com" : "", localHour: 9 + i,
    utmSource: i === 2 ? "newsletter" : "",
  },
}));
const exAtt = toAttempts(withExtras);
const exLatest = toPeople(exAtt).map(p => p.latest);

check("heard-about-us is reported, including the people who skipped it", () => {
  const a = buildAudienceReport(exLatest);
  const labels = a.heardFrom.map(h => h.label);
  assert(labels.includes("Search engine"), "answers must be counted");
  assert(labels.includes("Not answered"), "skipping must be visible rather than dropped");
  const total = a.heardFrom.reduce((x, h) => x + h.count, 0);
  assert.strictEqual(total, exLatest.length, "every person must appear exactly once");
});

check("consent and phone are reported as rates of the cohort", () => {
  const a = buildAudienceReport(exLatest);
  assert(a.consentRate >= 0 && a.consentRate <= 100);
  assert(a.phoneRate >= 0 && a.phoneRate <= 100);
});

check("a fast completion is flagged for review", () => {
  const q = buildQualityReport(exLatest);
  assert.strictEqual(q.fastCount, 1, "the one minute submission must be flagged");
  assert(q.suspect.some(x => /minutes/.test(x.reason)), "the reason must name the speed");
});

check("straight-lining is detected as the longest identical run", () => {
  assert.strictEqual(longestRun({ a: 3, b: 3, c: 3, d: 1 }, ["a", "b", "c", "d"]), 3);
  assert.strictEqual(longestRun({ a: 1, b: 2, c: 3 }, ["a", "b", "c"]), 1);
  assert.strictEqual(longestRun({}, []), 0, "no answers must not throw");
});

check("quality survives records with no recorded context", () => {
  const q = buildQualityReport(toPeople(toAttempts(leads)).map(p => p.latest));
  assert.strictEqual(q.durationKnown, 0, "older records have no duration");
  assert.strictEqual(q.duration.n, 0);
  assert(q.straightLining.n > 0, "runs are computed from answers, which always exist");
});

check("item stats need at least three responses and report a distribution", () => {
  const meta = [
    { id: "student_agency_claim", construct: "agency", type: "claim" },
    { id: "does_not_exist", construct: "agency", type: "claim" },
  ];
  const stats = buildItemStats(exLatest, meta);
  assert(!stats.some(s => s.id === "does_not_exist"), "an unanswered item must be skipped");
  const one = stats.find(s => s.id === "student_agency_claim");
  if (one) {
    assert(one.n >= 3);
    const total = one.distribution.reduce((x, d) => x + d.count, 0);
    assert.strictEqual(total, one.n, "the distribution must account for every response");
  }
});

check("the new reports do not throw on an empty cohort", () => {
  const a = buildAudienceReport([]);
  const q = buildQualityReport([]);
  assert.strictEqual(a.consentRate, 0);
  assert.strictEqual(q.suspect.length, 0);
  assert.strictEqual(buildItemStats([], []).length, 0);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
