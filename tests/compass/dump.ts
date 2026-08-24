/** Deterministic report dump, used to prove refactors do not change prose. */
import { compute, applicableItems, generateReport } from "../../src/engine";
import type { Persona, Submission } from "../../src/engine/types";

const personas: Persona[] = ["student", "teacher", "parent", "administrator"];
const out: string[] = [];

function build(persona: Persona, usage: number, pick: (i: number) => number): Submission {
  const items = applicableItems(persona, usage);
  const answers: Record<string, number> = {};
  items.forEach((it, i) => {
    const max = it.options?.length ? Math.max(...it.options.map(o => o.value)) : 5;
    answers[it.id] = Math.min(max, Math.max(1, pick(i)));
  });
  return { persona, usage, b1: 4, b2: 3, answers };
}

const shapes: Array<[string, (i: number) => number]> = [
  ["all-1", () => 1],
  ["all-3", () => 3],
  ["all-5", () => 5],
  ["cycle", (i) => (i % 5) + 1],
  ["alt", (i) => (i % 2 ? 5 : 2)],
];

for (const p of personas) {
  for (const u of [1, 3, 5]) {
    for (const [name, fn] of shapes) {
      out.push(`===== ${p} usage${u} ${name} =====`);
      out.push(generateReport(compute(build(p, u, fn))));
    }
  }
}
console.log(out.join("\n"));
