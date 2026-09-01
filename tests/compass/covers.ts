/**
 * The six assessment covers.
 *
 * A cover carries a person's name and their result to someone who may print it
 * or forward it. These checks are about that: the name is never truncated, the
 * result never falls below its floor, every persona gets its own layout, and
 * nothing that ranks a respondent appears.
 */
import fs from 'fs';
import path from 'path';
import { compute, applicableItems } from '../../src/engine';
import type { Persona } from '../../src/engine/types';
import { toCoverData, COVER_PERSONA, type AssessmentCoverData } from '../../src/lib/covers/data';
import { resultSize, nameSize, resultLength, nameLength } from '../../src/lib/covers/kit';

let pass = 0; let fail = 0;
const ok = (name: string, cond: boolean, got?: unknown) => {
  if (cond) { pass += 1; console.log('  ok   ', name); }
  else { fail += 1; console.log('  FAIL ', name, got !== undefined ? `got ${JSON.stringify(got)}` : ''); }
};
const head = (t: string) => console.log(`\n${t}`);

const PERSONAS: Persona[] = ['student', 'teacher', 'parent', 'administrator', 'pastor', 'business'];
const result = (p: Persona) => {
  const items = applicableItems(p, 3);
  const a: Record<string, number> = {};
  items.forEach((it, i) => {
    const mx = it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5;
    a[it.id] = ((i * 3) % mx) + 1;
  });
  return compute({ persona: p, usage: 3, b1: 4, b2: 3, answers: a });
};

head('The mapper');
for (const p of PERSONAS) {
  const d = toCoverData({ result: result(p), name: 'Alex Morgan' });
  ok(`${p}: maps to its own cover persona`, d.persona === COVER_PERSONA[p], d.persona);
  ok(`${p}: carries every required field`,
    !!(d.assessmentName && d.resultTitle && d.resultSummary && d.personName
      && d.assessmentDate && d.reportId && d.accessUrl));
}
ok('the six cover personas are distinct',
  new Set(PERSONAS.map((p) => COVER_PERSONA[p])).size === 6);
ok('a business cover prefers the company it was given',
  toCoverData({ result: result('business'), name: 'Rowan Blake', company: 'Harbour Joinery' })
    .personName === 'Harbour Joinery');
ok('and falls back to the person when there is none',
  toCoverData({ result: result('business'), name: 'Rowan Blake' }).personName === 'Rowan Blake');
ok('a stored record gives a traceable reference', (() => {
  const d = toCoverData({ result: result('student'), name: 'A', leadId: 'abc12345-0000-0000-0000-000000000000' });
  return d.reportId === 'STU-ABC12345';
})(), toCoverData({ result: result('student'), name: 'A', leadId: 'abc12345-0000-0000-0000-000000000000' }).reportId);

head('Nothing that ranks a respondent');
for (const p of PERSONAS) {
  const r = result(p);
  const d = toCoverData({ result: r, name: 'Alex Morgan' });
  const text = Object.values(d).filter((v) => typeof v === 'string').join(' ');
  ok(`${p}: no score, stage, or index on the cover`,
    !new RegExp(`\\b${r.stage.rawIndex}\\b|stage \\d|out of 100|index`, 'i').test(text), text.slice(0, 80));
}

head('The readability floors');
const CASES: Array<[string, string]> = [
  ['short', 'Building Momentum'],
  ['long', 'Holding Human Judgment Across Interdependent Systems'],
];
for (const [label, title] of CASES) {
  ok(`a ${label} result title stays at or above the 36pt floor`, resultSize(title) >= 36, resultSize(title));
}
const NAMES: Array<[string, string]> = [
  ['short', 'Alex Morgan'],
  ['long', 'Alexandria-River Morgan-Washington'],
];
for (const [label, n] of NAMES) {
  ok(`a ${label} name stays at or above the 18pt floor`, nameSize(n) >= 18, nameSize(n));
}
ok('a longer result is set smaller, not clipped',
  resultSize(CASES[1][1]) < resultSize(CASES[0][1]));
