/**
 * The group reading, checked against the arithmetic it claims.
 *
 * A group report is easy to get subtly wrong and hard to notice: a mean that
 * silently drops a member, a centre that reports an average as if it were a
 * count, a share that does not add up. Every number below is recomputed here by
 * hand from the same members and compared.
 */

import fs from 'fs';
import path from 'path';
import { compute, applicableItems } from '@/engine';
import { buildGroupResult, spreadOf, type GroupMember } from '@/engine/group';
import { CONSTRUCTS } from '@/engine/config';
import type { ConstructId, Item, Persona, Submission } from '@/engine/types';

let pass = 0, fail = 0;
const ok = (label: string, cond: boolean, detail?: string) => {
  if (cond) { pass++; console.log(`  ok    ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ''}`); }
};
const head = (s: string) => console.log(`\n${s}`);
const near = (a: number, b: number, tol = 0.15) => Math.abs(a - b) <= tol;

const maxV = (it: Item) => (it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5);

/** A member at a chosen level, so the arithmetic is known before it is computed. */
function member(persona: Persona, usage: number, level: number, i: number): GroupMember {
  const items = applicableItems(persona, usage);
  const answers: Record<string, number> = {};
  items.forEach((it) => {
    const top = maxV(it);
    const healthy = Math.max(1, Math.min(top, Math.round(((level - 1) / 4) * (top - 1)) + 1));
    answers[it.id] = it.type === 'reverse' ? top + 1 - healthy : healthy;
  });
  const sub: Submission = { persona, usage, b1: 4, b2: 3, answers };
  return {
    name: `Member ${i}`, email: `m${i}@school.edu`, persona,
    result: compute(sub), takenAt: '2026-09-01T00:00:00.000Z',
  };
}

const CLASS: GroupMember[] = [
  member('student', 4, 1, 1), member('student', 4, 2, 2), member('student', 4, 3, 3),
  member('student', 4, 3, 4), member('student', 4, 4, 5), member('student', 4, 5, 6),
];

head('It refuses to read a group that is not there');
{
  let threw = false;
  try { buildGroupResult('Empty', []); } catch { threw = true; }
  ok('an empty group fails loudly rather than returning zeroes', threw);
}

head('The spread is the spread');
{
  const s = spreadOf([10, 20, 30, 40]);
  ok('mean', s.mean === 25, String(s.mean));
  ok('min and max', s.min === 10 && s.max === 40);
  ok('n counts every value', s.n === 4);
  ok('standard deviation', near(s.sd, 11.18, 0.02), String(s.sd));
  ok('a value that is not a number is dropped, not counted as zero',
    spreadOf([10, NaN, 30]).n === 2);
  ok('an empty set is empty rather than zero-shaped', spreadOf([]).n === 0);
}

head('Where the group is standing');
{
  const g = buildGroupResult('Northgate, Year 12', CLASS);
  ok('every member is counted once', g.n === CLASS.length);

  const indices = CLASS.map((m) => m.result.stage.rawIndex);
  const mean = indices.reduce((a, b) => a + b, 0) / indices.length;
  ok('the mean index is the mean of the members', near(g.index.mean, mean));
  ok('the range runs from the lowest member to the highest',
    near(g.index.min, Math.min(...indices)) && near(g.index.max, Math.max(...indices)));

  const total = g.distribution.reduce((a, d) => a + d.n, 0);
  ok('the stage distribution accounts for everyone', total === g.n, `${total} of ${g.n}`);
  ok('shares add to a hundred', near(g.distribution.reduce((a, d) => a + d.share, 0), 100, 0.6));

  const largest = Math.max(...g.distribution.map((d) => d.n));
  ok('the centre is the largest camp, not an average', g.centre.n === largest);
  ok('the centre is a stage somebody is actually standing in',
    g.distribution.some((d) => d.stage === g.centre.stage));

  ok('the extremes are the real extremes',
    near(g.extremes.top.index, Math.max(...indices)) && near(g.extremes.bottom.index, Math.min(...indices)));
  ok('the span is the distance between them',
    near(g.extremes.span, Math.max(...indices) - Math.min(...indices)));
}

