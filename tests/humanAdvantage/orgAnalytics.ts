/**
 * The organisation aggregate, proved before anything renders it.
 *
 * Phase 3 of the brief: the data layer is correct before the UI exists, so a
 * wrong number is caught here rather than found by eye on page fourteen.
 */

import { compute, applicableItems } from '@/engine';
import { buildOrganisationAnalytics, cohortOf, MEASUREMENT_MODULES } from '@/engine/orgAnalytics';
import { SUPPRESSION, type GroupMember } from '@/engine/group';
import { DIMENSIONS } from '@/engine/dictionary';
import { SCORING } from '@/engine/config';
import type { ConstructId, Item, Persona, Submission } from '@/engine/types';

let pass = 0, fail = 0;
const ok = (label: string, cond: boolean, detail?: string) => {
  if (cond) { pass++; console.log(`  ok    ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ''}`); }
};
const head = (s: string) => console.log(`\n${s}`);

const maxV = (it: Item) => (it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5);
function member(persona: Persona, usage: number, base: number, i: number,
                by: Partial<Record<ConstructId, number>> = {}, lowReason?: number): GroupMember {
  const answers: Record<string, number> = {};
  applicableItems(persona, usage).forEach((it) => {
    const top = maxV(it);
    const lv = (it.construct && by[it.construct]) ?? base;
    const h = Math.max(1, Math.min(top, Math.round(((lv - 1) / 4) * (top - 1)) + 1));
    answers[it.id] = it.type === 'reverse' ? top + 1 - h : h;
  });
  if (lowReason) answers['lowuse_reason'] = lowReason;
  const sub: Submission = { persona, usage, b1: 4, b2: 3, answers };
  return { key: `r${i}`, persona, usage, felt: 4, predicted: 3,
    result: compute(sub), takenAt: '2026-09-01T00:00:00.000Z' };
}

/** A workforce built to contain every shape the report has to describe. */
const WORKFORCE: GroupMember[] = (() => {
  const out: GroupMember[] = [];
  let i = 0;
  const shapes: Array<[number, number, Partial<Record<ConstructId, number>>]> = [
    [1, 1, {}], [2, 2, {}],
    [4, 4, { fluency: 1, adaptability: 1 }],
    [4, 4, { verification: 1, responsibleUse: 1 }],
    [4, 4, { agency: 1, dependencySafety: 1 }],
    [4, 4, { amplification: 1, creativity: 1 }],
    [4, 4, { transfer: 1, skillGrowth: 1 }],
    [5, 5, {}], [3, 3, {}], [5, 2, {}],
  ];
  for (const [usage, base, by] of shapes) for (let k = 0; k < 3; k++) out.push(member('professional', usage, base, i++, by));
  return out;
})();

head('Every person lands in exactly one developmental cohort');
{
  const a = buildOrganisationAnalytics('W', WORKFORCE);
  const assigned = WORKFORCE.map(cohortOf);
  ok('every member is assigned', assigned.every((c) => !!c));
  ok('the cohort counts sum to the workforce',
    a.developmentCohorts.cohorts.reduce((s, c) => s + c.n, 0) === WORKFORCE.length,
    `${a.developmentCohorts.cohorts.map((c) => `${c.name}=${c.n}`).join(' ')} against ${WORKFORCE.length}`);
  ok('no cohort below the segment threshold survives unmerged',
    a.developmentCohorts.cohorts.every((c) => c.n >= SUPPRESSION.descriptive
      || !a.developmentCohorts.merged.includes(c.name)));
  ok('every surviving cohort carries a need and a tier',
    a.developmentCohorts.cohorts.every((c) => c.primaryNeed.length > 10 && c.tier.length > 2));
  //
  // A fold has to actually happen for the declaration to mean anything. Eight
  // people whose constraint is agency, plus three whose constraint is
  // verification: the second cohort is under the segment threshold and is
  // folded upward, and the report has to say so.
  //
  const foldable = [
    ...Array.from({ length: 8 }, (_, i) => member('professional', 4, 4, 500 + i, { agency: 1, dependencySafety: 1 })),
    ...Array.from({ length: 3 }, (_, i) => member('professional', 4, 4, 600 + i, { verification: 1, responsibleUse: 1 })),
  ];
  const fa = buildOrganisationAnalytics('F', foldable);
  ok('a cohort below the threshold is actually folded',
    fa.developmentCohorts.merged.length > 0,
    `cohorts: ${fa.developmentCohorts.cohorts.map((c) => `${c.name}=${c.n}`).join(' ')}`);
  ok('and every fold is declared on the cohort that absorbed it',
    fa.developmentCohorts.merged.every((m) =>
      fa.developmentCohorts.cohorts.some((c) => (c.mergedFrom ?? []).includes(m))),
    `merged: ${fa.developmentCohorts.merged.join(', ')} | declared: ${fa.developmentCohorts.cohorts.map((c) => (c.mergedFrom ?? []).join('+')).join(' ')}`);
  ok('and the folded people are still counted',
    fa.developmentCohorts.cohorts.reduce((s, c) => s + c.n, 0) === foldable.length);
}

