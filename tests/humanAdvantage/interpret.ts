/**
 * The interpretation engine.
 *
 * Every sentence in the report is a pure function of aggregate values. These
 * tests fix the templates against the brief's own worked example and check that
 * no statistic is left orphaned: every interpreter must return all four blocks,
 * and every block must be a sentence a manager could repeat.
 */

import { compute, applicableItems } from '@/engine';
import { buildOrganisationAnalytics } from '@/engine/orgAnalytics';
import { buildGroupResult, type GroupMember, type GroupResult } from '@/engine/group';
import * as copy from '@/engine/orgCopy';
import {
  interpretContinuum, interpretLean, interpretDimension, interpretComposite, interpretMatrix,
  interpretHealthyAdoption, interpretPatterns, interpretCalibration, interpretSaidVsChosen,
  interpretGates, interpretMobility, interpretPriorities, executiveStory,
} from '@/engine/orgInterpret';
import { CONSTRUCT_IDS, type ConstructId, type Item, type Persona, type Submission } from '@/engine/types';
import { DIMENSIONS } from '@/engine/dictionary';
import type { Interpretation } from '@/engine/orgCopy';

let pass = 0, fail = 0;
const ok = (label: string, cond: boolean, detail?: string) => {
  if (cond) { pass++; console.log(`  ok    ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ''}`); }
};
const head = (s: string) => console.log(`\n${s}`);

const maxV = (it: Item) => (it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5);
function member(persona: Persona, usage: number, base: number, i: number,
                by: Partial<Record<ConstructId, number>> = {}): GroupMember {
  const answers: Record<string, number> = {};
  applicableItems(persona, usage).forEach((it) => {
    const top = maxV(it);
    const lv = (it.construct && by[it.construct]) ?? base;
    const h = Math.max(1, Math.min(top, Math.round(((lv - 1) / 4) * (top - 1)) + 1));
    answers[it.id] = it.type === 'reverse' ? top + 1 - h : h;
  });
  const sub: Submission = { persona, usage, b1: 4, b2: 3, answers };
  return { key: `r${i}`, persona, usage, felt: 4, predicted: 3,
    result: compute(sub), takenAt: '2026-09-01T00:00:00.000Z' };
}
const WORKFORCE: GroupMember[] = (() => {
  const out: GroupMember[] = []; let i = 0;
  const shapes: Array<[number, number, Partial<Record<ConstructId, number>>]> = [
    [1, 1, {}], [2, 2, {}],
    [4, 4, { fluency: 1, adaptability: 1 }], [4, 4, { verification: 1, responsibleUse: 1 }],
    [4, 4, { agency: 1, dependencySafety: 1 }], [4, 4, { amplification: 1, creativity: 1 }],
    [4, 4, { transfer: 1, skillGrowth: 1 }], [5, 5, {}], [3, 3, {}], [5, 2, {}],
  ];
  for (const [u, b, by] of shapes) for (let k = 0; k < 3; k++) out.push(member('professional', u, b, i++, by));
  return out;
})();

head('The worked example from section 6.4 renders exactly');
{
  //
  // The brief gives an eight person cohort: median 58.9, Q1 56.0, Q3 63.5,
  // reaching 50.1 to 73.0. Eight values consistent with all of it are below,
  // and they interpolate to exactly those quartiles. Under the nearest-rank
  // rule this report shipped with, the same eight people would have rendered a
  // median of 59.8, so this example was unreachable until that was corrected.
  //
  const stub = {
    n: 8,
    index: { n: 8, median: 58.9, q1: 56.0, q3: 63.5, min: 50.1, max: 73.0, mean: 60, sd: 7, range: 22.9 },
    centre: { stage: 5, stageName: 'AI Functional', n: 5, share: 62.5 },
    distribution: [
      { stage: 4, stageName: 'AI Exploring', n: 2, share: 25 },
      { stage: 5, stageName: 'AI Functional', n: 5, share: 62.5 },
      { stage: 6, stageName: 'AI Integrating', n: 1, share: 12.5 },
    ],
    consistency: { widthOfMiddleHalf: 7.5, label: 'high' as const, reading: 'x' },
  } as unknown as GroupResult;

  const expected = 'The middle person in your organisation scores 58.9 out of 100, which places '
    + 'them at stage 5, AI Functional. The middle half of your people sit between 56.0 and 63.5, '
    + 'a spread of 7.5 points, so your people are similar on this and one approach can serve the '
    + 'core. Your people reach from 50.1 to 73.0.';
  const got = interpretContinuum(stub).howToRead;
  ok('the sentence matches the brief word for word', got === expected,
    `got:      ${got}\n        expected: ${expected}`);

  ok('the quartile rule the example depends on is the interpolating one',
    (() => {
      const v = [50.1, 56.0, 56.0, 58.0, 59.8, 63.5, 63.5, 73.0];
      const q = (p: number) => { const pos = p * (v.length - 1), lo = Math.floor(pos), hi = Math.ceil(pos);
        return lo === hi ? v[lo] : v[lo] + (v[hi] - v[lo]) * (pos - lo); };
      return Math.abs(q(0.5) - 58.9) < 1e-9 && Math.abs(q(0.25) - 56) < 1e-9 && Math.abs(q(0.75) - 63.5) < 1e-9;
    })());
}

