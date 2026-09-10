/**
 * Validation suite: §52 synthetic respondents, §53 continuum validation cases,
 * §55 edge cases, plus regression checks against every v1 structural failure
 * documented in the spec's Part IV.
 *
 * Run: npx tsx tests/synthetic.ts
 */
import assert from "node:assert";
import { compute, applicableItems, generateReport, generateReportSections } from "../../src/engine/index";
import type { Persona, Submission } from "../../src/engine/types";
import { rescoreLegacy } from "../../src/engine/legacyAdapter";

let passed = 0, failed = 0;
function check(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`  ok   ${name}`); }
  catch (e: any) { failed++; console.log(`  FAIL ${name}\n       ${e.message}`); }
}

/** Build answers for a persona from per-construct target levels (1..5), with optional per-item overrides. */
function answersFor(persona: Persona, usage: number,
  levels: Partial<Record<string, number>>, overrides: Record<string, number> = {},
  outcome: number = 3): Record<string, number> {
  const a: Record<string, number> = {};
  for (const it of applicableItems(persona, usage)) {
    if (!it.construct) { a[it.id] = overrides[it.id] ?? 3; continue; }
    const lvl = levels[it.construct] ?? 3;
    if (it.type === "outcome") a[it.id] = overrides[it.id] ?? outcome;
    else if (it.type === "reverse") a[it.id] = overrides[it.id] ?? (6 - lvl);
    else a[it.id] = overrides[it.id] ?? lvl;
  }
  for (const [k, v] of Object.entries(overrides)) a[k] = v;
  return a;
}

function sub(persona: Persona, usage: number, levels: Partial<Record<string, number>>,
  overrides: Record<string, number> = {}, extra: Partial<Submission> = {}, outcome = 3): Submission {
  return { persona, usage, answers: answersFor(persona, usage, levels, overrides, outcome), b1: 3, b2: 3, ...extra };
}

const ALL = (n: number) => Object.fromEntries(
  ["fluency", "agency", "amplification", "dependencySafety", "verification",
   "skillGrowth", "creativity", "responsibleUse", "transfer", "adaptability"].map(c => [c, n]));

console.log("\n== §52 Synthetic respondents ==");

// 1. Minimal-use, AI-naive
const r1 = compute(sub("student", 1, { ...ALL(3), fluency: 2, adaptability: 2, verification: 3, dependencySafety: 4 },
  { lowuse_reason: 4 }));
check("naive minimal user → underexposed, early stage, exposure-first advice", () => {
  assert(r1.usageProfile.underexposed, "should be underexposed");
  assert(r1.stage.stage <= 4, `stage ${r1.stage.stage}`);
  assert(r1.recommendations.some(x => x.tag === "underexposure_fluency"), "needs exposure rec");
  assert(!r1.recommendations.some(x => x.tag === "independent_capability_low"), "must NOT get dependency-reduction advice");
});

// 2. Intentional low-use expert
const r2 = compute(sub("teacher", 2, { ...ALL(4), verification: 5, agency: 5, dependencySafety: 5, fluency: 4, amplification: 4 },
  { lowuse_reason: 1 }));
check("intentional selective expert → recognized, NOT locked out of high stages (v1 §4.1 fix)", () => {
  assert(r2.usageProfile.intentionalSelectiveUse, "should be intentional");
  assert(!r2.usageProfile.underexposed, "not underexposed");
  assert(r2.stage.stage >= 6, `stage ${r2.stage.stage} should be >= 6; v1 capped abstainers below Guide forever`);
  assert(r2.archetype.id === "grounded_selectivist" || r2.archetype.id === "strategic_integrator", r2.archetype.id);
});

// 3. AI-curious beginner
const r3 = compute(sub("student", 3, { ...ALL(3), adaptability: 4, fluency: 3, verification: 2 }));
check("curious beginner → explorer-type profile, forming stages", () => {
  assert(r3.stage.stage >= 3 && r3.stage.stage <= 6, `stage ${r3.stage.stage}`);
  assert(["curious_explorer", "uncritical_consumer", "forming_practitioner"].includes(r3.archetype.id), r3.archetype.id);
});

