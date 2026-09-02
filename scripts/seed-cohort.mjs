/**
 * A synthetic cohort, so the group report can be rendered and inspected.
 *
 * Fifty respondents on one domain, spread across the route, with retakes for a
 * fifth of them and both calibration answers present. It writes into the local
 * data/leads.json fallback only: it will refuse to run when DynamoDB is
 * configured, because seeding a real table with invented people is not a thing
 * a script should be able to do by accident.
 *
 *   node scripts/seed-cohort.mjs [domain] [count]
 */

import fs from 'fs/promises';
import path from 'path';
import { execFileSync } from 'child_process';

if (process.env.LEADS_TABLE) {
  console.error('LEADS_TABLE is set. This script only writes the local fallback file.');
  process.exit(1);
}

const domain = process.argv[2] || 'northgate.edu';
const count = Number(process.argv[3] || 50);
const out = path.join(process.cwd(), 'data', 'leads.json');

// The engine is TypeScript, so the results are computed by a tsx child rather
// than reimplemented here. One process, one JSON payload back.
const helper = path.join(process.cwd(), 'scripts', '.seed-cohort.helper.tsx');
await fs.writeFile(helper, `
import { compute, applicableItems } from '@/engine';
const [domain, count] = [process.argv[2], Number(process.argv[3])];
const PERSONAS = ['student', 'teacher', 'administrator', 'business'];
const maxV = (it) => (it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5);
const rows = [];
for (let i = 0; i < count; i++) {
  const persona = PERSONAS[i % (i < count * 0.7 ? 1 : PERSONAS.length)];
  const usage = 1 + (i % 5);
  const level = 1 + ((i * 3) % 5);
  const items = applicableItems(persona, usage);
  const answers = {};
  items.forEach((it, k) => {
    const top = maxV(it);
    const jitter = ((i + k) % 3) - 1;
    const lvl = Math.max(1, Math.min(5, level + jitter));
    const healthy = Math.max(1, Math.min(top, Math.round(((lvl - 1) / 4) * (top - 1)) + 1));
    answers[it.id] = it.type === 'reverse' ? top + 1 - healthy : healthy;
  });
  const b1 = 1 + ((i * 2) % 5), b2 = 1 + ((i * 3) % 5);
  rows.push({ persona, usage, b1, b2, answers, result: compute({ persona, usage, b1, b2, answers }) });
}
process.stdout.write(JSON.stringify(rows));
`, 'utf-8');

const raw = execFileSync('npx', ['tsx', helper, domain, String(count)], {
  maxBuffer: 64 * 1024 * 1024, encoding: 'utf-8',
});
await fs.rm(helper, { force: true });
const rows = JSON.parse(raw);

const day = (n) => new Date(Date.UTC(2026, 5, 1 + n)).toISOString();
const leads = [];
rows.forEach((r, i) => {
  const base = {
    email: `person${i + 1}@${domain}`,
    name: `Respondent ${i + 1}`,
    persona: r.persona,
    engineVersion: 2,
    consent: true,
    submission: { persona: r.persona, usage: r.usage, b1: r.b1, b2: r.b2, answers: r.answers },
    result: r.result,
  };
  // A fifth of the cohort took it twice, so movement has something to read.
  if (i % 5 === 0) {
    leads.push({ ...base, id: `seed-${i + 1}-a`, createdAt: day(i % 20) });
  }
  leads.push({ ...base, id: `seed-${i + 1}`, createdAt: day(60 + (i % 20)) });
});

await fs.mkdir(path.dirname(out), { recursive: true });
let existing = [];
try { existing = JSON.parse(await fs.readFile(out, 'utf-8')); } catch { existing = []; }
const kept = existing.filter((l) => !String(l.id || '').startsWith('seed-'));
await fs.writeFile(out, JSON.stringify([...kept, ...leads], null, 2), 'utf-8');
console.log(`Seeded ${leads.length} records for ${count} people on ${domain} into ${out}.`);
console.log('Remove them with: node -e "..." or by deleting ids beginning seed-.');