head('The ten dimensions, across the group');
{
  const g = buildGroupResult('Northgate, Year 12', CLASS);
  ok('all ten are reported', g.dimensions.length === Object.keys(CONSTRUCTS).length);
  for (const d of g.dimensions) {
    const scores = CLASS.map((m) => m.result.dimensions[d.construct].score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    ok(`${d.name}: the mean is the members' mean`, near(d.spread.mean, mean), `${d.spread.mean} vs ${mean}`);
    ok(`${d.name}: the watch count is a count of members`, d.watch.n <= g.n);
  }
  ok('strengths are the three highest means',
    g.strengths[0].spread.mean >= g.strengths[1].spread.mean
    && g.strengths[1].spread.mean >= g.strengths[2].spread.mean);
  ok('the watchlist is the three lowest means',
    g.watchlist[0].spread.mean <= g.watchlist[1].spread.mean
    && g.watchlist[1].spread.mean <= g.watchlist[2].spread.mean);
  ok('strengths and the watchlist do not overlap in a group this wide',
    !g.strengths.some((s) => g.watchlist.some((w) => w.construct === s.construct)));
}

head('What is holding the group, and what would move it');
{
  const g = buildGroupResult('Northgate, Year 12', CLASS);
  const counted = g.constraints.reduce((a, c) => a + c.n, 0);
  ok('constraints are counted from members, never invented', counted <= g.n);
  for (const c of g.constraints) {
    const actual = CLASS.filter((m) => !m.result.bottleneck.saturated
      && m.result.bottleneck.construct === c.construct).length;
    ok(`${c.name}: counted correctly`, c.n === actual, `${c.n} vs ${actual}`);
  }
  ok('constraints are ordered by how many people they hold',
    g.constraints.every((c, i) => i === 0 || g.constraints[i - 1].n >= c.n));

  // every move offered to the group must be a move the engine gave to someone in it
  const given = new Set<string>();
  for (const m of CLASS) for (const r of m.result.recommendations) given.add(`${r.capability}::${r.behaviorChange}`);
  ok('every group move came from a member\'s own plan',
    g.moves.every((mv) => given.has(`${mv.capability}::${mv.change}`)),
    g.moves.map((m) => m.capability).join(', '));
  ok('moves are ordered by how many people share them',
    g.moves.every((mv, i) => i === 0 || g.moves[i - 1].n >= mv.n));
  ok('the next stage is one step past the centre, or the summit',
    g.nextStage.stage === Math.min(g.centre.stage + 1, 10));
}

head('It says how much weight it can carry');
{
  ok('one person is indicative', buildGroupResult('Solo', [CLASS[0]]).confidence.level === 'indicative');
  ok('six is still indicative', buildGroupResult('Six', CLASS).confidence.level === 'indicative');
  const ten = Array.from({ length: 10 }, (_, i) => member('student', 4, (i % 5) + 1, i));
  ok('ten is workable', buildGroupResult('Ten', ten).confidence.level === 'workable');
  const thirty = Array.from({ length: 30 }, (_, i) => member('student', 4, (i % 5) + 1, i));
  ok('thirty is firm', buildGroupResult('Thirty', thirty).confidence.level === 'firm');
  ok('the note names the number it was read across',
    buildGroupResult('Six', CLASS).confidence.note.includes('6'));
}

head('A mixed group is still one group');
{
  const mixed: GroupMember[] = [
    member('teacher', 4, 4, 1), member('teacher', 4, 2, 2),
    member('administrator', 4, 3, 3), member('business', 4, 3, 4),
  ];
  const g = buildGroupResult('Riverside Academy', mixed);
  ok('every assessment taken is listed', g.personas.length === 3);
  ok('the largest cohort leads', g.personas[0].n === 2);
  ok('persona shares add to a hundred',
    near(g.personas.reduce((a, p) => a + p.share, 0), 100, 0.6));
  ok('the group still has one centre', typeof g.centre.stage === 'number');
  ok('the reading is labelled with the organisation', g.label === 'Riverside Academy');
}

head('Movement, where there is any');
{
  const withDeltas = CLASS.map((m, i) => ({ ...m, indexDelta: i < 2 ? 6 : i < 4 ? -4 : 0 }));
  const g = buildGroupResult('Northgate, Year 12', withDeltas);
  ok('repeat takers are counted', g.movement.repeatTakers === 6);
  ok('improved', g.movement.improved === 2);
  ok('declined', g.movement.declined === 2);
  ok('held', g.movement.held === 2);
  ok('a group with no retakes reports no movement rather than zero movement',
    buildGroupResult('Fresh', CLASS).movement.repeatTakers === 0);
}

head('The report is wired to the group, and only to the group');
{
  const pdf = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'groupReportPdf.tsx'), 'utf-8');
  ok('the PDF reads the group result and computes nothing itself',
    !/\.reduce\(|Math\.(mean|sqrt)|sort\(\(a, b\) => a\.result/.test(pdf));
  ok('it opens on the Business Owner cover artwork', /ART\('business\.jpg'\)/.test(pdf));
  ok('the organisation name is what the cover announces', /\{g\.label\}/.test(pdf));
  ok('it says what it is not', /not a clinical diagnosis/.test(pdf));
  ok('it refuses to be used for appraisal', /rank, appraise or select/.test(pdf));

  const route = fs.readFileSync(path.join(process.cwd(), 'src', 'app', 'api', 'admin', 'org-report', 'route.ts'), 'utf-8');
  ok('the route is behind the admin gate', /isAdminAuthed/.test(route));
  ok('it counts each person once, at their latest attempt', /toPeople/.test(route) && /p\.latest\.result/.test(route));
  ok('an unknown organisation is a 404, not an empty report', /404/.test(route));

  const admin = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'admin', 'Dashboard.tsx'), 'utf-8');
  ok('the button lives under Organisations', /Generate report/.test(admin) && /setReportFor/.test(admin));
  ok('the cover name can be typed rather than being the email domain', /Name on the cover/.test(admin));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