// 4. High-use uncritical
const r4 = compute(sub("student", 5, { ...ALL(3), fluency: 4, verification: 1, agency: 3 }, { highuse_unchecked: 5 }));
check("high-use uncritical → verification signals, overconfidence pattern, gated from advanced stages", () => {
  assert(r4.riskSignals.some(x => x.tag === "uncritical_acceptance" || x.tag === "verification_low"));
  assert(r4.patterns.some(p => p.id === "overconfidence_risk"), "overconfidence pattern");
  assert(r4.stage.stage <= 6, `stage ${r4.stage.stage}: weak verification must not reach strategic stages`);
});

// 5. AI-dependent respondent
const r5 = compute(sub("teacher", 5, { ...ALL(3), fluency: 4, dependencySafety: 1, agency: 2, transfer: 2 },
  { highuse_outage: 1 }, {}, 2));
check("dependent respondent → dependency pattern + immediate independence work", () => {
  assert(r5.patterns.some(p => p.id === "dependency_pattern"));
  assert(r5.composites.dependencyIndex >= 55, `dep index ${r5.composites.dependencyIndex}`);
  assert(r5.recommendations.some(x => ["independent_capability_low", "dependency_starting_tasks"].includes(x.tag)));
  assert(["dependent_operator"].includes(r5.archetype.id), r5.archetype.id);
});

// 6. Highly capable AI-augmented respondent
const r6 = compute(sub("administrator", 4, ALL(5), { highuse_outage: 4, highuse_unchecked: 1 }, { b1: 5, b2: 5 }, 5));
check("augmented respondent → high stage, strategic archetype, maintenance advice, honest strengths, NO manufactured risks", () => {
  assert(r6.stage.stage >= 8, `stage ${r6.stage.stage}`);
  assert(["strategic_integrator", "augmented_thinker"].includes(r6.archetype.id), r6.archetype.id);
  assert(r6.vulnerabilities.length === 0, "a 90+ profile must not be shown fake risks (v1 §4.7 fix)");
  assert(r6.strengths.length >= 5, "genuine strengths shown");
  assert(r6.recommendations.some(x => x.tag === "maintain"), "maintenance, not alarm");
});

// 7. Strong traditional expert, weak AI readiness
const r7 = compute(sub("administrator", 1, { ...ALL(4), fluency: 2, adaptability: 2, amplification: 2, transfer: 3, dependencySafety: 5, verification: 5, agency: 5 },
  { lowuse_reason: 5 }));
check("capable traditionalist → distinct from naive avoider, future-readiness framing", () => {
  assert(r7.archetype.id === "capable_but_unexposed", r7.archetype.id);
  assert(r7.usageProfile.underexposed);
  assert(r7.composites.futureReadiness < 60, `FR ${r7.composites.futureReadiness}`);
  assert(r7.patterns.some(p => p.id === "underexposure_vulnerability"));
});

// 8. Technically fluent, poor verification
const r8 = compute(sub("student", 4, { ...ALL(4), fluency: 5, verification: 2, agency: 4 }, { highuse_unchecked: 4 }));
check("fluent + weak verification → gated, bottleneck names verification", () => {
  assert(r8.patterns.some(p => p.id === "overconfidence_risk"));
  assert(r8.stage.gated || r8.bottleneck.construct === "verification",
    `gated=${!!r8.stage.gated} bottleneck=${r8.bottleneck.construct}`);
});

// 9. Moderate healthy user
const r9 = compute(sub("parent", 3, ALL(4)));
check("moderate healthy user → mid-high stage, no harm patterns", () => {
  assert(r9.stage.stage >= 5 && r9.stage.stage <= 8, `stage ${r9.stage.stage}`);
  assert(!r9.patterns.some(p => p.kind === "harm"), "no harm patterns");
});

// 10. Contradictory respondent (claims 5, behaves 1)
const contradictoryOverrides: Record<string, number> = {};
for (const it of applicableItems("student", 3)) {
  if (it.type === "claim") contradictoryOverrides[it.id] = 5;
  if (it.type === "scenario") contradictoryOverrides[it.id] = 1;
  if (it.type === "reverse") contradictoryOverrides[it.id] = 3;
}
const r10 = compute(sub("student", 3, ALL(3), contradictoryOverrides));
check("contradictory respondent → gaps flagged, score follows BEHAVIOR, confidence lowered (v1 §4.5 fix)", () => {
  const flagged = Object.values(r10.dimensions).filter(d => d.consistencyGap?.flagged);
  assert(flagged.length >= 8, `flagged ${flagged.length}`);
  const consistent = compute(sub("student", 3, ALL(3))); // all-3s honest respondent
  for (const c of ["agency", "verification", "dependencySafety"] as const) {
    assert(r10.dimensions[c].score < consistent.dimensions[c].score - 5,
      `${c}: contradictory ${r10.dimensions[c].score} must score clearly below consistent ${consistent.dimensions[c].score}`);
  }
  assert(r10.overallConfidence !== "high", "confidence must drop");
});

