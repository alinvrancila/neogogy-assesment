/**
 * The Professional set, checked for the things that made it thin.
 *
 * It was written last and it showed: prompts shorter than every other set, no
 * explanation of why anything was being asked, and results that fell back to
 * wording written for a classroom. These checks hold all three closed.
 */

import fs from 'fs';
import path from 'path';
import { compute, applicableItems } from '@/engine';
import { PROFESSIONAL_ITEMS } from '@/items/professional';
import { ADMINISTRATOR_ITEMS } from '@/items/administrator';
import { CONSTRUCTS } from '@/engine/config';
import { constructName, constructPrinciple, reportTitle, indexName, disclaimerExtra } from '@/engine/display';
import type { ConstructId, Item, Submission } from '@/engine/types';

let pass = 0, fail = 0;
const ok = (label: string, cond: boolean, detail?: string) => {
  if (cond) { pass++; console.log(`  ok    ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ''}`); }
};
const head = (s: string) => console.log(`\n${s}`);

head('Every question is asked, and explains itself');
{
  ok('thirty items', PROFESSIONAL_ITEMS.length === 30);
  ok('three per construct, ten constructs',
    (Object.keys(CONSTRUCTS) as ConstructId[]).every((c) =>
      PROFESSIONAL_ITEMS.filter((i) => i.construct === c).length === 3));
  ok('one claim, one reverse and one situation each',
    (Object.keys(CONSTRUCTS) as ConstructId[]).every((c) => {
      const set = PROFESSIONAL_ITEMS.filter((i) => i.construct === c).map((i) => i.type).sort();
      return set.join(',') === 'claim,reverse,scenario';
    }));

  const missing = PROFESSIONAL_ITEMS.filter((i) => !i.why);
  ok('every item says why it is asked', missing.length === 0, missing.map((i) => i.id).join(', '));

  const thinWhy = PROFESSIONAL_ITEMS.filter((i) => (i.why ?? '').length < 90);
  ok('no explanation is a one-liner', thinWhy.length === 0, thinWhy.map((i) => i.id).join(', '));

  const uniqueWhy = new Set(PROFESSIONAL_ITEMS.map((i) => i.why));
  ok('each explanation is written for its own question', uniqueWhy.size === 30, `${uniqueWhy.size} distinct`);
}

head('The prompts carry as much as the other sets');
{
  const len = (items: Item[]) => items.reduce((a, i) => a + i.prompt.length, 0) / items.length;
  const mine = len(PROFESSIONAL_ITEMS), theirs = len(ADMINISTRATOR_ITEMS);
  ok(`prompts are not shorter than the Leader set (${Math.round(mine)} against ${Math.round(theirs)})`,
    mine >= theirs * 0.95, `${mine.toFixed(1)} vs ${theirs.toFixed(1)}`);

  const terse = PROFESSIONAL_ITEMS.filter((i) => i.prompt.length < 55);
  ok('no prompt is too short to be clear', terse.length === 0, terse.map((i) => i.prompt).join(' | '));

  const scenarios = PROFESSIONAL_ITEMS.filter((i) => i.type === 'scenario');
  ok('every situation sets a scene rather than naming a topic',
    scenarios.every((i) => i.prompt.length >= 100), scenarios.filter((i) => i.prompt.length < 100).map((i) => i.id).join(', '));
  ok('every situation offers five graded answers',
    scenarios.every((i) => (i.options ?? []).length === 5));
}

head('It reads in its own language, not a classroom\'s');
{
  ok('the report is named for the work', reportTitle('professional') === 'Professional AI Work Practice Check');
  ok('the index is named for the practice', indexName('professional') === 'Practice Health Score');
  ok('it carries its own note about what this is not',
    (disclaimerExtra('professional') ?? '').includes('not an appraisal'));

  const renamed = (Object.keys(CONSTRUCTS) as ConstructId[])
    .filter((c) => constructName('professional', c) !== CONSTRUCTS[c].name);
  ok('all ten dimensions are named for ordinary work', renamed.length === 10, `${renamed.length} renamed`);

  const ownPrinciples = (Object.keys(CONSTRUCTS) as ConstructId[])
    .filter((c) => constructPrinciple('professional', c) !== CONSTRUCTS[c].principle);
  ok('all ten carry their own principle', ownPrinciples.length === 10, `${ownPrinciples.length} written`);
}

head('It scores across the whole route');
{
  const maxV = (it: Item) => (it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5);
  const build = (pick: (it: Item) => number, usage = 4): Submission => {
    const answers: Record<string, number> = {};
    applicableItems('professional', usage).forEach((it) => { answers[it.id] = pick(it); });
    return { persona: 'professional', usage, b1: 4, b2: 3, answers };
  };
  const best = compute(build((it) => (it.type === 'reverse' ? 1 : maxV(it))));
  const worst = compute(build((it) => (it.type === 'reverse' ? maxV(it) : 1)));
  ok('healthiest answers reach the summit', best.stage.stage === 10, `stage ${best.stage.stage}`);
  ok('unhealthiest answers land at the first camp', worst.stage.stage === 1, `stage ${worst.stage.stage}`);
  ok('a constraint is named at the bottom', !!worst.bottleneck.construct);
  ok('practices are produced at the bottom', worst.recommendations.length > 0);
  ok('the summit is not told to fix things it has closed', best.recommendations.length <= 2);
  ok('both ends carry an archetype', !!best.archetype.name && !!worst.archetype.name);

  const mid = compute(build((it) => Math.max(1, Math.min(maxV(it), Math.round(maxV(it) / 2)))));
  ok('a middling profile lands in the middle of the route',
    mid.stage.stage >= 2 && mid.stage.stage <= 9, `stage ${mid.stage.stage}`);
  ok('every dimension is scored for it',
    (Object.keys(CONSTRUCTS) as ConstructId[]).every((c) => typeof mid.dimensions[c]?.score === 'number'));
}

head('It reads as work, and asks about the rest of life too');
{
  const all = PROFESSIONAL_ITEMS.map((i) => `${i.prompt} ${(i.options ?? []).map((o) => o.label).join(' ')}`).join(' ').toLowerCase();
  for (const word of ['student', 'classroom', 'lesson', 'pupil', 'congregation', 'sermon', 'homework']) {
    ok(`nothing about a ${word}`, !all.includes(word));
  }
  ok('home is in scope, as the persona promises', /home|family|kitchen|outside it/.test(all));

  const src = fs.readFileSync(path.join(process.cwd(), 'src', 'items', 'professional.ts'), 'utf-8');
  ok('no dash characters', !src.includes('—') && !src.includes('–'));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