head('The readiness map partitions, and agrees with the adoption funnel');
{
  const a = buildOrganisationAnalytics('W', WORKFORCE);
  const cells = a.readinessProtectionMatrix.cells;
  ok('four cells', cells.length === 4);
  ok('they cover the workforce exactly once',
    cells.reduce((s, c) => s + c.n, 0) === a.readinessProtectionMatrix.base,
    `${cells.map((c) => `${c.key}=${c.n}`).join(' ')} against ${a.readinessProtectionMatrix.base}`);
  ok('their shares sum to a hundred',
    Math.abs(cells.reduce((s, c) => s + c.share, 0) - 100) <= 0.5);
  ok('every cell carries a response a manager could act on',
    cells.every((c) => c.response.length > 60 && c.title.length > 3));

  //
  // The decision recorded in 01-plan.md I.2: protection is all three criteria,
  // not two of three, so that this chapter and the adoption funnel describe the
  // same people. Anyone in a protected cell must pass every protection
  // criterion the adoption standard uses.
  //
  const protectedCells = cells.filter((c) => c.key === 'hh' || c.key === 'lh');
  const protectedCount = protectedCells.reduce((s, c) => s + c.n, 0);
  const byHand = WORKFORCE.filter((m) =>
    m.result.composites.judgment >= SCORING.strengthFloor
    && m.result.dimensions.responsibleUse.score >= SCORING.strengthFloor
    && m.result.dimensions.dependencySafety.score >= SCORING.strengthFloor).length;
  ok('the protected half reconciles to the adoption criteria by hand',
    protectedCount === byHand, `${protectedCount} against ${byHand}`);

  //
  // The case that separates all-three from two-of-three. Without somebody who
  // passes exactly two criteria, both rules give the same answer and the
  // decision recorded in the plan is untested.
  //
  const partly = Array.from({ length: 8 }, (_, i) =>
    member('professional', 4, 5, 900 + i, { dependencySafety: 1 }));
  const pa = buildOrganisationAnalytics('P', partly);
  const two = partly.filter((m) => [
    m.result.composites.judgment,
    m.result.dimensions.responsibleUse.score,
    m.result.dimensions.dependencySafety.score,
  ].filter((v) => v >= SCORING.strengthFloor).length === 2).length;
  ok('the fixture contains people passing exactly two of three', two > 0, `${two} of ${partly.length}`);
  const pProtected = pa.readinessProtectionMatrix.cells
    .filter((c) => c.key === 'hh' || c.key === 'lh').reduce((s, c) => s + c.n, 0);
  ok('passing two of three does not count as protected',
    pProtected === 0, `${pProtected} counted as protected, but ${two} pass only two criteria`);
  ok('and nobody is protected here while blocked on protection there',
    protectedCount >= a.group.headline.healthyAdoption.n,
    `protected ${protectedCount}, healthy adoption ${a.group.headline.healthyAdoption.n}`);
}

head('The portfolio is every practice, not the first eight');
{
  const a = buildOrganisationAnalytics('W', WORKFORCE);
  const flat = a.practicePortfolio.themes.flatMap((t) => t.entries);
  ok('the portfolio is not truncated', flat.length === a.practicePortfolio.total);
  ok('and it is larger than the old cap where the data allows',
    flat.length >= 8, `${flat.length} practices`);

  // Nothing is invented for a group: every practice was given to somebody in it.
  const given = new Set<string>();
  for (const m of WORKFORCE) for (const r of m.result.recommendations) given.add(`${r.capability}::${r.behaviorChange}`);
  ok('every entry came from a member\'s own plan',
    flat.every((e) => given.has(`${e.capability}::${e.change}`)));
  ok('every entry carries the progress indicator the engine wrote',
    flat.every((e) => e.evidenceOfProgress.length > 10),
    flat.filter((e) => !e.evidenceOfProgress).map((e) => e.tag).join(', '));
  ok('and the watch-for',
    flat.every((e) => e.riskToMonitor.length > 10));
  ok('no practice reaches more people than there are',
    flat.every((e) => e.n <= a.group.n));
}