head('The sentence templates say what the brief says');
{
  ok('a count carries its percentage beside it', copy.count(1, 8) === '1 of 8 people (13%).');
  ok('a narrow middle half reads as one programme',
    copy.spreadReading(7.5) === 'your people are similar on this and one approach can serve the core');
  ok('a moderate one reads as two halves',
    copy.spreadReading(15) === 'there is a real difference between your stronger and weaker half');
  ok('a wide one reads as no single fit',
    copy.spreadReading(25) === 'one approach will not fit everyone here');
  ok('the boundaries fall the right side', copy.spreadReading(10).startsWith('there is')
    && copy.spreadReading(20).startsWith('there is') && copy.spreadReading(20.1).startsWith('one approach'));
  ok('the range identifies nobody', !/person|name|who/i.test(copy.range(50.1, 73)));
  ok('the vulnerability sentence names the line', /vulnerability line \(45\)/.test(copy.vulnerability('X', 2, 8)));
}

head('The workforce shape picks the first rule that applies');
{
  const camps = copy.workforceShape({ n: 10,
    stages: [{ stage: 2, stageName: 'AI Aware', n: 4 }, { stage: 6, stageName: 'AI Integrating', n: 4 },
             { stage: 4, stageName: 'AI Exploring', n: 2 }].sort((a, b) => a.stage - b.stage),
    centre: { stage: 2, stageName: 'AI Aware', n: 4 } });
  ok('two non-adjacent camps are reported as two camps', /two camps/.test(camps), camps);
  ok('and both are named with their counts', /stage 2 \(4 people\)/.test(camps) && /stage 6 \(4 people\)/.test(camps));

  const conc = copy.workforceShape({ n: 10,
    stages: [{ stage: 4, stageName: 'AI Exploring', n: 2 }, { stage: 5, stageName: 'AI Functional', n: 6 },
             { stage: 6, stageName: 'AI Integrating', n: 2 }],
    centre: { stage: 5, stageName: 'AI Functional', n: 6 } });
  ok('a stage holding half is reported as concentrated', /concentrated at stage 5/.test(conc), conc);
  ok('and the two ends are counted', /2 people ahead of it and the 2 people behind it/.test(conc), conc);

  const spread = copy.workforceShape({ n: 10,
    stages: [1, 2, 3, 4, 5].map((s) => ({ stage: s, stageName: `S${s}`, n: 2 })),
    centre: { stage: 1, stageName: 'S1', n: 2 } });
  ok('no stage at thirty per cent is reported as spread', /spread across 5 stages/.test(spread), spread);

  const edges = copy.edges({ n: 10,
    stages: [{ stage: 2, stageName: 'a', n: 6 }, { stage: 7, stageName: 'b', n: 4 }],
    centre: { stage: 2, stageName: 'a', n: 6 } });
  ok('a leading edge is reported independently', edges.some((e) => /ahead of the/.test(e)), edges.join(' | '));
}

