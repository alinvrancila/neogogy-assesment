import { applicableItems } from "../../src/engine";
import type { Persona } from "../../src/engine/types";

const personas: Persona[] = ["student", "teacher", "parent", "administrator"];
let fail = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? "ok  " : "FAIL"}  ${m}`); if (!c) fail++; };

console.log("== applicable screen list per persona and usage ==");
for (const p of personas) {
  const row: string[] = [];
  for (const u of [1, 2, 3, 4, 5]) {
    const items = applicableItems(p, u);
    const ids = new Set(items.map(i => i.id));
    const low = ids.has("lowuse_reason");
    const high = ids.has("highuse_outage") && ids.has("highuse_unchecked");
    row.push(`u${u}:${items.length}${low ? "+low" : ""}${high ? "+high" : ""}`);
    ok(u <= 2 ? low : !low, `${p} usage ${u}: low-use branch ${u <= 2 ? "present" : "absent"}`);
    ok(u >= 4 ? high : !high, `${p} usage ${u}: high-use probes ${u >= 4 ? "present" : "absent"}`);
    const expected = 33 + (u <= 2 ? 1 : 0) + (u >= 4 ? 2 : 0);
    ok(items.length === expected, `${p} usage ${u}: ${items.length} screens (expected ${expected})`);
    // every id unique
    ok(ids.size === items.length, `${p} usage ${u}: no duplicate item ids`);
  }
  console.log(`  ${p}: ${row.join("  ")}`);
}

console.log("\n== persona banks are disjoint in prompt text ==");
const prompts: Record<string, Set<string>> = {};
for (const p of personas) {
  prompts[p] = new Set(applicableItems(p, 3).filter(i => i.persona === p).map(i => i.prompt));
}
for (const a of personas) for (const b of personas) {
  if (a >= b) continue;
  const shared = [...prompts[a]].filter(x => prompts[b].has(x));
  ok(shared.length === 0, `${a} and ${b} share no prompt text`);
}

console.log(`\n${fail === 0 ? "ALL BRANCH CHECKS PASS" : fail + " FAILURES"}`);
process.exit(fail ? 1 : 0);
