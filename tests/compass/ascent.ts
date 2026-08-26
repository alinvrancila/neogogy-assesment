/**
 * Ascent result checks: continuous placement, stage rendering, gate logic and
 * dependency-risk directionality. Pure assertions over the geometry and the
 * result shape, so they run without a DOM.
 */
import assert from "node:assert";
import { compute, applicableItems } from "../../src/engine";
import { STAGES } from "../../src/engine/config";
import type { Persona, Submission } from "../../src/engine/types";
import { pointAtIndex, ROUTE_LENGTH, VIEW } from "../../src/components/compass/ascent/route";
import { GATE_DEFS } from "../../src/components/compass/ascent/AscentMapHero";

let pass = 0, fail = 0;
const check = (name: string, fn: () => void) => {
  try { fn(); console.log(`  ok    ${name}`); pass++; }
  catch (e) { console.log(`  FAIL  ${name}\n        ${(e as Error).message}`); fail++; }
};

type It = ReturnType<typeof applicableItems>[number];
const mx = (it: It) => (it.options?.length ? Math.max(...it.options.map(o => o.value)) : 5);
const build = (p: Persona, u: number, pick: (it: It, i: number) => number): Submission => {
  const items = applicableItems(p, u); const answers: Record<string, number> = {};
  items.forEach((it, i) => { answers[it.id] = Math.max(0, Math.min(mx(it), pick(it, i))); });
  return { persona: p, usage: u, b1: 4, b2: 3, answers };
};

console.log("\n== Ascent route placement ==");

check("index maps continuously, not snapped to stage centres", () => {
  const a = pointAtIndex(37.8);
  const b = pointAtIndex(37.9);
  const c = pointAtIndex(30);
  assert(a.x !== b.x, "37.8 and 37.9 must not resolve to the same point");
  assert(a.x !== c.x, "37.8 must not snap to the start of its stage band");
  // stage 4 spans 35..45; its centre would be 40. 37.8 must sit before that.
  const centre = pointAtIndex(40);
  assert(a.x < centre.x, "37.8 must sit before the centre of stage 4");
});

check("fraction along the route equals index / 100", () => {
  for (const idx of [0, 12.5, 37.8, 50, 73.4, 100]) {
    const p = pointAtIndex(idx);
    const q = pointAtIndex(idx);
    assert.deepStrictEqual(p, q, "placement must be deterministic");
  }
  const start = pointAtIndex(0);
  const end = pointAtIndex(100);
  assert(end.x > start.x && end.y < start.y, "route must rise left to right");
});

check("placement is monotonic across the whole range", () => {
  let prev = -Infinity;
  for (let i = 0; i <= 100; i += 0.5) {
    const p = pointAtIndex(i);
    assert(p.x >= prev, `x went backwards at index ${i}`);
    prev = p.x;
  }
});

check("out of range indices are clamped inside the drawing", () => {
  for (const bad of [-40, 0, 100, 180]) {
    const p = pointAtIndex(bad);
    assert(p.x >= 0 && p.x <= VIEW.w, `x escaped the viewbox at ${bad}`);
    assert(p.y >= 0 && p.y <= VIEW.h, `y escaped the viewbox at ${bad}`);
  }
  assert.deepStrictEqual(pointAtIndex(-10), pointAtIndex(0));
  assert.deepStrictEqual(pointAtIndex(140), pointAtIndex(100));
});

check("route has real length", () => { assert(ROUTE_LENGTH > 100); });

console.log("\n== Stages ==");

check("exactly ten stages with the expected labels", () => {
  const expected = [
    "AI Detached", "AI Aware", "AI Curious", "AI Exploring", "AI Functional",
    "AI Integrating", "AI Strategic", "AI Augmented", "AI Adaptive", "Future-ready / Generative",
  ];
  assert.strictEqual(STAGES.length, 10);
  STAGES.forEach((s, i) => assert.strictEqual(s.name, expected[i], `stage ${i + 1} label`));
});

check("current and next stage are always renderable", () => {
  for (const p of ["student", "teacher", "parent", "administrator"] as Persona[]) {
    for (const u of [1, 3, 5]) {
      for (const shape of [0, 2, 4]) {
        const r = compute(build(p, u, (it, i) => Math.min(mx(it), ((i + shape) % 5) + 1)));
        assert(r.stage.stage >= 1 && r.stage.stage <= 10, "stage in range");
        assert(STAGES.some(s => s.stage === r.stage.stage), "current stage exists");
        assert(STAGES.some(s => s.stage === r.nextTarget.stage), "next stage exists");
        assert(r.nextTarget.stage >= r.stage.stage, "next stage never goes backwards");
        assert(typeof r.stage.stageName === "string" && r.stage.stageName.length > 0);
      }
    }
  }
});

check("at stage 10 the next target is the same stage, so the map shows no next ledge", () => {
  const healthiest = (it: It) => (it.type === "reverse" ? 1 : mx(it));
  const r = compute(build("administrator", 5, healthiest));
  assert.strictEqual(r.stage.stage, 10);
  assert.strictEqual(r.nextTarget.stage, 10);
});

console.log("\n== Dependency risk directionality ==");