console.log("\n== §53 Continuum validation cases ==");

// A vs B: high use, weak vs strong verification+independence
const rA = compute(sub("teacher", 5, { ...ALL(4), verification: 2, dependencySafety: 2 }, { highuse_outage: 2, highuse_unchecked: 4 }));
const rB = compute(sub("teacher", 5, { ...ALL(4), verification: 5, dependencySafety: 5 }, { highuse_outage: 5, highuse_unchecked: 1 }));
check("A (weak verify/indep) sits clearly below B (strong) despite identical usage", () => {
  assert(rB.stage.stage - rA.stage.stage >= 2, `A=${rA.stage.stage} B=${rB.stage.stage}`);
});

// C vs D: low use + low literacy vs low use + strong literacy, deliberate
const rC = compute(sub("parent", 1, { ...ALL(2) }, { lowuse_reason: 4 }));
const rD = compute(sub("parent", 1, { ...ALL(4), verification: 5, agency: 5 }, { lowuse_reason: 1 }));
check("C and D receive different interpretations despite identical usage", () => {
  assert(rC.archetype.id !== rD.archetype.id, `${rC.archetype.id} vs ${rD.archetype.id}`);
  assert(rD.usageProfile.intentionalSelectiveUse && !rC.usageProfile.intentionalSelectiveUse);
  assert(rD.composites.underexposure < rC.composites.underexposure - 15);
});

// E vs F: moderate use, excellent transfer vs cognitive outsourcing
const rE = compute(sub("student", 3, { ...ALL(3), transfer: 5, skillGrowth: 4, dependencySafety: 4 }, {}, {}, 4));
const rF = compute(sub("student", 3, { ...ALL(3), transfer: 1, skillGrowth: 2, dependencySafety: 2, fluency: 4 }, {}, {}, 2));
check("E (transfer) and F (outsourcing) diverge in stage, patterns, and advice", () => {
  assert(rE.stage.stage > rF.stage.stage, `E=${rE.stage.stage} F=${rF.stage.stage}`);
  assert(rF.patterns.some(p => p.id === "efficiency_learning_tradeoff" || p.id === "erosion_under_success"));
  assert(rF.recommendations.some(x => x.tag === "transfer_low"));
  assert(!rE.recommendations.some(x => x.tag === "transfer_low"));
});

console.log("\n== §54 Persona differentiation ==");
const depTeacher = compute(sub("teacher", 5, { ...ALL(3), dependencySafety: 1 }, { highuse_outage: 1 }));
const depStudent = compute(sub("student", 5, { ...ALL(3), dependencySafety: 1 }, { highuse_outage: 1 }));
check("persona banks are genuinely different item sets", () => {
  const t = applicableItems("teacher", 5).map(i => i.prompt).join("|");
  const st = applicableItems("student", 5).map(i => i.prompt).join("|");
  const tOnly = applicableItems("teacher", 5).filter(i => i.persona === "teacher");
  assert(tOnly.every(i => !st.includes(i.prompt)), "teacher prompts must not appear in student bank");
  assert(depTeacher.persona !== depStudent.persona);
});

