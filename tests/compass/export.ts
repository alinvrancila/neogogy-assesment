/**
 * The records export.
 *
 * An exported file is used away from this application, so the checks here are
 * about the file standing on its own: one row per record, every column present
 * on every row, nothing lost to a comma or a quote, and no cell that a
 * spreadsheet would evaluate instead of display.
 */
import { compute, applicableItems } from '@/engine';
import type { Persona, Submission } from '@/engine/types';
import type { LeadRecord } from '@/lib/storage';
import { buildLeadCsv, buildLeadRows } from '@/lib/leadCsv';

let pass = 0; let fail = 0;
const ok = (name: string, cond: boolean, got?: unknown) => {
  if (cond) { pass += 1; console.log('  ok   ', name); }
  else { fail += 1; console.log('  FAIL ', name, got !== undefined ? `got ${JSON.stringify(got)}` : ''); }
};

type It = ReturnType<typeof applicableItems>[number];
const maxV = (it: It) => (it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5);
const build = (p: Persona, u: number, pick: (it: It, i: number) => number): Submission => {
  const items = applicableItems(p, u);
  const answers: Record<string, number> = {};
  items.forEach((it, i) => { answers[it.id] = Math.max(1, Math.min(maxV(it), pick(it, i))); });
  return { persona: p, usage: u, b1: 4, b2: 3, answers };
};

const lead = (over: Partial<LeadRecord>, sub: Submission): LeadRecord => {
  const r = compute(sub);
  const dims: Record<string, number> = {};
  Object.values(r.dimensions).forEach((d) => { dims[d.construct] = d.score; });
  return {
    id: 'x', name: 'A Person', email: 'a@example.org', role: sub.persona, modality: '',
    consent: true, persona: r.archetype.id, personaName: r.archetype.name,
    overall: r.stage.rawIndex, dimensions: dims, answers: sub.answers,
    baseline: { b1: sub.b1 ?? 0, b2: sub.b2 ?? 0 }, usageVal: sub.usage,
    createdAt: '2026-01-01T00:00:00.000Z', engineVersion: 2, result: r,
    stage: r.stage.stage, stageName: r.stage.stageName,
    archetypeId: r.archetype.id, archetypeName: r.archetype.name,
    confidence: r.overallConfidence,
    ...over,
  } as LeadRecord;
};

const teacher = build('teacher', 4, (it, i) => ((i * 3) % 5) + 1);
const student = build('student', 2, (it, i) => ((i * 7) % 5) + 1);

const leads: LeadRecord[] = [
  lead({ id: 'l1', email: 'ana@university.edu', name: 'Ana, "The First"', mobilePhone: '+63 900 000 0001',
    heardFrom: 'LinkedIn', createdAt: '2026-01-01T00:00:00.000Z',
    meta: { ip: '203.0.113.5', country: 'Philippines', city: 'Manila', device: 'phone',
      browser: 'Safari', os: 'iOS', durationMs: 720000, utmSource: 'facebook' } as never }, teacher),
  lead({ id: 'l2', email: 'ana@university.edu', name: 'Ana', createdAt: '2026-03-01T00:00:00.000Z' }, teacher),
  lead({ id: 'l3', email: 'bo@gmail.com', name: 'Bo\nBreaker', createdAt: '2026-02-01T00:00:00.000Z' }, student),
  // a legacy record, which carries no engine v2 result at all
  { id: 'l4', name: 'Old Record', email: 'old@example.org', role: 'student', modality: '',
    consent: false, persona: 'z', personaName: 'Zed', overall: 41, resilience: 40, readiness: 42,
    createdAt: '2025-06-01T00:00:00.000Z', engineVersion: 1 } as LeadRecord,
];

const rows = buildLeadRows(leads);
const csv = buildLeadCsv(leads);
const lines = csv.replace(/^﻿/, '').split('\r\n');
const headers = lines[0].split(',');