check("dependency risk is the inverse of independent capability", () => {
  for (const p of ["student", "parent"] as Persona[]) {
    for (const shape of [0, 1, 3]) {
      const r = compute(build(p, 4, (it, i) => Math.min(mx(it), ((i + shape) % 5) + 1)));
      const d = r.dimensions.dependencySafety;
      assert(Math.abs((d.score + d.reportedScore) - 100) < 0.05,
        `reported risk ${d.reportedScore} must be 100 minus capability ${d.score}`);
    }
  }
});

check("a high dependency risk never reads as a strong dimension", () => {
  // Construct a respondent with weak independent capability.
  const r = compute(build("student", 5, (it) =>
    it.construct === "dependencySafety" ? (it.type === "reverse" ? mx(it) : 1) : 4));
  const d = r.dimensions.dependencySafety;
  assert(d.reportedScore > 50, "expected an elevated risk for this profile");
  assert(d.microState !== "strong", "micro-state must follow capability, not the risk number");
});

console.log("\n== Practice gates ==");

check("every gate maps to a real construct and a real stage threshold", () => {
  for (const g of GATE_DEFS) {
    const stage = STAGES.find(s => s.stage === g.firstStage);
    assert(stage, `stage ${g.firstStage} exists`);
    const gates = stage!.gates as Record<string, number> | undefined;
    assert(gates && gates[g.construct] !== undefined,
      `stage ${g.firstStage} must actually gate on ${g.construct}`);
  }
});

check("gate state follows the score against the real threshold", () => {
  const r = compute(build("teacher", 4, (it) =>
    it.construct === "verification" ? (it.type === "reverse" ? mx(it) : 1) : 5));
  const stage6 = STAGES.find(s => s.stage === 6)!;
  const required = (stage6.gates as Record<string, number>).verification;
  assert(r.dimensions.verification.score < required,
    "this profile should sit below the verification gate");
});


/* ------------------------------------------------------- retake comparison */

import { compareToPrevious } from "../../src/lib/history";
import type { LeadRecord } from "../../src/lib/storage";

const asLead = (r: ReturnType<typeof compute>, createdAt: string): LeadRecord => ({
  id: "prev", name: "T", email: "t@e.com", role: r.persona, modality: "", consent: true,
  persona: r.archetype.id, personaName: r.archetype.name, overall: r.stage.rawIndex,
  createdAt, engineVersion: 2, result: r,
});

console.log("\n== Retake comparison ==");

const weaker = compute(build("student", 4, (it) => (it.type === "reverse" ? 4 : 2)));
const stronger = compute(build("student", 4, (it) => (it.type === "reverse" ? 2 : 4)));

check("an improvement reports a positive index delta and a higher stage", () => {
  const c = compareToPrevious(stronger, asLead(weaker, "2026-06-01T10:00:00.000Z"), 2, new Date("2026-08-26T10:00:00.000Z"));
  assert(c, "expected a comparison");
  assert(c!.indexDelta > 0, "index delta should be positive");
  assert(c!.currentStage > c!.previousStage, "stage should rise");
  assert.strictEqual(c!.attemptNumber, 2);
  assert(c!.daysBetween > 80 && c!.daysBetween < 90, `unexpected day gap ${c!.daysBetween}`);
});

check("a decline reports a negative delta without calling it a failure", () => {
  const c = compareToPrevious(weaker, asLead(stronger, "2026-06-01T10:00:00.000Z"), 2, new Date("2026-08-26T10:00:00.000Z"));
  assert(c!.indexDelta < 0, "index delta should be negative");
  assert(c!.currentStage < c!.previousStage, "stage should fall");
});

check("dependency risk improvement is a fall, not a rise", () => {
  const c = compareToPrevious(stronger, asLead(weaker, "2026-06-01T10:00:00.000Z"), 2, new Date("2026-08-26T10:00:00.000Z"));
  const dep = c!.dimensions.find((d) => d.construct === "dependencySafety")!;
  assert(dep.reportedAsRisk, "dependency must be flagged as a risk scale");
  assert(dep.delta < 0, `expected the risk to fall, got ${dep.delta}`);
  assert.strictEqual(dep.improved, true, "a falling risk must count as an improvement");
  // and the reverse direction
  const back = compareToPrevious(weaker, asLead(stronger, "2026-06-01T10:00:00.000Z"), 2, new Date("2026-08-26T10:00:00.000Z"));
  const dep2 = back!.dimensions.find((d) => d.construct === "dependencySafety")!;
  assert(dep2.delta > 0 && dep2.improved === false, "a rising risk must not count as an improvement");
});

check("an unchanged dimension is neither gain nor slip", () => {
  const c = compareToPrevious(stronger, asLead(stronger, "2026-06-01T10:00:00.000Z"), 2, new Date("2026-08-26T10:00:00.000Z"));
  assert(c!.dimensions.every((d) => d.delta === 0), "identical results should show no movement");
  assert(c!.dimensions.every((d) => d.improved === null), "no dimension should claim improvement");
  assert.strictEqual(c!.indexDelta, 0);
});

check("a prior record without a stored result yields no comparison", () => {
  const broken = { ...asLead(weaker, "2026-06-01T10:00:00.000Z"), result: undefined };
  assert.strictEqual(compareToPrevious(stronger, broken, 2, new Date()), null);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
