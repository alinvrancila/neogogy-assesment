/**
 * The map and the ladder must agree with the stage the report names.
 *
 * When a gate holds a placement, the raw index is higher than the position the
 * respondent actually occupies. Plotting the raw index puts the marker past
 * camps the same page says are not reached, which is the defect these checks
 * exist to catch.
 */
import { compute, applicableItems } from '@/engine';
import type { Persona, Submission } from '@/engine/types';
import { STAGES } from '@/engine/config';
import { pointAtIndex } from '@/components/compass/ascent/route';

let pass = 0; let fail = 0;
const ok = (name: string, cond: boolean, got?: unknown) => {
  if (cond) { pass += 1; console.log('  ok   ', name); }
  else { fail += 1; console.log('  FAIL ', name, got !== undefined ? `got ${JSON.stringify(got)}` : ''); }
};

type It = ReturnType<typeof applicableItems>[number];
const maxV = (it: It) => (it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5);
const healthiest = (it: It) => (it.type === 'reverse' ? 1 : maxV(it));
const unhealthiest = (it: It) => (it.type === 'reverse' ? maxV(it) : 1);
const build = (p: Persona, u: number, pick: (it: It) => number): Submission => {
  const items = applicableItems(p, u);
  const answers: Record<string, number> = {};
  items.forEach((it) => { answers[it.id] = pick(it); });
  return { persona: p, usage: u, b1: 4, b2: 3, answers };
};

// verification held low against otherwise healthy answers is the canonical gate
const gated = compute(build('teacher', 5, (it) => (it.construct === 'verification' ? unhealthiest(it) : healthiest(it))));
const open = compute(build('teacher', 5, healthiest));

console.log('\nA gated placement');
const campOf = (stage: number) => STAGES.find((s) => s.stage === stage)!.minIndex;
const nextCampOf = (stage: number) => STAGES.find((s) => s.stage === stage + 1)?.minIndex ?? 100;

// what the map draws for a held climber: their own camp, not the top of the band
const drawn = (r: typeof gated) => (r.stage.gated ? campOf(r.stage.stage) : r.stage.index);

ok('the engine caps the placement below the raw score',
  !!gated.stage.gated && gated.stage.index < gated.stage.rawIndex,
  { index: gated.stage.index, raw: gated.stage.rawIndex });
ok('the engine cap alone lands within a whisker of the next camp, which is why the map cannot use it',
  nextCampOf(gated.stage.stage) - gated.stage.index < 2,
  { gap: nextCampOf(gated.stage.stage) - gated.stage.index });
ok('the map instead stands the climber on their own camp',
  drawn(gated) === campOf(gated.stage.stage), drawn(gated));
ok('the marker is a clear distance behind the next camp', (() => {
  const a = pointAtIndex(drawn(gated));
  const b = pointAtIndex(nextCampOf(gated.stage.stage));
  return b.x - a.x > 60;
})(), { markerX: pointAtIndex(drawn(gated)).x, nextX: pointAtIndex(nextCampOf(gated.stage.stage)).x });
ok('the raw score reaches a camp the drawn position has not', (() => {
  const capped = gated.stage.gated!.cappedFrom;
  const beyond = STAGES.find((s) => s.stage === capped)!;
  return gated.stage.rawIndex >= beyond.minIndex && drawn(gated) < beyond.minIndex;
})());
ok('the marker sits behind the point the raw score would reach',
  pointAtIndex(drawn(gated)).x < pointAtIndex(gated.stage.rawIndex).x);
ok('no camp beyond the named stage counts as reached',
  STAGES.filter((s) => s.stage > gated.stage.stage).every((s) => !(drawn(gated) >= s.minIndex)));

console.log('\nAn ungated placement');
ok('placement and raw score are the same number', open.stage.index === open.stage.rawIndex,
  { index: open.stage.index, raw: open.stage.rawIndex });
ok('the marker is unmoved', pointAtIndex(drawn(open)).x === pointAtIndex(open.stage.rawIndex).x);
ok('an ungated marker keeps its exact index rather than snapping to a camp',
  drawn(open) === open.stage.rawIndex);
ok('every camp up to the named stage counts as reached', (() => {
  const upTo = STAGES.filter((s) => s.stage <= open.stage.stage);
  return upTo.every((s) => open.stage.index >= s.minIndex);
})());

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