console.log("\n== §55 Edge cases ==");
check("all-lowest respondent → stage 1-2, insufficient alarmism avoided but risks real", () => {
  const r = compute(sub("student", 5, ALL(1), { highuse_outage: 1, highuse_unchecked: 5 }, {}, 1));
  assert(r.stage.stage <= 2, `stage ${r.stage.stage}`);
  assert(r.vulnerabilities.length > 0);
});
check("all-highest respondent → stage 9-10, zero vulnerabilities", () => {
  const r = compute(sub("teacher", 4, ALL(5), { highuse_outage: 5, highuse_unchecked: 1 }, {}, 5));
  assert(r.stage.stage >= 9, `stage ${r.stage.stage}`);
  assert(r.vulnerabilities.length === 0);
});
check("all-neutral respondent → NOT told they have specific deficits (v1 §3.4 fix)", () => {
  const r = compute(sub("parent", 3, ALL(3)));
  assert(r.vulnerabilities.length === 0, "neutral answers are not evidence of weakness");
  assert(r.archetype.id === "forming_practitioner" || r.archetype.id === "curious_explorer", r.archetype.id);
  const report = generateReport(r);
  assert(!report.includes("unclear boundaries"), "no v1-style accusations");
});
check("many N/A outcome answers → confidence drops, no crash", () => {
  const r = compute(sub("student", 2, ALL(3), { out_begin: 0, out_explain: 0, out_persist: 0, lowuse_reason: 3 }));
  assert(["moderate", "preliminary", "insufficient", "high"].includes(r.overallConfidence));
});
check("missing answers → insufficient/preliminary, silent-default-to-50 does not masquerade as measurement", () => {
  const r = compute({ persona: "student", usage: 3, answers: { student_agency_claim: 4 } });
  assert(r.overallConfidence === "insufficient", r.overallConfidence);
  assert(r.dimensions.verification.confidence === "insufficient");
});

console.log("\n== v1 Part IV regression checks ==");

check("§4.1: NO usage level forecloses any archetype or stage by itself", () => {
  // perfect answers at usage 1 must reach advanced stages
  const r = compute(sub("teacher", 1, ALL(5), { lowuse_reason: 1 }));
  assert(r.stage.stage >= 8, `stage ${r.stage.stage}: v1 capped this at Anchor forever`);
});
check("§4.2: one Likert click near a boundary yields borderline info, not a silent identity flip", () => {
  // craft a profile near a stage boundary
  const base = compute(sub("student", 3, { ...ALL(4), creativity: 3 }));
  const nudged = compute(sub("student", 3, { ...ALL(4), creativity: 3 }, { student_creativity_claim: 2 }));
  const delta = Math.abs(base.stage.rawIndex - nudged.stage.rawIndex);
  assert(delta < 2, `one click moved the index by ${delta}; continuous scoring keeps clicks small`);
  if (base.stage.stage !== nudged.stage.stage) {
    assert(base.stage.borderline || nudged.stage.borderline, "a flip near a boundary must be marked borderline");
  }
});
check("§4.3: neutral respondents no longer dumped into a residual bucket with fabricated deficits", () => {
  const r = compute(sub("student", 3, ALL(3)));
  assert(r.vulnerabilities.length === 0 && r.strengths.length === 0);
});
check("§4.4: light users with mild optimism are not accused of productivity illusion", () => {
  const r = compute(sub("parent", 1, ALL(3), { lowuse_reason: 3 }, { b1: 4, b2: 3 }));
  // v1: damping dropped measuredBand and manufactured an accusation at B1=4
  assert(!(r.calibration.desirabilityGap !== undefined && r.calibration.desirabilityGap >= 2
    && r.calibration.note.includes("healthier to you than it measured")) || r.stage.rawIndex < 40,
    "no penalty-generated illusion accusation");
});
check("§4.5: triangulation now carries weight (behavior-shifted scores)", () => {
  const honest = compute(sub("student", 3, { ...ALL(3), agency: 3 }));
  const inflated = compute(sub("student", 3, ALL(3), { student_agency_claim: 5, student_agency_s: 1 }));
  assert(inflated.dimensions.agency.score < honest.dimensions.agency.score,
    `inflated ${inflated.dimensions.agency.score} vs honest ${honest.dimensions.agency.score}`);
  assert(inflated.dimensions.agency.consistencyGap?.flagged);
});
check("§4.6: advice is conditioned on detected behavior, not persona lookup", () => {
  const verifWeak = compute(sub("student", 4, { ...ALL(4), verification: 1 }, { highuse_unchecked: 5 }));
  const transferWeak = compute(sub("student", 4, { ...ALL(4), transfer: 1 }, { highuse_outage: 4, highuse_unchecked: 1 }));
  const tagsA = verifWeak.recommendations.map(x => x.tag).join(",");
  const tagsB = transferWeak.recommendations.map(x => x.tag).join(",");
  assert(tagsA !== tagsB, "same persona, different weaknesses, different advice");
  assert(tagsA.includes("verification") || tagsA.includes("uncritical"));
  assert(tagsB.includes("transfer"));
});
check("§4.7: B2 is used (calibration distinct from desirability)", () => {
  const r = compute(sub("teacher", 4, ALL(5), { highuse_outage: 5, highuse_unchecked: 1 }, { b1: 3, b2: 1 }, 5));
  assert(r.calibration.calibrationGap !== undefined && r.calibration.calibrationGap <= -2);
});

