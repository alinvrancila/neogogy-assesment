/**
 * The whole instrument, in one document.
 *
 * A backup that a person can read without a checkout: the logic in prose, every
 * question in every edition, and the engine source verbatim. Built from the
 * source itself rather than written alongside it, so it cannot drift.
 *
 *   node scripts/export-backup.mjs
 *
 * Writes HTML, then converts with macOS textutil, which is already on the
 * machine and needs no dependency.
 */

import fs from 'fs/promises';
import path from 'path';
import { execFileSync } from 'child_process';

const root = process.cwd();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const read = (p) => fs.readFile(path.join(root, p), 'utf-8');

const ENGINE = [
  ['types.ts', 'The type system: every shape the engine produces'],
  ['config.ts', 'The ten dimensions, the ten stages, the gates, the band table, versions'],
  ['scoring.ts', 'How answers become dimension scores'],
  ['continuum.ts', 'How dimension scores become a stage, with gating and the constraint'],
  ['patterns.ts', 'Compound findings: what fires when dimensions combine'],
  ['archetypes.ts', 'The nine profiles'],
  ['recommendations.ts', 'How practices are chosen'],
  ['firstStep.ts', 'The first step, per dimension per direction of risk'],
  ['narrative.ts', 'How a result becomes a report'],
  ['content.ts', 'Dimension and stage prose, in all three directions'],
  ['display.ts', 'Per-edition naming and content'],
  ['group.ts', 'The group reading'],
  ['business.ts', 'Business Owner: risk register and ninety day plan'],
  ['pastor.ts', 'Minister: dependence check and formation roadmap'],
  ['index.ts', 'The public surface'],
];
const ITEMS = [
  ['shared.ts', 'Items common to every edition, and the scales'],
  ['student.ts', 'Student edition'],
  ['teacher.ts', 'Teacher edition'],
  ['parent.ts', 'Parent edition'],
  ['administrator.ts', 'Leader and Administrator edition'],
  ['pastor.ts', 'Minister and Preacher edition'],
  ['business.ts', 'Business Owner edition'],
  ['professional.ts', 'Professional edition'],
];
const DOCS = [
  ['docs/humanAdvantage/ARCHITECTURE.md', 'Architecture'],
  ['docs/humanAdvantage/HANDOVER.md', 'Handover'],
  ['docs/humanAdvantage/LIMITATIONS-AND-VALIDATION.md', 'Limitations and validation'],
  ['docs/DATA-COLLECTED.md', 'Every field recorded'],
];

// The questions, rendered as a person answers them, per edition.
async function questionBank() {
  const { PERSONA_CONTENT } = await import(`file://${root}/node_modules/.bin/../../src/content/personas.ts`)
    .catch(() => ({ PERSONA_CONTENT: null }));
  return PERSONA_CONTENT;
}

let html = `<html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,Georgia,serif;font-size:11pt;line-height:1.45}
h1{font-size:22pt;page-break-before:always}
h1:first-of-type{page-break-before:avoid}
h2{font-size:15pt;margin-top:22pt}
h3{font-size:12pt;margin-top:16pt}
pre{font-family:Menlo,monospace;font-size:7.5pt;line-height:1.3;white-space:pre-wrap;
    background:#f6f2ec;padding:8pt;border:1px solid #ddd}
.meta{color:#666;font-size:9pt}
td,th{border:1px solid #ccc;padding:4pt;font-size:9pt;text-align:left;vertical-align:top}
table{border-collapse:collapse;width:100%}
</style></head><body>`;

html += `<h1>Neogogy Human Advantage Assessment</h1>
<p class="meta">Complete logic and source, exported ${new Date().toISOString().slice(0, 10)}.
Generated from the repository by scripts/export-backup.mjs.</p>
<p>This document is a backup. It contains the reasoning behind the instrument,
every question in every edition, and the full source of the scoring engine. It is
generated from the code rather than written beside it, so what is printed here is
what runs.</p>`;

for (const [file, title] of DOCS) {
  try {
    html += `<h1>${esc(title)}</h1><pre>${esc(await read(file))}</pre>`;
  } catch { /* a missing doc is not worth failing the export for */ }
}

html += `<h1>The questions, as they are asked</h1>`;
const banks = JSON.parse(execFileSync('npx', ['tsx', 'scripts/.dump-items.tsx'], {
  cwd: root, maxBuffer: 64 * 1024 * 1024, encoding: 'utf-8',
}));
for (const set of banks) {
  html += `<h2>${esc(set.name)}</h2><p class="meta">${set.count} screens. ${esc(set.title)}</p>`;
  for (const it of set.items) {
    html += `<h3>${esc(it.construct || it.type)} &middot; ${esc(it.id)}</h3>`;
    html += `<p><strong>${esc(it.prompt)}</strong></p>`;
    if (it.context) html += `<p class="meta">${esc(it.context)}</p>`;
    if (it.why) html += `<p class="meta">Why we ask this: ${esc(it.why)}</p>`;
    if (it.options?.length) {
      html += '<table><tr><th>Value</th><th>Answer</th></tr>';
      for (const o of it.options) html += `<tr><td>${o.value}</td><td>${esc(o.label)}</td></tr>`;
      html += '</table>';
    } else if (it.scaleLabels) {
      html += `<p class="meta">Scale: ${it.scaleLabels.map(esc).join(' / ')}</p>`;
    }
    html += `<p class="meta">Type ${esc(it.type)}${it.riskSignal ? `, signal ${esc(it.riskSignal)}` : ''}</p>`;
  }
}

html += `<h1>The engine</h1>`;
for (const [file, why] of ENGINE) {
  html += `<h2>src/engine/${esc(file)}</h2><p class="meta">${esc(why)}</p>`;
  html += `<pre>${esc(await read(`src/engine/${file}`))}</pre>`;
}
html += `<h1>The item banks, as source</h1>`;
for (const [file, why] of ITEMS) {
  html += `<h2>src/items/${esc(file)}</h2><p class="meta">${esc(why)}</p>`;
  html += `<pre>${esc(await read(`src/items/${file}`))}</pre>`;
}

html += '</body></html>';

const out = path.join(process.env.HOME, 'Desktop', 'Neogogy_Human_Advantage_Assessment_Backup');
await fs.writeFile(`${out}.html`, html, 'utf-8');
execFileSync('textutil', ['-convert', 'docx', `${out}.html`, '-output', `${out}.docx`]);
await fs.rm(`${out}.html`);
const { size } = await fs.stat(`${out}.docx`);
console.log(`${out}.docx  (${Math.round(size / 1024)}KB)`);