ok('a longer name is set smaller, not truncated',
  nameSize(NAMES[1][1]) < nameSize(NAMES[0][1]));
// The brief sets the boundaries at > 52 and > 34, so its own longest fixtures
// land exactly on the edge and classify as medium. That is the specified rule
// and it still clears both floors, which is what the rule exists to protect.
ok('length states follow the specified boundaries',
  resultLength('Building Momentum') === 'short'
  && resultLength('Holding Human Judgment Across Interdependent Systems') === 'medium'
  && resultLength('Holding Human Judgment Across Many Interdependent Systems') === 'long'
  && nameLength('Alex Morgan') === 'short'
  && nameLength('Alexandria-River Morgan-Washington') === 'medium'
  && nameLength('Alexandria-Riverside Morgan-Washington') === 'long',
  [resultLength('Holding Human Judgment Across Interdependent Systems'),
    nameLength('Alexandria-River Morgan-Washington')]);
ok('even the longest plausible result clears the floor',
  resultSize('Holding Human Judgment Across Many Interdependent Systems Every Day') >= 36);
ok('even the longest plausible name clears the floor',
  nameSize('Alexandria-Riverside Morgan-Washington-Fitzgerald') >= 18);

head('A name is never shortened');
{
  const long = 'Alexandria-River Morgan-Washington';
  const d: AssessmentCoverData = toCoverData({ result: result('student'), name: long });
  ok('the mapper passes the whole name through', d.personName === long, d.personName);
  ok('nothing is ellipsised', !d.personName.includes('…') && !d.personName.includes('...'));
}

head('The assets exist');
for (const f of ['student.jpg', 'teacher.jpg', 'parent.jpg', 'leader.jpg', 'minister.jpg', 'business.jpg', 'mark.png']) {
  ok(`artwork ${f}`, fs.existsSync(path.join(process.cwd(), 'public', 'covers', f)));
}
for (const f of ['SourceSerif4-Regular.ttf', 'SourceSerif4-SemiBold.ttf', 'SourceSerif4-SemiBoldItalic.ttf',
  'IBMPlexSans-Regular.ttf', 'IBMPlexSans-SemiBold.ttf', 'IBMPlexMono-Regular.ttf', 'IBMPlexMono-Medium.ttf']) {
  ok(`font ${f} is vendored`, fs.existsSync(path.join(process.cwd(), 'public', 'fonts', f)));
}

head('Six layouts, not one template');
{
  const src = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'covers', 'layouts.tsx'), 'utf-8');
  for (const n of ['StudentCover', 'TeacherCover', 'ParentCover', 'LeaderCover', 'MinisterCover', 'BusinessCover']) {
    ok(`${n} is its own component`, new RegExp(`function ${n}\\(`).test(src));
  }
  ok('an unknown persona fails loudly rather than showing the wrong design',
    /throw new Error\(`No cover layout for persona/.test(src));
  ok('the cover is US Letter', /LETTER = \{ w: 612, h: 792 \}/.test(
    fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'covers', 'kit.tsx'), 'utf-8')));
}

head('The page opens on the same six designs');
{
  const web = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'compass', 'ResultCover.tsx'), 'utf-8');
  const css = fs.readFileSync(path.join(process.cwd(), 'src', 'app', 'compass.css'), 'utf-8');
  const results = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'compass', 'Results.tsx'), 'utf-8');
  ok('the web cover reads from the same mapper as the PDF', /toCoverData/.test(web));
  // the only thing the cover may take from the result is what the mapper returns
  ok('the web cover carries no score', !/result\.(stage|index|composite|constructs|dimensions)/.test(web));
  for (const p of ['student', 'teacher', 'parent', 'leader', 'minister', 'business']) {
    ok(`the page styles the ${p} cover`, css.includes(`.rcover-${p} `));
  }
  ok('every persona result opens on the cover',
    (results.match(/<ResultCover /g) || []).length >= 2);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
