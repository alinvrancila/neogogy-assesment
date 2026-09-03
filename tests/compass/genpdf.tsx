import fs from "fs";
import { compute, applicableItems } from "@/engine";
import type { Persona, Submission } from "@/engine/types";
import { generateCompassPdf } from "@/lib/reportPdfV2";

type It = ReturnType<typeof applicableItems>[number];
const maxV = (it: It) => (it.options?.length ? Math.max(...it.options.map(o => o.value)) : 5);
const healthiest = (it: It) => (it.type === "reverse" ? 1 : maxV(it));
const unhealthiest = (it: It) => (it.type === "reverse" ? maxV(it) : 1);
const build = (p: Persona, u: number, pick: (it: It, i: number) => number): Submission => {
  const items = applicableItems(p, u); const answers: Record<string, number> = {};
  items.forEach((it, i) => { answers[it.id] = Math.max(0, Math.min(maxV(it), pick(it, i))); });
  return { persona: p, usage: u, b1: 4, b2: 3, answers };
};

/** Four business owners, shaped to the archetypes the report has to handle. */
const bizLevels = (levels: Record<string, number>, base = 3) => (it: It) => {
  const lvl = (it.construct ? levels[it.construct] : undefined) ?? base;
  const top = maxV(it);
  const healthy = Math.max(1, Math.min(top, Math.round(((lvl - 1) / 4) * (top - 1)) + 1));
  return it.type === "reverse" ? top + 1 - healthy : healthy;
};
const ALLB = (v: number) => Object.fromEntries(
  ["agency", "verification", "dependencySafety", "fluency", "transfer", "amplification",
    "skillGrowth", "adaptability", "responsibleUse", "creativity"].map((c) => [c, v]));

const cases: Array<[string, Submission]> = [
  ["all-highest", build("administrator", 5, healthiest)],
  ["all-lowest", build("student", 3, unhealthiest)],
  ["gated", build("teacher", 5, (it) => (it.construct === "verification" ? unhealthiest(it) : healthiest(it)))],
  ["insufficient", { persona: "student", usage: 3, b1: 3, b2: 3, answers: { student_agency_claim: 3 } }],
  ["mixed-parent", build("parent", 3, (it, i) => Math.min(maxV(it), ((i * 7) % 5) + 1))],
  // held at stage 6 by responsible use, the shape a real respondent reported
  ["biz-fragile", build("business", 5, bizLevels({ ...ALLB(4), dependencySafety: 1, transfer: 1 }))],
  ["biz-exposed", build("business", 4, bizLevels({ ...ALLB(3), verification: 1, responsibleUse: 1, creativity: 2 }))],
  ["biz-deliberate", { ...build("business", 2, bizLevels({ ...ALLB(4), agency: 5, verification: 5, fluency: 3 })),
    answers: { ...build("business", 2, bizLevels({ ...ALLB(4), agency: 5, verification: 5, fluency: 3 })).answers, lowuse_reason: 1 } }],
  ["biz-advantaged", build("business", 4, bizLevels(ALLB(5)))],
  ["pastor-overextended", build("pastor", 5, bizLevels({ ...ALLB(4), agency: 1, dependencySafety: 1 }))],
  ["pastor-quick", build("pastor", 4, bizLevels({ ...ALLB(4), verification: 1 }))],
  ["pastor-minimalist", { ...build("pastor", 1, bizLevels({ ...ALLB(4), agency: 5, verification: 5, fluency: 3 })),
    answers: { ...build("pastor", 1, bizLevels({ ...ALLB(4), agency: 5, verification: 5, fluency: 3 })).answers, lowuse_reason: 3 } }],
  ["pastor-anchored", build("pastor", 3, bizLevels(ALLB(5)))],
  ["professional-mixed", build("professional", 4, (it) => Math.min(maxV(it), ((it.id.length * 3) % 5) + 1))],
  ["professional-strong", build("professional", 5, healthiest)],
  ["gated-mid", build("teacher", 4, (it) =>
    (it.construct === "responsibleUse" ? (it.type === "reverse" ? maxV(it) - 1 : 2) : healthiest(it)))],
];

const dir = process.argv[2];
(async () => {
  for (const [name, sub] of cases) {
    const r = compute(sub);
    const buf = await generateCompassPdf({ result: r, name: "Test Runner" });
    fs.writeFileSync(`${dir}/${name}.pdf`, buf);
    console.log(name.padEnd(14), "stage", String(r.stage.stage).padStart(2),
      "idx", String(r.stage.rawIndex).padStart(5),
      "| recs", r.recommendations.length, "| bytes", buf.length);
  }
})();
