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

const cases: Array<[string, Submission]> = [
  ["all-highest", build("administrator", 5, healthiest)],
  ["all-lowest", build("student", 3, unhealthiest)],
  ["gated", build("teacher", 5, (it) => (it.construct === "verification" ? unhealthiest(it) : healthiest(it)))],
  ["insufficient", { persona: "student", usage: 3, b1: 3, b2: 3, answers: { student_agency_claim: 3 } }],
  ["mixed-parent", build("parent", 3, (it, i) => Math.min(maxV(it), ((i * 7) % 5) + 1))],
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
