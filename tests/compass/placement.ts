/**
 * Placement validation, every persona.
 *
 * The finding this exists for: a submission carrying too few answers scored
 * every unevidenced dimension at the neutral prior of 50, which lands on stage
 * 5 and reads back as "AI Functional" to somebody who told us almost nothing.
 * That is the one result a developmental instrument must never produce, because
 * it is indistinguishable from a real middle placement.
 *
 * These checks walk each persona across the full answer range and assert the
 * route responds to the answers rather than to their absence.
 */

import fs from 'fs';
import path from 'path';
import { compute, applicableItems } from '@/engine';
import { STAGES } from '@/engine/config';
import type { Item, Persona, Submission } from '@/engine/types';

let pass = 0, fail = 0;
const ok = (label: string, cond: boolean, detail?: string) => {
  if (cond) { pass++; console.log(`  ok    ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ''}`); }
};
const head = (s: string) => console.log(`\n${s}`);

const PERSONAS: Persona[] = ['student', 'teacher', 'parent', 'administrator', 'pastor', 'business', 'professional'];
const top = (it: Item) => (it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5);
const SCORED = ['claim', 'reverse', 'scenario', 'outcome'];

const at = (p: Persona, usage: number, pick: (it: Item) => number) => {
  const answers: Record<string, number> = {};
  applicableItems(p, usage).forEach((it) => { const v = pick(it); if (v >= 0) answers[it.id] = v; });
  return compute({ persona: p, usage, b1: 3, b2: 3, answers } as Submission);
};
const level = (lvl: number) => (it: Item) => {
  const t = top(it);
  const healthy = Math.max(1, Math.min(t, Math.round(((lvl - 1) / 4) * (t - 1)) + 1));
  return it.type === 'reverse' ? t + 1 - healthy : healthy;
};