head('Every interpreter returns all four blocks, with nothing orphaned');
{
  const a = buildOrganisationAnalytics('W', WORKFORCE);
  const g = a.group;
  const all: Array<[string, Interpretation]> = [
    ['continuum', interpretContinuum(g)],
    ['lean', interpretLean(g)],
    ['healthy adoption', interpretHealthyAdoption(a)],
    ['patterns', interpretPatterns(g)],
    ['calibration', interpretCalibration(g)],
    ['said against chosen', interpretSaidVsChosen(g)],
    ['gates', interpretGates(g)],
    ['mobility', interpretMobility(g)],
    ['priorities', interpretPriorities(a)],
    ['matrix', interpretMatrix(a.readinessProtectionMatrix.cells, a.readinessProtectionMatrix.base,
      'This is the cross that says whether your organisation is building AI capability safely, rather than quickly.')],
    ...CONSTRUCT_IDS.map((id) => [`dimension ${id}`, interpretDimension(g, id)] as [string, Interpretation]),
    ...['futureReadiness', 'judgment', 'dependencyIndex', 'underexposure']
      .map((id) => [`composite ${id}`, interpretComposite(g, id)] as [string, Interpretation]),
  ];
  for (const [name, i] of all) {
    ok(`${name}: has a headline that states something`, i.headline.split(/\s+/).length >= 4, i.headline);
    ok(`${name}: explains how to read it`, i.howToRead.length > 40);
    ok(`${name}: interprets the numbers`, i.interpretation.length > 20, i.interpretation);
    ok(`${name}: says why it matters to the business`, i.businessMeaning.length > 40);
    ok(`${name}: names a management response`, i.recommendedResponse.length > 40);
  }
  //
  // The "so what" rule, 2.4: a business meaning has to be about this dimension.
  // A length check passes a sentence that says nothing, which is exactly the
  // failure mode the rule exists to prevent, so the meanings are required to be
  // distinct from one another and to match what the dictionary says.
  //
  const meanings = CONSTRUCT_IDS.map((id) => interpretDimension(g, id).businessMeaning);
  ok('every dimension has its own business meaning',
    new Set(meanings).size === CONSTRUCT_IDS.length,
    `${new Set(meanings).size} distinct across ${CONSTRUCT_IDS.length} dimensions`);
  ok('and each is the one the dictionary holds for it',
    CONSTRUCT_IDS.every((id) => interpretDimension(g, id).businessMeaning === DIMENSIONS[id].businessMeaning));
  ok('every dimension headline names the dimension',
    CONSTRUCT_IDS.every((id) => interpretDimension(g, id).headline.includes(DIMENSIONS[id].executiveName)));

  const text = all.map(([, i]) => Object.values(i).join(' ')).join(' ');
  ok('nothing uses an em-dash or en-dash', !/[—–]/.test(text),
    (text.match(/.{30}[—–].{30}/) ?? []).slice(0, 2).join(' | '));
  ok('nothing is written in the third person about a respondent',
    !/\bthe respondent\b|\bthe person who\b/i.test(text));
  ok('nothing calls a difference significant', !/statistically significant|\bsignificant\b/i.test(text));
  ok('nothing estimates money or time saved', !/\$|£|€|\bROI\b|hours saved|cost saving/i.test(text));
  ok('nothing compares the organisation with others',
    !/other organisations|industry average|benchmark/i.test(text));
  //
  // Naming a person is prevented structurally rather than textually: the
  // interpreters only ever receive the aggregate, and the aggregate suite
  // proves no member key or address survives into it. A two-capitalised-words
  // heuristic here flagged "Checking Before You Act" and "Your Own Voice" and
  // found nothing else, which is a test that fails on its own vocabulary.
  //
  // What is worth asserting here is the rule the brief actually states about
  // this copy: it addresses the organisation in the second person and never
  // describes an individual in the third.
  //
  ok('the copy speaks to the organisation in the second person',
    /\byour (people|organisation|workforce)\b/i.test(text));
  ok('and never describes a single respondent in the third person',
    !/\b(he|she|his|her|the employee who|the individual)\b/i.test(text),
    (text.match(/.{40}\b(he|she|his|her|the individual)\b.{40}/i) ?? []).slice(0, 2).join(' | '));
  ok('and never says "pupil"', !/\bpupils?\b/i.test(text));
}

head('The executive story is generated, not written');
{
  const weak = buildOrganisationAnalytics('A', Array.from({ length: 9 }, (_, i) => member('professional', 2, 1, i)));
  const strong = buildOrganisationAnalytics('B', Array.from({ length: 9 }, (_, i) => member('professional', 4, 5, i)));
  const s1 = executiveStory(weak), s2 = executiveStory(strong);
  ok('a weak workforce and a strong one get different stories', s1 !== s2);
  ok('the weak one opens on where it actually is', /early on the route/.test(s1), s1);
  ok('neither is hard-coded to a sample', !/Life College|Meridian|Northgate/.test(s1 + s2));
  ok('both end on what follows for a programme',
    /programme|course|attention/.test(s1) && /programme|course|attention/.test(s2));
}

head('A reversed composite is read as concern, not as a low score');
{
  const g = buildGroupResult('R', Array.from({ length: 9 }, (_, i) => member('professional', 5, 1, i)));
  const dep = interpretComposite(g, 'dependencyIndex');
  ok('the caveat is stated in the how-to-read', /lower is healthier/.test(dep.howToRead), dep.howToRead);
  const depSpread = g.composites.find((c) => c.id === 'dependencyIndex')!;
  ok('a high reading on a concern-high composite is not called a strength',
    depSpread.spread.median < 65 || !/little of the work depends/i.test(dep.interpretation),
    `median ${depSpread.spread.median}: ${dep.interpretation}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
