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
    key: `r${i}`, persona, usage, felt: 4, predicted: 3,
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
  ok('mean is kept for the export', s.mean === 25, String(s.mean));
  ok('min and max', s.min === 10 && s.max === 40);
  ok('n counts every value', s.n === 4);
  ok('standard deviation', near(s.sd, 11.18, 0.02), String(s.sd));
  ok('quartiles', spreadOf([10, 20, 30, 40]).q1 <= spreadOf([10, 20, 30, 40]).q3);
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
  ok('the mean is available for the export', near(g.index.mean, mean));
  ok('the median leads', g.index.median > 0);
  ok('the range runs from the lowest member to the highest',
    near(g.index.min, Math.min(...indices)) && near(g.index.max, Math.max(...indices)));

  const total = g.distribution.reduce((a, d) => a + d.n, 0);
  ok('the stage distribution accounts for everyone', total === g.n, `${total} of ${g.n}`);
  ok('shares add to a hundred', near(g.distribution.reduce((a, d) => a + d.share, 0), 100, 0.6));

  const largest = Math.max(...g.distribution.map((d) => d.n));
  ok('the centre is the largest camp, not an average', g.centre.n === largest);
  ok('the centre is a stage somebody is actually standing in',
    g.distribution.some((d) => d.stage === g.centre.stage));

  ok('the range is the real range',
    near(g.index.min, Math.min(...indices)) && near(g.index.max, Math.max(...indices)));
  ok('quartiles are printed, not only a chart', g.index.q1 <= g.index.median && g.index.median <= g.index.q3);
}

head('The ten dimensions, across the group');
{
  const g = buildGroupResult('Northgate, Year 12', CLASS);
  ok('all ten are reported', g.dimensions.length === Object.keys(CONSTRUCTS).length);
  for (const d of g.dimensions) {
    const scores = CLASS.map((m) => m.result.dimensions[d.construct].score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    ok(`${d.name}: the mean matches the members`, near(d.spread.mean, mean), `${d.spread.mean} vs ${mean}`);
    ok(`${d.name}: quartiles are ordered`, d.spread.q1 <= d.spread.median && d.spread.median <= d.spread.q3);
    ok(`${d.name}: band counts add to the group`,
      d.bands.strong.n + d.bands.developing.n + d.bands.watch.n === g.n);
  }
  ok('strengths are the three highest medians',
    g.strengths[0].spread.median >= g.strengths[1].spread.median
    && g.strengths[1].spread.median >= g.strengths[2].spread.median);
  ok('the watchlist is the three lowest medians',
    g.watchlist[0].spread.median <= g.watchlist[1].spread.median
    && g.watchlist[1].spread.median <= g.watchlist[2].spread.median);
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
  const big = buildGroupResult('Thirty', thirty);
  ok('thirty is firm', big.confidence.level === 'firm');
  ok('below thirty, no confidence interval', buildGroupResult('Six', CLASS).index.ci === undefined);
  ok('at thirty, an interval appears', !!big.index.ci);
  ok('below thirty, no correlations', buildGroupResult('Six', CLASS).correlations.length === 0);
  ok('at thirty, correlations appear', big.correlations.length === 3);
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
  ok('the median change is reported', typeof g.movement.medianDelta === 'number');
  ok('improved', g.movement.improved === 2);
  ok('declined', g.movement.declined === 2);
  ok('held', g.movement.held === 2);
  ok('a group with no retakes reports no movement rather than zero movement',
    buildGroupResult('Fresh', CLASS).movement.repeatTakers === 0);
}

head('Nobody is named, ranked or singled out');
{
  const g = buildGroupResult('Northgate, Year 12', CLASS);
  const json = JSON.stringify(g);
  ok('no member key reaches the reading', !CLASS.some((m) => json.includes(m.key)));
  ok('there is no extremes block at all', !('extremes' in (g as unknown as Record<string, unknown>)));
  const pdf = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'groupReportPdf.tsx'), 'utf-8');
  ok('the report never prints a member label',
    !/furthest along|earliest on the route|\bm\.label\b|extremes\./i.test(pdf));
}

head('Segments are suppressed rather than shown thin');
{
  // 9 and 3: the small side is too thin, and the large side is withheld too,
  // because naming it would leave the other three identifiable by subtraction
  const lopsided = buildGroupResult('Riverside', [
    ...Array.from({ length: 9 }, (_, i) => member('student', 4, 3, i)),
    ...Array.from({ length: 3 }, (_, i) => member('teacher', 4, 3, 100 + i)),
  ]).segments.filter((s2) => s2.dimension === 'Assessment');
  ok('a segment of three is withheld', !!lopsided.find((s2) => s2.n === 3)?.suppressed);
  ok('the withheld segment carries no figures', lopsided.find((s2) => s2.n === 3)?.index === undefined);
  ok('its complement is withheld too, or subtraction identifies the three',
    !!lopsided.find((s2) => s2.n === 9)?.suppressed);

  // 9 and 8: both sides clear the threshold, so both are reported
  const even = buildGroupResult('Riverside', [
    ...Array.from({ length: 9 }, (_, i) => member('student', 4, 3, i)),
    ...Array.from({ length: 8 }, (_, i) => member('teacher', 4, 3, 100 + i)),
  ]).segments.filter((s2) => s2.dimension === 'Assessment');
  ok('both sides are shown when both clear the threshold',
    even.every((s2) => !s2.suppressed) && even.length === 2);
  ok('a shown segment carries quartiles',
    (even[0].index?.q3 ?? 0) >= (even[0].index?.q1 ?? 0));
  const solo = buildGroupResult('Solo', [CLASS[0]]);
  ok('a one person group suppresses every segment', solo.segments.every((s2) => s2.suppressed));
}

head('It prints what produced it');
{
  const g = buildGroupResult('Northgate, Year 12', CLASS);
  ok('instrument, scoring, scenario and language versions travel with the reading',
    !!(g.versions.instrument && g.versions.scoring && g.versions.scenario && g.versions.language));
  ok('one canonical band table', g.bands.strength === 65 && g.bands.vulnerability === 45);
  ok('the window it covers is recorded', !!g.window.first && !!g.window.last);
  ok('polarisation is flagged per dimension',
    g.dimensions.every((d) => typeof d.polarised === 'boolean'));
  ok('bottleneck concentration is reported with a reading',
    typeof g.concentration.share === 'number' && !!g.concentration.reading);
  ok('what is not collected is stated rather than estimated', g.headline.notCollected.length >= 5);
}

head('The report is wired to the group, and only to the group');
{
  const pdf = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'groupReportPdf.tsx'), 'utf-8');
  ok('the PDF reads the group result and computes nothing itself',
    !/Math\.sqrt|sort\(\(a, b\) => a\.result/.test(pdf));
  ok('the cover can carry the organisation\'s own logo', /p\?\.logo/.test(pdf));
  ok('an empty cover field renders nothing', /subtitle \? \(/.test(pdf));
  ok('the four partners appear on the cover', /In partnership with/.test(pdf));
  ok('the appendix prints the band table', /The band table/.test(pdf));
  ok('the two dependency names are distinguished', /Two names that are not the same thing/.test(pdf));
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