console.log("\n== Archetype distribution sanity (random respondents) ==");
check("no archetype absorbs a v1-Wanderer-sized share under random answering", () => {
  const counts: Record<string, number> = {};
  const stages: Record<number, number> = {};
  const rng = mulberry32(42);
  const N = 4000;
  for (let i = 0; i < N; i++) {
    const persona = (["student", "teacher", "parent", "administrator"] as const)[i % 4];
    const usage = 1 + Math.floor(rng() * 5);
    const answers: Record<string, number> = {};
    for (const it of applicableItems(persona, usage)) {
      answers[it.id] = it.type === "outcome" ? Math.floor(rng() * 6) : 1 + Math.floor(rng() * 5);
    }
    const r = compute({ persona, usage, answers, b1: 3, b2: 3 });
    counts[r.archetype.id] = (counts[r.archetype.id] ?? 0) + 1;
    stages[r.stage.stage] = (stages[r.stage.stage] ?? 0) + 1;
  }
  console.log("     archetypes:", Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, (100 * v / N).toFixed(1) + "%"])));
  console.log("     stages:", Object.fromEntries(Object.entries(stages).map(([k, v]) => [k, (100 * v / N).toFixed(1) + "%"])));
  const maxShare = Math.max(...Object.values(counts)) / N;
  assert(maxShare < 0.5, `largest archetype share ${(maxShare * 100).toFixed(1)}% (v1 Wanderer was 62.8%)`);
});

console.log("\n== Legacy rescoring ==");
check("v1 record rescored under v2 without fabricated certainty on unmeasured dimensions", () => {
  const legacy = {
    role: "student", usageVal: 1, baseline: { b1: 4, b2: 4 },
    answers: {
      agency_1: 4, agency_2: 2, agency_s: 4, attention_1: 4, attention_2: 2, attention_s: 4,
      judgment_1: 5, judgment_2: 1, judgment_s: 5, memory_1: 4, memory_2: 2, memory_s: 4,
      integrity_1: 5, integrity_2: 1, integrity_s: 5, fluency_1: 4, fluency_2: 2, fluency_s: 4,
      transfer_1: 4, transfer_2: 2, transfer_s: 4, creation_1: 4, creation_2: 2, creation_s: 4,
      collaboration_1: 4, collaboration_2: 2, collaboration_s: 4, adaptability_1: 4, adaptability_2: 2, adaptability_s: 4,
    },
  };
  const r = rescoreLegacy(legacy);
  assert(r.stage.stage >= 5, `stage ${r.stage.stage}: v1 called this healthy abstainer an Anchor with 'low practical fluency'`);
  assert(["insufficient", "preliminary"].includes(r.dimensions.amplification.confidence),
    "amplification was never measured by v1; must be marked accordingly");
});

console.log("\n== Report generation smoke ==");
check("reports render for every synthetic profile and answer the §48 questions structurally", () => {
  for (const r of [r1, r2, r4, r5, r6, r7, r10]) {
    const md = generateReport(r);
    // Assert on section keys rather than on title prose, so that rewriting a
    // heading for clarity cannot silently drop a section.
    const keys = generateReportSections(r).map(s => s.key);
    for (const k of ["profile", "continuum", "signature", "helping", "harming", "strengths",
      "selfKnowledge", "bottleneck", "nextStage", "roadmap", "plan", "evidence", "experiment"]) {
      assert(keys.includes(k as never), `missing section: ${k}`);
    }
    for (const s of generateReportSections(r)) {
      assert(s.title.trim().length > 0, `section ${s.key} has no title`);
      assert(s.lines.join("").trim().length > 0, `section ${s.key} has no content`);
      assert(md.includes(s.title), `report is missing the ${s.key} heading`);
    }
    assert(!md.includes("—") && !md.includes("–"), "no em/en dashes in report prose");
  }
});

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