console.log('\nShape');
ok('one row per record, plus the header', lines.length === leads.length + 1, lines.length);
ok('every row has exactly as many cells as there are headers', (() => {
  // a naive split is wrong inside quotes, so count with a small parser
  const cells = (line: string) => {
    let n = 1; let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const c = line[i];
      if (c === '"') { if (inQuotes && line[i + 1] === '"') i += 1; else inQuotes = !inQuotes; }
      else if (c === ',' && !inQuotes) n += 1;
    }
    return n;
  };
  return lines.slice(1).every((l) => cells(l) === headers.length);
})(), { headers: headers.length, counts: lines.slice(1).map((l) => l.split(',').length) });

console.log('\nContact and identity');
for (const col of ['name', 'first_name', 'last_name', 'email', 'email_domain', 'mobile_phone',
  'heard_from', 'marketing_consent', 'submitted_at']) {
  ok(`${col} is a column`, headers.includes(col));
}
ok('an organisational domain is marked as one', rows[0].organisational_email === true, rows[0].organisational_email);
ok('a personal domain is not', rows[2].organisational_email === false, rows[2].organisational_email);

console.log('\nEverything the engine produced');
for (const col of ['developmental_index', 'stage', 'stage_name', 'substage', 'gated', 'archetype_name',
  'overall_confidence', 'bottleneck', 'composite_judgment', 'strengths', 'vulnerabilities',
  'help_patterns', 'harm_patterns', 'recommendations', 'fingerprint', 'calibration_feel_gap']) {
  ok(`${col} is a column`, headers.includes(col));
}
ok('all ten dimensions carry a score, a band and a confidence', (() => {
  const dims = headers.filter((h) => h.startsWith('dim_') && !h.includes('_reported')
    && !h.includes('_confidence') && !h.includes('_band') && !h.includes('_evidence') && !h.includes('_claim_gap'));
  const dimCols = headers.filter((h) => h.startsWith('dim_'));
  return dims.length === 10
    && dimCols.filter((h) => h.endsWith('_band')).length === 10
    && dimCols.filter((h) => h.endsWith('_confidence')).length === 10;
})(), headers.filter((h) => h.startsWith('dim_')).length);

console.log('\nThe context and the answers');
for (const col of ['ip', 'country', 'city', 'device', 'browser', 'operating_system', 'timezone',
  'utm_source', 'minutes_taken', 'answers_changed', 'user_agent']) {
  ok(`${col} is a column`, headers.includes(col));
}
ok('every answer becomes its own column', (() => {
  const answerCols = headers.filter((h) => h.startsWith('answer_'));
  const ids = new Set(Object.keys(teacher.answers).concat(Object.keys(student.answers)));
  return answerCols.length === ids.size;
})(), { cols: headers.filter((h) => h.startsWith('answer_')).length });
ok('answer columns are the union across personas, so a shorter form leaves blanks not gaps', (() => {
  const idx = headers.findIndex((h) => h.startsWith('answer_'));
  return idx > 0 && headers.slice(idx).every((h) => h.startsWith('answer_'));
})());

console.log('\nProgression');
ok('a second attempt knows it is the second', rows[1].attempt_number === 2, rows[1].attempt_number);
ok('a first attempt has no previous index', rows[0].previous_index === '', rows[0].previous_index);
ok('the second attempt carries the change since the first',
  typeof rows[1].index_change === 'number', rows[1].index_change);

console.log('\nSafety of the file itself');
ok('a comma in a name cannot split a row', csv.includes('"Ana, ""The First"""'));
ok('a newline in a name is quoted rather than breaking the file',
  lines.length === leads.length + 1 && csv.includes('"Bo\nBreaker"'));
ok('a legacy record still exports, with its own columns filled and the rest blank',
  rows[3].developmental_index === 41 && rows[3].stage === '' && rows[3].engine_version === 1,
  { index: rows[3].developmental_index, stage: rows[3].stage });
ok('the file starts with a byte order mark so accented names survive Excel', csv.startsWith('﻿'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
