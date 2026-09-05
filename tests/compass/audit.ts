/**
 * The audit findings, held closed.
 *
 * Each check below corresponds to a numbered finding in the September 2026
 * product audit, so a regression reintroduces a named defect rather than an
 * anonymous one.
 */

import fs from 'fs';
import path from 'path';
import { compute, applicableItems, generateReportSections } from '@/engine';
import { riskLean, stageDetail } from '@/engine/display';
import { firstStepFor } from '@/engine/firstStep';
import { CONSTRUCTS } from '@/engine/config';
import type { ConstructId, Item, Persona, Submission } from '@/engine/types';

let pass = 0, fail = 0;
const ok = (label: string, cond: boolean, detail?: string) => {
  if (cond) { pass++; console.log(`  ok    ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ''}`); }
};
const head = (s: string) => console.log(`\n${s}`);

const top = (it: Item) => (it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5);
const build = (p: Persona, usage: number, pick: (it: Item) => number): Submission => {
  const answers: Record<string, number> = {};
  applicableItems(p, usage).forEach((it) => { answers[it.id] = pick(it); });
  return { persona: p, usage, b1: 3, b2: 3, answers };
};
const dependent = (p: Persona) => compute(build(p, 5, (it) => (it.type === 'reverse' ? top(it) : 1)));
const avoidant = (p: Persona) => compute(build(p, 1, (it) => {
  const thin = it.construct === 'fluency' || it.construct === 'adaptability';
  const lvl = thin ? 1 : 4;
  const t = top(it);
  const h = Math.max(1, Math.min(t, Math.round(((lvl - 1) / 4) * (t - 1)) + 1));
  return it.type === 'reverse' ? t + 1 - h : h;
}));

const PERSONAS: Persona[] = ['student', 'teacher', 'parent', 'administrator', 'professional'];

head('3.1 The continuum no longer describes the opposite of the reader');
{
  for (const p of PERSONAS) {
    const dep = dependent(p);
    const lean = riskLean(dep.composites.dependencyIndex, dep.composites.underexposure);
    ok(`${p}: a heavy dependent reading leans towards dependence`, lean === 'dependence', lean);

    const text = stageDetail(p, dep.stage.stage, lean).looksLike;
    ok(`${p}: and is not told it has little hands-on practice`,
      !/little or no hands-on|not yet grounded in your own experience|very little of your own hands-on/i.test(text),
      text.slice(0, 80));

    const lines = generateReportSections(dep).flatMap((s) => s.lines).join(' ');
    ok(`${p}: the report names which way they are off the path`,
      /Which way you are off the path/.test(lines));
  }

  const av = avoidant('student');
  const avLean = riskLean(av.composites.dependencyIndex, av.composites.underexposure);
  ok('an avoidant reading leans towards disconnection', avLean === 'disconnection', avLean);
  ok('and is not told its use is broad',
    !/Regular use across a range|use is broad/i.test(stageDetail('student', av.stage.stage, avLean).looksLike));
  ok('a balanced reading is given no direction it did not earn',
    riskLean(40, 40) === 'balanced');
}

head('3.2 A journey is only a journey within one assessment');
{
  const src = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'history.ts'), 'utf-8');
  ok('prior attempts match on the assessment as well as the person',
    /l\.persona === persona/.test(src) && /current\.persona/.test(src));
}

head('P0-4 The first step comes from the constraint, not from a template');
{
  const seen = new Set<string>();
  for (const c of Object.keys(CONSTRUCTS) as ConstructId[]) {
    for (const lean of ['dependence', 'disconnection'] as const) {
      const step = firstStepFor(c, lean);
      ok(`${c}, ${lean}: has its own first step`, !!step.title && !!step.body);
      seen.add(step.title);
    }
  }
  ok('twenty distinct first steps exist', seen.size === 20, `${seen.size} distinct`);

  // the exact failure the audit found: an avoidant reader told to draft unaided
  const av = avoidant('student');
  const avStep = firstStepFor(av.bottleneck.construct,
    riskLean(av.composites.dependencyIndex, av.composites.underexposure));
  ok('an avoidant reader is not told to draft without assistance',
    !/without assistance|unaided first/i.test(`${avStep.title} ${avStep.body}`),
    avStep.title);

  const dep = dependent('student');
  const depStep = firstStepFor(dep.bottleneck.construct,
    riskLean(dep.composites.dependencyIndex, dep.composites.underexposure));
  ok('a dependent reader and an avoidant reader get different first steps',
    depStep.title !== avStep.title, `${depStep.title} vs ${avStep.title}`);

  const card = fs.readFileSync(
    path.join(process.cwd(), 'src', 'components', 'compass', 'ascent', 'modules.tsx'), 'utf-8');
  ok('the card no longer carries a hardcoded first step',
    !/Draft without assistance first/.test(card));
  ok('it reads the constraint', /firstStepFor\(result\.bottleneck\.construct/.test(card));
  ok('"why this one" carries a reason, not another action',
    /result\.bottleneck\.reason/.test(card));
  ok('the supporting habits come from the reader\'s own plan',
    /result\.recommendations\.slice\(1, 3\)/.test(card));
}

head('7.4 Every spoke and bar reads one direction');
{
  const viz = fs.readFileSync(
    path.join(process.cwd(), 'src', 'components', 'compass', 'Visuals.tsx'), 'utf-8');
  ok('the radar plots the healthy reading',
    /const valueOf = \(id: ConstructId\) => result\.dimensions\[id\]\.score;/.test(viz));
  ok('the bars plot the healthy reading', /const shownValue = d\.score;/.test(viz));
  ok('the inverted spoke is labelled by what it now shows',
    /Independent Capability/.test(viz) && !/'Dependency Risk'/.test(viz));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
