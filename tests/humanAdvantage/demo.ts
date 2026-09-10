import { compute, generateReport, applicableItems } from "../../src/engine/index";
const answers: Record<string, number> = {};
for (const it of applicableItems("teacher", 5)) {
  const lv: Record<string, number> = { fluency: 4, agency: 3, amplification: 4, dependencySafety: 2,
    verification: 3, skillGrowth: 2, creativity: 3, responsibleUse: 4, transfer: 2, adaptability: 4 };
  const l = it.construct ? (lv[it.construct] ?? 3) : 3;
  answers[it.id] = it.type === "outcome" ? 2 : it.type === "reverse" ? 6 - l : l;
}
answers["highuse_outage"] = 2; answers["highuse_unchecked"] = 2;
const r = compute({ persona: "teacher", usage: 5, b1: 4, b2: 4, answers });
console.log(generateReport(r));
