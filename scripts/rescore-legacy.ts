/**
 * Rescore stored v1 submissions under the v2 engine.
 *
 * Dry run by default: prints a v1 persona versus v2 archetype and stage
 * distribution table and writes nothing. Pass --write to persist.
 *
 * The v2 result is written alongside the v1 record, never over it. Every
 * rescored record is tagged rescoredFrom: "0.1.2". Amplification and skill
 * growth had no evidence in v1, so rescored records carry preliminary or
 * insufficient confidence on those dimensions by design; that gap is real and
 * is never backfilled with invented certainty.
 *
 * This script sends no email.
 */
import { listLeads, saveLead, type LeadRecord } from '../src/lib/storage';
import { resolveLeadResult } from '../src/lib/leadResult';
import type { CompassResult } from '../src/engine';

const WRITE = process.argv.includes('--write');
const SOURCE_VERSION = '0.1.2';

const pad = (s: string | number, n: number) => String(s).padEnd(n);
const padL = (s: string | number, n: number) => String(s).padStart(n);

async function main() {
  const leads = await listLeads();
  const legacy = leads.filter((l) => l.engineVersion !== 2);

  console.log(`\nFormation Compass legacy rescoring ${WRITE ? '(WRITE)' : '(dry run)'}`);
  console.log(`Stored records: ${leads.length}. Already v2: ${leads.length - legacy.length}. To rescore: ${legacy.length}.`);

  if (!legacy.length) {
    console.log('\nNothing to do.');
    return;
  }

  const rows: Array<{ lead: LeadRecord; result: CompassResult }> = [];
  const skipped: string[] = [];

  for (const lead of legacy) {
    const resolved = resolveLeadResult(lead);
    if (!resolved.ok) { skipped.push(`${lead.id}: ${resolved.reason}`); continue; }
    rows.push({ lead, result: resolved.result });
  }

  // v1 persona -> v2 archetype and stage
  const cross = new Map<string, Map<string, number>>();
  const stageHist = new Map<number, number>();
  const confHist = new Map<string, number>();

  for (const { lead, result } of rows) {
    const from = lead.personaName || lead.persona || 'unknown';
    const to = `${result.archetype.name} (s${result.stage.stage})`;
    if (!cross.has(from)) cross.set(from, new Map());
    const inner = cross.get(from)!;
    inner.set(to, (inner.get(to) ?? 0) + 1);
    stageHist.set(result.stage.stage, (stageHist.get(result.stage.stage) ?? 0) + 1);
    confHist.set(result.overallConfidence, (confHist.get(result.overallConfidence) ?? 0) + 1);
  }

  console.log(`\n${pad('v1 persona', 22)}${pad('v2 archetype (stage)', 42)}${padL('n', 5)}`);
  console.log('-'.repeat(69));
  for (const [from, inner] of [...cross.entries()].sort()) {
    const sorted = [...inner.entries()].sort((a, b) => b[1] - a[1]);
    sorted.forEach(([to, n], i) => {
      console.log(`${pad(i === 0 ? from : '', 22)}${pad(to, 42)}${padL(n, 5)}`);
    });
  }

  console.log(`\nStage distribution:`);
  [...stageHist.entries()].sort((a, b) => a[0] - b[0])
    .forEach(([s, n]) => console.log(`  stage ${padL(s, 2)}: ${padL(n, 4)}  ${'#'.repeat(Math.min(40, n))}`));

  console.log(`\nOverall confidence:`);
  [...confHist.entries()].sort()
    .forEach(([c, n]) => console.log(`  ${pad(c, 14)}${padL(n, 4)}`));

  // Dimensions with no v1 evidence keep lowered confidence by design.
  const lowConf = rows.filter(({ result }) =>
    result.dimensions.amplification.confidence === 'insufficient' ||
    result.dimensions.amplification.confidence === 'preliminary').length;
  console.log(`\nRecords whose amplification confidence is preliminary or insufficient: ${lowConf} of ${rows.length}.`);
  console.log('That is expected: v1 collected no amplification or skill growth evidence.');

  if (skipped.length) {
    console.log(`\nSkipped ${skipped.length}:`);
    skipped.slice(0, 20).forEach((s) => console.log(`  ${s}`));
  }

  if (!WRITE) {
    console.log(`\nDry run. Nothing was written. Re-run with --write to persist.`);
    return;
  }

  let written = 0;
  for (const { lead, result } of rows) {
    const dimensionScores: Record<string, number> = {};
    Object.values(result.dimensions).forEach((d) => { dimensionScores[d.construct] = d.score; });
    // The v1 record is preserved: persona, personaName, resilience, readiness and
    // overall stay exactly as they were. The v2 view is added beside them.
    await saveLead({
      ...lead,
      engineVersion: 2,
      result,
      stage: result.stage.stage,
      stageName: result.stage.stageName,
      archetypeId: result.archetype.id,
      archetypeName: result.archetype.name,
      confidence: result.overallConfidence,
      rescoredFrom: SOURCE_VERSION,
      dimensions: dimensionScores,
    });
    written++;
  }
  console.log(`\nWrote ${written} rescored records, tagged rescoredFrom: ${SOURCE_VERSION}.`);
  console.log('No email was sent.');
}

main().catch((e) => { console.error(e); process.exit(1); });