for (const p of PERSONAS) {
  head(`${p}`);

  const worst = at(p, 3, (it) => (it.type === 'reverse' ? top(it) : 1));
  const best = at(p, 5, (it) => (it.type === 'reverse' ? 1 : top(it)));
  ok('the weakest answers place at the first camp', worst.stage.stage === 1, `stage ${worst.stage.stage}, index ${worst.stage.rawIndex}`);
  ok('the strongest answers reach the summit', best.stage.stage === 10, `stage ${best.stage.stage}, index ${best.stage.rawIndex}`);
  ok('the index spans nearly the whole scale',
    worst.stage.rawIndex < 5 && best.stage.rawIndex > 95,
    `${worst.stage.rawIndex} to ${best.stage.rawIndex}`);

  // The index has to move with the answers, in the right direction, everywhere.
  const curve = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((l) => at(p, 4, level(l)).stage.rawIndex);
  ok('the index rises monotonically with healthier answers',
    curve.every((v, i) => i === 0 || v >= curve[i - 1] - 0.01), curve.join(' -> '));
  ok('the range covers the whole scale in steps',
    new Set(curve.map((v) => Math.round(v))).size >= 4, curve.join(' -> '));

  // Every camp on the route must be reachable by some real profile, otherwise
  // the route is telling people about stages nobody can be placed in.
  const reached = new Set<number>();
  for (let lvl = 1; lvl <= 5; lvl += 0.1) {
    for (const u of [1, 2, 3, 4, 5]) reached.add(at(p, u, level(lvl)).stage.stage);
  }
  // and mixed profiles, which is what real respondents actually look like
  // Real respondents are uneven: strong on some dimensions, weak on others.
  // A deterministic pseudo-random walk over per-dimension levels is what
  // actually exercises the route, and a uniform sweep never will.
  let seedState = 20260905;
  const rnd = () => ((seedState = (seedState * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let trial = 0; trial < 400; trial++) {
    const byConstruct = new Map<string, number>();
    reached.add(at(p, 1 + Math.floor(rnd() * 5), (it) => {
      const key = it.construct ?? 'none';
      if (!byConstruct.has(key)) byConstruct.set(key, 1 + rnd() * 4);
      const lvl = byConstruct.get(key)!;
      const t = top(it);
      const healthy = Math.max(1, Math.min(t, Math.round(((lvl - 1) / 4) * (t - 1)) + 1));
      return it.type === 'reverse' ? t + 1 - healthy : healthy;
    }).stage.stage);
  }
  // The upper camps sit in narrow index bands, stage 9 in eight points, so a
  // random walk over dimension levels almost never lands in them. They need a
  // sweep aimed at the top of the scale: near-perfect answers, shaved.
  for (let shaveRun = 0; shaveRun < 60; shaveRun++) {
    reached.add(at(p, 5, (it) => {
      const t = top(it);
      const shave = (it.id.length * 3 + shaveRun) % 17 < shaveRun % 17 ? 1 : 0;
      const healthy = Math.max(1, t - shave);
      return it.type === 'reverse' ? t + 1 - healthy : healthy;
    }).stage.stage);
  }

  const missing = STAGES.map((s) => s.stage).filter((s) => !reached.has(s));
  ok('every one of the ten stages is reachable', missing.length === 0, `unreachable: ${missing.join(', ')}`);

  // The bug: an empty or near-empty submission must not read as the middle.
  const empty = at(p, 3, () => -1);
  ok('an empty submission is flagged as having no evidence',
    empty.overallConfidence === 'insufficient', empty.overallConfidence);
  ok('an empty submission does not carry high confidence', empty.overallConfidence !== 'high');
}

head('The index is read from evidence, never from its absence');
{
  for (const p of PERSONAS) {
    const items = applicableItems(p, 3);
    const scored = items.filter((i) => SCORED.includes(i.type));

    // nothing answered at all
    const empty = compute({ persona: p, usage: 3, b1: 3, b2: 3, answers: {} } as Submission);
    ok(`${p}: an empty reading is not placed in the middle`,
      empty.stage.stage !== 5, `stage ${empty.stage.stage}, index ${empty.stage.rawIndex}`);
    ok(`${p}: an empty reading carries no index`, empty.stage.rawIndex === 0, String(empty.stage.rawIndex));

    // one weak answer: the index follows that answer, not the prior
    const one: Record<string, number> = {};
    one[scored.find((i) => i.type === 'claim')!.id] = 1;
    const single = compute({ persona: p, usage: 3, b1: 3, b2: 3, answers: one } as Submission);
    ok(`${p}: one weak answer reads low, not middling`,
      single.stage.rawIndex < 20, String(single.stage.rawIndex));

    // half the questions, answered strongly: the index reflects them, and the
    // gates still refuse to certify an advanced stage on half the evidence
    const half: Record<string, number> = {};
    scored.slice(0, Math.ceil(scored.length / 2)).forEach((it) => {
      const t = top(it);
      half[it.id] = it.type === 'reverse' ? 1 : t;
    });
    const partial = compute({ persona: p, usage: 3, b1: 3, b2: 3, answers: half } as Submission);
    ok(`${p}: strong partial evidence is not capped at the middle`,
      partial.stage.rawIndex > 60, String(partial.stage.rawIndex));
    ok(`${p}: and is not certified at the summit on half the answers`,
      partial.stage.stage < 10, `stage ${partial.stage.stage}`);
    ok(`${p}: thin evidence is reported as thin`,
      partial.overallConfidence === 'insufficient' || partial.overallConfidence === 'preliminary',
      partial.overallConfidence);
  }

  const src = fs.readFileSync(path.join(process.cwd(), 'src', 'engine', 'continuum.ts'), 'utf-8');
  ok('the index skips dimensions with no evidence', /evidenceCount <= 0/.test(src));
  ok('and renormalises over the ones that have it', /sum \/ weight/.test(src));
  ok('with nothing at all it reports no position rather than a middle',
    /if \(weight <= 0\) return 0;/.test(src));
}

head('The boundary refuses to place a respondent on too little evidence');
{
  // The engine still returns a neutral prior for an unevidenced dimension,
  // which is correct for one thin dimension inside a real profile. What must
  // not happen is a whole submission being placed that way, so the submit
  // route requires a real proportion of the questions to carry an answer.
  const src = fs.readFileSync(path.join(process.cwd(), 'src', 'app', 'api', 'submit', 'route.ts'), 'utf-8');
  ok('the submit route counts answered scored items', /answeredScored/.test(src));
  ok('it requires a real proportion of them', /scored\.length \* 0\.6/.test(src));
  ok('"not enough experience to say" does not count as evidence', /v > 0/.test(src));
  ok('it tells the respondent what to do rather than failing silently',
    /needs more of your answers/.test(src));

  for (const p of PERSONAS) {
    const scored = applicableItems(p, 3).filter((i) => SCORED.includes(i.type));
    ok(`${p}: the floor is a majority of its ${scored.length} scored questions`,
      Math.ceil(scored.length * 0.6) >= 20);
  }
}

head('A journey is only a journey within one assessment');
{
  const src = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'history.ts'), 'utf-8');
  ok('prior attempts are matched on the assessment as well as the person',
    /persona\?: string/.test(src) && /l\.persona === persona/.test(src));
  ok('the comparison passes the current assessment through',
    /priorAttempts\(email, excludeId, current\.persona\)/.test(src));
  ok('the reason is recorded where the next person will read it',
    /not comparable with an index from another/.test(src));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
