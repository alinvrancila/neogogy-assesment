/**
 * Every quotation in the Pastor and Preacher persona, checked against the
 * source documents on disk.
 *
 * This report tells a preacher never to preach a quotation they have not seen
 * in its source. It has to hold itself to the same rule, and a rule that is not
 * tested is an intention. When the sources are not present the check reports
 * that it could not run rather than passing quietly.
 */
import fs from "fs";
import path from "path";
import { allItems } from "../../src/engine";
import { PERSONA_DISPLAY } from "../../src/engine/display";
import type { ConstructId } from "../../src/engine/types";

let pass = 0; let fail = 0;
const ok = (name: string, cond: boolean, got?: unknown) => {
  if (cond) { pass += 1; console.log("  ok   ", name); }
  else { fail += 1; console.log("  FAIL ", name, got !== undefined ? `got ${JSON.stringify(got)}` : ""); }
};

const DIR = path.join(process.cwd(), "docs", "compass", "sources", "pastor");
const norm = (s: string) => s
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  .replace(/[–—]/g, "-").replace(/\s+/g, " ").toLowerCase();

const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".txt")) : [];
const corpus = files.map((f) => norm(fs.readFileSync(path.join(DIR, f), "utf-8")));

if (!corpus.length) {
  console.log("\nSource documents are not present, so quotations could not be checked.");
  console.log("Put them in docs/compass/sources/pastor/originals and run scripts/ingest-sources.sh.");
  console.log("\n0 passed, 0 failed (not run)");
  process.exit(0);
}

/** Anything inside curly or straight double quotes is a claim about a source. */
function quotedRuns(text: string): string[] {
  const out: string[] = [];
  const re = /[“"]([^”"]{18,})[”"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(m[1]);
  return out;
}

const inCorpus = (q: string) => corpus.some((t) => t.includes(norm(q)));

console.log(`\nChecking against ${files.length} source documents`);

const items = allItems("pastor").filter((i) => i.persona === "pastor");
const itemQuotes = items.flatMap((i) => quotedRuns(i.deeper ?? "").map((q) => ({ id: i.id, q })));
const missingItems = itemQuotes.filter((x) => !inCorpus(x.q));
ok(`every quotation in the ${itemQuotes.length} item pointers is in a source document`,
  missingItems.length === 0, missingItems);

const d = PERSONA_DISPLAY.pastor!;
const contentQuotes = Object.entries(d.content ?? {}).flatMap(([id, c]) =>
  quotedRuns(c?.research?.claim ?? "").map((q) => ({ id: id as ConstructId, q })));
const missingContent = contentQuotes.filter((x) => !inCorpus(x.q));
ok("every quotation in the dimension content is in a source document",
  missingContent.length === 0, missingContent);

const archQuotes = Object.entries(d.archetypes ?? {}).flatMap(([id, a]) =>
  quotedRuns(a.narrative ?? "").map((q) => ({ id, q })));
ok("every quotation in the archetype narratives is in a source document",
  archQuotes.every((x) => inCorpus(x.q)), archQuotes.filter((x) => !inCorpus(x.q)));

// the closing Scripture, which is quoted verbatim on screen and in the file
const closings = fs.readFileSync(
  path.join(process.cwd(), "src", "components", "compass", "PastorModules.tsx"), "utf-8");
const closingBlock = closings.slice(closings.indexOf("const CLOSINGS"), closings.indexOf("export function PastorClosing"));
const verses = [...closingBlock.matchAll(/text:\s*'((?:[^'\\]|\\.)*)'/g)]
  .map((m) => m[1]
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\'/g, "'"));
const unverified = verses.filter((v) => !inCorpus(v));
ok(`every closing verse (${verses.length}) is quoted from a source document`,
  unverified.length === 0, unverified.map((v) => v.slice(0, 60)));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
