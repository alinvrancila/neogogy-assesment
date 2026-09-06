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
import { assessmentOf, compareToPrevious } from '@/lib/history';
import {
  mintReportToken, isWellFormedToken, expiresAt, redactToken, TOKEN_LENGTH,
  REPORT_PAGE_METADATA,
} from '@/lib/reportLink';
import { PRIVACY } from '@/content/legal';
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
  // This was checked by grepping history.ts for the text of the fix, and the
  // text was there while the behaviour was not: the filter compared the
  // archetype stored on the record against the persona on the result, matched
  // nothing, and silently told every returning respondent that they had never
  // taken it before. Assert the behaviour instead.
  const student = compute(build('student', 4, (it) => (it.type === 'reverse' ? 2 : 4)));
  const asRecord = (persona: string, result: ReturnType<typeof compute>) => ({
    id: 'x', name: '', email: 'a@b.c', role: persona, modality: '', consent: true,
    persona: result.archetype.id, personaName: result.archetype.name,
    overall: result.stage.rawIndex, createdAt: '2026-01-01T00:00:00.000Z',
    engineVersion: 2, result,
  });

  ok('a record reports the assessment it belongs to, not the archetype it landed on',
    assessmentOf(asRecord('student', student) as never) === 'student');
  ok('and the archetype is not mistaken for it',
    assessmentOf(asRecord('student', student) as never) !== student.archetype.id);

  const src = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'history.ts'), 'utf-8');
  ok('the filter no longer reads the archetype field off the record',
    !/l\.persona === persona/.test(src));
  ok('and the comparison still refuses to cross assessments',
    /assessmentOf\(l\) === persona/.test(src));

  const earlier = compute(build('student', 3, (it) => (it.type === 'reverse' ? 4 : 2)));
  const moved = compareToPrevious(student, asRecord('student', earlier) as never, 2, new Date('2026-06-01'));
  ok('two sittings of one assessment do compare', moved !== null);
  ok('and the movement is measured, not asserted',
    moved !== null && moved.indexDelta === Math.round((student.stage.rawIndex - earlier.stage.rawIndex) * 10) / 10,
    String(moved?.indexDelta));
}

head('B3: a report has its own address, and the address is a secret');
{
  const token = mintReportToken();
  ok('the token is long enough not to be guessed', token.length === TOKEN_LENGTH && token.length >= 43);
  ok('an unknown token is not a token', !isWellFormedToken('not-a-token'));
  ok('the link ends with the record, twenty four months on',
    expiresAt('2026-09-06T00:00:00.000Z').toISOString().slice(0, 10) === '2028-09-06');
  ok('and the token is stripped out of anything written down',
    !redactToken(`/r/${token}`).includes(token));

  ok('the report page refuses indexing and sends no referrer',
    REPORT_PAGE_METADATA.robots !== undefined
    && (REPORT_PAGE_METADATA.robots as { index?: boolean }).index === false
    && REPORT_PAGE_METADATA.referrer === 'no-referrer');
  ok('and carries none of the site share card onto a private address',
    REPORT_PAGE_METADATA.openGraph === null && REPORT_PAGE_METADATA.twitter === null);

  // The notice is already published, so it is the specification.
  const notice = PRIVACY.sections.flatMap((x) => [x.heading, ...x.body]).join(' ');
  const view = fs.readFileSync(
    path.join(process.cwd(), 'src', 'components', 'compass', 'ReportView.tsx'), 'utf-8');
  for (const control of ['Email me my link', 'Get a new link']) {
    ok(`the notice promises "${control}", and the report offers it`,
      notice.includes(control) && view.includes(control));
  }
  ok('the notice is no longer ahead of the product',
    /Your report link/.test(PRIVACY.sections.map((x) => x.heading).join(' ')));
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

head('B2 and C1: the scale says which way it leans, and how much it can resolve');
{
  const r = dependent('student');
  const lines = generateReportSections(r).flatMap((s) => s.lines).join(' ');
  ok('the asymmetry is stated rather than discovered', /The scale leans, deliberately/.test(lines));
  ok('with the reason, not just the fact', /slow to rebuild/.test(lines));
  ok('ten stages carry a resolution caveat', /neighbourhood rather than a coordinate/.test(lines));
}

head('C5: the contradiction is disclosed, in both directions');
{
  // flattering self-description, poor situations
  const mixed = compute(build('student', 4, (it) =>
    (it.type === 'claim' ? top(it) : it.type === 'reverse' ? top(it) : 1)));
  const sec = generateReportSections(mixed).find((s) => s.key === 'divergence');
  ok('a contradictory profile is told', !!sec);
  ok('titled without accusation', sec?.title === 'Where your answers pull in two directions');
  const body = (sec?.lines ?? []).join(' ');
  ok('it says both are probably true', /Both are probably true/.test(body));
  ok('and refuses to call it dishonesty', /not an accusation of inconsistency/.test(body));
  ok('it covers the harsher-on-yourself direction too',
    /harder on yourself/.test(fs.readFileSync(
      path.join(process.cwd(), 'src', 'engine', 'narrative.ts'), 'utf-8')));

  const consistent = compute(build('student', 4, (it) => (it.type === 'reverse' ? 1 : top(it))));
  ok('a consistent profile is not given the section',
    !generateReportSections(consistent).find((s) => s.key === 'divergence'));
}

head('C1: the boundary reads in the direction it happened');
{
  const src = fs.readFileSync(
    path.join(process.cwd(), 'src', 'components', 'compass', 'ascent', 'modules.tsx'), 'utf-8');
  ok('crossing into a stage is not phrased as falling towards the one below',
    /You have just crossed into this stage/.test(src) && !/You are only \{result\.stage\.borderline\.distance\} points from/.test(src));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