head('The priority score is deterministic and bounded');
{
  const a = buildOrganisationAnalytics('W', WORKFORCE);
  const b = buildOrganisationAnalytics('W', WORKFORCE);
  ok('the same workforce gives the same priorities twice',
    JSON.stringify(a.priorities) === JSON.stringify(b.priorities));
  ok('every item names a region',
    a.priorities.every((p) => ['act now', 'target', 'scale', 'monitor'].includes(p.region)));
  ok('importance stays inside its declared range',
    a.priorities.every((p) => p.importance >= 0 && p.importance <= 6),
    a.priorities.map((p) => p.importance).join(','));
  ok('reach never exceeds the workforce',
    a.priorities.every((p) => p.reach <= a.group.n));
  ok('a bubble is a practice, never a person',
    a.priorities.every((p) => !!p.tag && !!p.capability));
  ok('items are ordered by importance then reach',
    a.priorities.every((p, i) => i === 0
      || a.priorities[i - 1].importance > p.importance
      || (a.priorities[i - 1].importance === p.importance && a.priorities[i - 1].reach >= p.reach)));
  ok('a practice on a group strength is offered to scale, not to fix',
    a.priorities.filter((p) => p.region === 'scale').every((p) => {
      const dim = (Object.keys(DIMENSIONS) as ConstructId[])
        .find((id) => DIMENSIONS[id].recommendedPractice === p.tag);
      const d = dim ? a.group.dimensions.find((x) => x.construct === dim) : undefined;
      return !d || d.spread.median >= SCORING.strengthFloor;
    }));
}

head('The roadmap is three bands drawn from the portfolio');
{
  const a = buildOrganisationAnalytics('W', WORKFORCE);
  ok('three bands', a.roadmap.length === 3);
  ok('each is titled by its window', a.roadmap.every((b) => /Days \d+ to \d+/.test(b.title)));
  const given = new Set(a.practicePortfolio.themes.flatMap((t) => t.entries).map((e) => e.capability));
  ok('every action came from the portfolio',
    a.roadmap.every((b) => b.actions.every((x) => given.has(x.capability))));
  ok('every action names the metric expected to move',
    a.roadmap.every((b) => b.actions.every((x) => x.metricToMove.length > 3)));
  ok('and a leading indicator',
    a.roadmap.every((b) => b.actions.every((x) => x.leadingIndicator.length > 10)));
  ok('the first band is immediate work',
    a.roadmap[0].actions.every((x) => x.priority === 'immediate'));
}

head('Nothing is estimated, and what is missing says so');
{
  ok('six measurement modules', MEASUREMENT_MODULES.length === 6);
  ok('every one is declared uncollected',
    MEASUREMENT_MODULES.every((m) => m.collected === false));
  ok('and none of them carries a value',
    MEASUREMENT_MODULES.every((m) => !/\d/.test(m.whatItWouldAdd.replace(/\b(one|two)\b/g, ''))),
    MEASUREMENT_MODULES.filter((m) => /\d/.test(m.whatItWouldAdd)).map((m) => m.id).join(', '));
}

head('The privacy state records every refusal, and what it would take');
{
  const lopsided = [
    ...Array.from({ length: 9 }, (_, i) => member('student', 4, 3, i)),
    ...Array.from({ length: 3 }, (_, i) => member('teacher', 4, 3, 100 + i)),
  ];
  const a = buildOrganisationAnalytics('R', lopsided);
  const withheld = a.privacyState.filter((p) => p.state === 'withheld');
  ok('the withheld cuts are recorded', withheld.length >= 2);
  ok('each says why', withheld.every((p) => (p.reason ?? '').length > 20));
  ok('each says how many more people it needs',
    withheld.every((p) => typeof p.needs === 'number' && p.needs! > 0),
    withheld.map((p) => `${p.cut}:${p.needs}`).join(' | '));
  ok('no withheld entry carries a count of the people in it',
    !/"n":/.test(JSON.stringify(withheld)));
  ok('every suppressed segment has a matching refusal note',
    a.group.segments.filter((s) => s.suppressed).every((s) =>
      a.privacyState.some((p) => p.cut === `${s.dimension}: ${s.value}` && p.state === 'withheld')));
  ok('intervals and correlations are refused below thirty',
    a.privacyState.some((p) => /intervals/i.test(p.cut) && p.state === 'withheld'));
}

head('A first wave is a baseline, and says so');
{
  const a = buildOrganisationAnalytics('W', WORKFORCE);
  ok('no prior wave means the baseline state', a.trend.comparable === false);
  ok('and the reason is given rather than left blank',
    a.trend.comparable === false && a.trend.reason.length > 30,
    a.trend.comparable === false ? a.trend.reason : '');
}

head('The whole aggregate carries no per-person row');
{
  const a = buildOrganisationAnalytics('W', WORKFORCE);
  const json = JSON.stringify(a);
  ok('no member key reaches it', !WORKFORCE.some((m) => json.includes(`"${m.key}"`)));
  ok('no email shape appears', !/@/.test(json.replace(/https?:[^"]*/g, '')));
  ok('no em-dash or en-dash in any generated copy', !/[—–]/.test(json),
    (json.match(/.{40}[—–].{40}/) ?? []).slice(0, 2).join(' | '));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
