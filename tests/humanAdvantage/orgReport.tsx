/**
 * The organisation report, read end to end.
 *
 * The PDF's fonts are subset, so glyphs on a finished page carry a private
 * encoding and no text can be read back out of the file on this machine. This
 * walks the element tree renderToBuffer is handed, invoking function components
 * rather than only descending into children, which is the same tree that gets
 * drawn. Section 12 of the brief is checked against it.
 */

import fs from 'fs';
import path from 'path';
import React from 'react';
import { compute, applicableItems } from '@/engine';
import { buildOrganisationAnalytics } from '@/engine/orgAnalytics';
import { GroupTooSmallError, type GroupMember } from '@/engine/group';
import { OrganisationDocument, PAGE_SIZES } from '@/report/org/document';
import { CHAPTER_META } from '@/report/org/chapters/registry';
import { CHAPTER_COMPONENTS } from '@/report/org/chapters/all';
import { BLOCK_LABELS } from '@/engine/orgCopy';
import { emptyLabels, countCallouts, CALLOUT_MAX } from '@/report/org/scene';
import { CONSTRUCT_IDS, type ConstructId, type Item, type Persona, type Submission } from '@/engine/types';
import { DIMENSIONS } from '@/engine/dictionary';

let pass = 0, fail = 0;
const ok = (label: string, cond: boolean, detail?: string) => {
  if (cond) { pass++; console.log(`  ok    ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ''}`); }
};
const head = (s: string) => console.log(`\n${s}`);

const maxV = (it: Item) => (it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5);
function member(p: Persona, u: number, b: number, i: number,
                by: Partial<Record<ConstructId, number>> = {}): GroupMember {
  const answers: Record<string, number> = {};
  applicableItems(p, u).forEach((it) => {
    const top = maxV(it); const lv = (it.construct && by[it.construct]) ?? b;
    const h = Math.max(1, Math.min(top, Math.round(((lv - 1) / 4) * (top - 1)) + 1));
    answers[it.id] = it.type === 'reverse' ? top + 1 - h : h;
  });
  return { key: `r${i}`, persona: p, usage: u, felt: 4, predicted: 3,
    result: compute({ persona: p, usage: u, b1: 4, b2: 3, answers } as Submission),
    takenAt: '2026-09-01T00:00:00.000Z',
    versions: { instrument: '2.3', scoring: '2.1', scenario: '2.0', language: 'en-GB' } };
}
const cohort = (n: number, seed = 0) => Array.from({ length: n }, (_, i) =>
  member(i % 7 === 6 ? 'teacher' : 'professional', ((i + seed) % 5) + 1, ((i + seed) % 5) + 1, i));

/* ----------------------------------------------------------- the walker */

type Node = { type?: unknown; props?: Record<string, unknown> };
interface Walked { text: string[]; scenes: number; svgs: number; unrendered: string[] }

function walk(node: unknown, out: Walked, depth = 0): Walked {
  if (node === null || node === undefined || node === false || depth > 80) return out;
  if (typeof node === 'string' || typeof node === 'number') { out.text.push(String(node)); return out; }
  if (Array.isArray(node)) { node.forEach((c) => walk(c, out, depth + 1)); return out; }
  const el = node as Node;
  if (el.props && 'scene' in el.props) out.scenes++;
  if (typeof el.type === 'function') {
    const name = (el.type as { name?: string }).name ?? 'anonymous';
    try { walk((el.type as (p: unknown) => unknown)(el.props ?? {}), out, depth + 1); }
    catch (e) { out.unrendered.push(`${name}: ${(e as Error).message}`); }
    return out;
  }
  const t = String(el.type ?? '');
  if (/SVG|Svg/i.test(t)) out.svgs++;
  if (typeof el.props?.render === 'function') {
    try { out.text.push(String((el.props.render as (x: unknown) => unknown)({ pageNumber: 1, totalPages: 30 }))); }
    catch { /* not text */ }
  }
  if (el.props?.children !== undefined) walk(el.props.children, out, depth + 1);
  return out;
}
const fresh = (): Walked => ({ text: [], scenes: 0, svgs: 0, unrendered: [] });

const A = buildOrganisationAnalytics('Meridian Operations Group', cohort(50));
const doc = OrganisationDocument({ a: A, size: 'Letter' });
const pages = (() => {
  const kids = (doc as { props: { children: unknown } }).props.children;
  return (Array.isArray(kids) ? kids : [kids]).flat().filter(Boolean);
})();
const perPage = pages.map((p) => walk(p, fresh()));
const allText = perPage.flatMap((w) => w.text).join(' · ');

head('Every chapter is present, in order, and nothing failed to render');
{
  ok('the document assembles', pages.length >= CHAPTER_META.length + 3,
    `${pages.length} pages for ${CHAPTER_META.length} chapters plus cover, contents and appendix`);
  ok('no component failed to render',
    perPage.every((w) => w.unrendered.length === 0),
    perPage.flatMap((w) => w.unrendered).slice(0, 3).join(' | '));
  ok('every chapter has a component', CHAPTER_COMPONENTS.length === CHAPTER_META.length);
  ok('the components are in chapter order',
    CHAPTER_COMPONENTS.every((c, i) => c.n === i + 1));
  for (const m of CHAPTER_META) {
    ok(`chapter ${m.number} names itself on the page`,
      allText.includes(m.title), m.title);
  }
  ok('every chapter carries the where-this-comes-from line',
    CHAPTER_META.every((m) => allText.includes(m.source)),
    CHAPTER_META.filter((m) => !allText.includes(m.source)).map((m) => m.number).join(', '));
  ok('every chapter closes with the one line box',
    (allText.match(/In one line: /g) ?? []).length >= CHAPTER_META.length,
    `${(allText.match(/In one line: /g) ?? []).length} boxes`);
}

head('No page in the chapters is without a visual');
{
  // The cover carries the partnership strip, the appendix is allowed to be text-led.
  const chapterPages = perPage.slice(2, 2 + CHAPTER_META.length);
  const bare = chapterPages
    .map((w, i) => ({ n: i + 1, scenes: w.scenes }))
    .filter((x) => x.scenes === 0);
  ok('every chapter page carries at least one visual', bare.length === 0,
    bare.map((b) => `chapter ${b.n}`).join(', '));
  ok('and the report carries a substantial number in total',
    chapterPages.reduce((s, w) => s + w.scenes, 0) >= CHAPTER_META.length * 1.5,
    `${chapterPages.reduce((s, w) => s + w.scenes, 0)} visuals across ${chapterPages.length} chapters`);
}

head('Every explanatory block is present, with the fixed labels in order');
{
  for (const label of BLOCK_LABELS) {
    ok(`the label "${label}" appears`, allText.includes(label));
  }
  const counts = BLOCK_LABELS.map((l) => (allText.match(new RegExp(l, 'g')) ?? []).length);
  ok('all four labels appear the same number of times, so none is orphaned',
    new Set(counts).size === 1, counts.join(', '));
  ok('and they appear on most chapters', counts[0] >= 15, `${counts[0]} blocks`);
}

head('The body speaks one vocabulary');
{
  //
  // The executive names are the body's vocabulary. A canonical name is allowed
  // in exactly two places: as small print on the dimension heatmap, and in the
  // appendix alias table. Anywhere else it is a leak, and chapter 12 had one:
  // the segment panels read "held most by Human Agency" because the aggregate
  // carried the engine's name and the chapter printed it straight through.
  //
  const canonicalOnly = CONSTRUCT_IDS
    .map((id) => DIMENSIONS[id].canonicalName)
    .filter((n) => !CONSTRUCT_IDS.some((id) => DIMENSIONS[id].executiveName === n));
  ok('there are canonical names that differ from the body names',
    canonicalOnly.length >= 8, canonicalOnly.join(', '));
  //
  // Three sanctioned appearances: the small print on the heatmap row, the small
  // print on the dimension card, and the appendix alias table. A fourth is a
  // leak. Counting has to respect word boundaries, because "AI Fluency" is a
  // substring of the executive name "Practical AI Fluency" and a naive count
  // reported fifteen of them.
  //
  for (const name of canonicalOnly) {
    const re = new RegExp(`(?<![A-Za-z] )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    const hits = (allText.match(re) ?? []).length;
    ok(`"${name}" appears only as small print and in the appendix`, hits <= 3, `${hits} occurrences`);
  }
  for (const id of CONSTRUCT_IDS) {
    ok(`the body uses "${DIMENSIONS[id].executiveName}"`, allText.includes(DIMENSIONS[id].executiveName));
  }

  //
  // The cohort above happens to produce a segment whose constraint is named the
  // same in both vocabularies, so reverting the fix changed nothing in it. This
  // one produces a segment constrained on a dimension whose canonical and
  // executive names differ, which is the case the guard exists for.
  //
  const segCohort = buildOrganisationAnalytics('Seg',
    Array.from({ length: 30 }, (_, i) =>
      member(i % 7 === 6 ? 'teacher' : 'professional', 4, (i % 5) + 1, i)));
  const shownSeg = segCohort.group.segments.find((x) => !x.suppressed && x.constraint);
  ok('the fixture produces a shown segment with a named constraint', !!shownSeg,
    segCohort.group.segments.map((x) => `${x.value}:${x.suppressed}`).join(' '));
  if (shownSeg?.constraint) {
    const canonical = DIMENSIONS[shownSeg.constraint.construct].canonicalName;
    const executive = DIMENSIONS[shownSeg.constraint.construct].executiveName;
    ok('and its constraint differs between the two vocabularies',
      canonical !== executive, `${canonical} is also the body name`);
    const segText = (() => {
      const d = OrganisationDocument({ a: segCohort, size: 'Letter' });
      const kids = (d as { props: { children: unknown } }).props.children;
      return (Array.isArray(kids) ? kids : [kids]).flat().filter(Boolean)
        .map((p) => walk(p, fresh()).text.join(' ')).join('\n');
    })();
    // Searched across the whole document rather than sliced on the chapter
    // title, which also appears on the contents page and made the slice land
    // on the wrong half of the report.
    ok('the segment panel names it in the body vocabulary',
      segText.includes(`held most by ${executive}`),
      (segText.match(/held most by [^|]{0,32}/g) ?? []).slice(0, 3).join(' | '));
    ok('and never in the engine vocabulary',
      !segText.includes(`held most by ${canonical}`));
  }
}

head('The copy rules hold on the finished page');
{
  ok('no em-dash or en-dash anywhere', !/[—–]/.test(allText),
    (allText.match(/.{30}[—–].{30}/) ?? []).slice(0, 2).join(' | '));
  //
  // The rule is about emphasis in prose. The brand lockup sets its own wordmark
  // in capitals and has done on every report this product makes, so excluding
  // it keeps the organisation report consistent with the rest rather than
  // making it the only one that differs.
  //
  const BRAND_LOCKUP = ['HUMAN ADVANTAGE ASSESSMENT'];
  const shouted = perPage.flatMap((w) => w.text)
    .filter((t) => t.length > 4 && /^[A-Z ]{5,}$/.test(t.trim()))
    .filter((t) => !BRAND_LOCKUP.includes(t.trim()));
  ok('no all-caps emphasis outside the brand lockup', shouted.length === 0,
    shouted.slice(0, 3).join(' | '));
  ok('never says pupil', !/\bpupils?\b/i.test(allText));
  ok('speaks in the second person', /\byour (people|organisation|workforce)\b/i.test(allText));
  ok('no statistic is called significant', !/\bsignificant\b/i.test(allText));
  //
  // The rule is that nothing is estimated, not that the words may not appear.
  // Chapter 21 is required to name the economic module and say what collecting
  // it would add, and the sentence that says productivity figures and cost
  // savings are absent precisely because they depend on uncollected modules is
  // the honest statement the brief asks for. What must never appear is a value:
  // a currency symbol, or a number attached to one of those claims.
  //
  ok('no currency appears anywhere', !/[$£€]/.test(allText),
    (allText.match(/.{30}[$£€].{30}/) ?? []).slice(0, 2).join(' | '));
  ok('no figure is attached to a money, time or productivity claim',
    !/\d[\d.,]*\s*(per cent|%)?\s*(saved|savings|return on investment|productivity|cost reduction)/i.test(allText)
    && !/(saved|savings|productivity|cost)\s*(of|:)?\s*\d/i.test(allText),
    (allText.match(/.{40}(saved|savings|productivity).{40}/gi) ?? []).slice(0, 2).join(' | '));
  ok('and where those measures are named, they are named as not collected',
    !/time saved/i.test(allText) || /not collected/i.test(allText));
  ok('no comparison with other organisations',
    !/other organisations|industry average|\bbenchmark/i.test(allText));
  ok('nothing carries more than one decimal',
    (allText.match(/\d+\.\d\d+/g) ?? []).length === 0,
    (allText.match(/\d+\.\d\d+/g) ?? []).slice(0, 4).join(', '));
}

head('Counts lead, and nothing suppressed reaches the page');
{
  ok('percentages appear beside counts rather than alone',
    !perPage.flatMap((w) => w.text).some((t) => /^\s*\d+%\s*$/.test(t)));
  const lop = buildOrganisationAnalytics('R', [
    ...Array.from({ length: 9 }, (_, i) => member('professional', 4, 3, i)),
    ...Array.from({ length: 3 }, (_, i) => member('teacher', 4, 3, 100 + i)),
  ]);
  const lopText = (() => {
    const d = OrganisationDocument({ a: lop, size: 'Letter' });
    const kids = (d as { props: { children: unknown } }).props.children;
    return (Array.isArray(kids) ? kids : [kids]).flat().filter(Boolean)
      .map((p) => walk(p, fresh()).text.join(' ')).join('\n');
  })();
  ok('a withheld cut is declared on the page', /[Ww]ithheld/.test(lopText));
  ok('and says what it would take to show it', /Needs about \d+ more/.test(lopText));
  ok('and never prints the size of the cut it withheld',
    !/[Ww]ithheld[^.]{0,80}\b(3|9) people\b/.test(lopText),
    (lopText.match(/.{0,40}[Ww]ithheld.{0,80}/) ?? []).slice(0, 2).join(' | '));
  ok('no suppressed segment count survives into the aggregate',
    lop.group.segments.filter((s) => s.suppressed).every((s) => s.n === undefined));
}

head('The disclaimers are present, unchanged');
{
  ok('the assessment indices disclaimer',
    allText.includes('These are assessment indices built from self reported answers'));
  ok('the not-for-ranking disclaimer',
    allText.includes('must not be used') && allText.includes('rank, appraise or select individuals'));
  ok('and the not-a-psychometric wording',
    allText.includes('not a clinical diagnosis') && allText.includes('validated psychometric measurement'));
}

head('The report refuses what it must, and caveats what it should');
{
  const refuse = (n: number) => {
    try { buildOrganisationAnalytics('x', cohort(n)); return null; }
    catch (e) { return e as Error; }
  };
  ok('one person is refused', refuse(1) instanceof GroupTooSmallError);
  ok('two people are refused', refuse(2) instanceof GroupTooSmallError);
  ok('three is the floor', refuse(3) === null);
  const six = buildOrganisationAnalytics('Six', cohort(6));
  // This read `six.cohort`, which does not exist, behind a conditional that
  // returned true either way: an assertion that could not fail. The typechecker
  // in the production build found it; the suite had been passing it all along.
  ok('a cohort under seven is flagged for the stronger caveat',
    six.group.cohort.smallCohort === true);
  ok('and a cohort of thirty is not',
    buildOrganisationAnalytics('Thirty', cohort(30)).group.cohort.smallCohort === false);
  const sixText = (() => {
    const d = OrganisationDocument({ a: six, size: 'Letter' });
    const kids = (d as { props: { children: unknown } }).props.children;
    return (Array.isArray(kids) ? kids : [kids]).flat().filter(Boolean)
      .map((p) => walk(p, fresh()).text.join(' ')).join('\n');
  })();
  ok('and the cover carries the stronger caveat',
    /small group/i.test(sixText) && /indicative/i.test(sixText)
    && /segment cuts are withheld/i.test(sixText),
    (sixText.match(/.{0,30}small group.{0,90}/i) ?? []).slice(0, 1).join(''));
  ok('no confidence interval below thirty', buildOrganisationAnalytics('x', cohort(29)).group.index.ci === undefined);
  ok('no correlations below thirty', buildOrganisationAnalytics('x', cohort(29)).group.correlations.length === 0);
}

head('Nothing is estimated, and the uncollected modules say so');
{
  ok('every measurement module is marked not collected',
    A.futureMeasurement.every((m) => m.collected === false));
  ok('the page says so in words', allText.includes('not collected yet'));
  ok('and carries no values for them',
    A.futureMeasurement.every((m) => !/\d/.test(m.whatItWouldAdd)));
}

head('The flip test: headings, figures and callouts alone tell the story');
{
  // A reader who turns every page and reads only the headings and the callouts
  // must still be able to say what workforce this is, where the exposure is,
  // what the bottleneck is, and what to do first.
  const headings = CHAPTER_META.map((m) => m.title).join(' ');
  const g = A.group;
  ok('what workforce this is: the stage is named in a heading or strip',
    allText.includes(g.centre.stageName));
  ok('where the exposure is: the three governance capabilities are named',
    g.governance.every((x) => allText.includes(
      x.construct === 'responsibleUse' ? 'The Line You Hold'
        : x.construct === 'verification' ? 'Checking Before You Act' : 'Decision Ownership')));
  ok('what the bottleneck is: the top constraint is named',
    !g.constraints[0] || allText.includes(g.constraints[0].name)
    || allText.includes('Checking Before You Act') || allText.includes('Decision Ownership'));
  ok('what to do first: the three things box is present',
    allText.includes('If you do only three things next, do these'));
  ok('the headings alone cover all six levels of the hierarchy',
    [1, 2, 3, 4, 5, 6].every((lvl) => CHAPTER_META.some((m) => m.level === lvl)));
}

head('Both page sizes render, and the footer numbers every page');
{
  for (const size of ['Letter', 'A4'] as const) {
    const d = OrganisationDocument({ a: A, size });
    const kids = (d as { props: { children: unknown } }).props.children;
    const ps = (Array.isArray(kids) ? kids : [kids]).flat().filter(Boolean);
    ok(`${size}: the document assembles`, ps.length >= CHAPTER_META.length + 3);
    const t = ps.map((p) => walk(p, fresh()).text.join(' ')).join('\n');
    ok(`${size}: the running footer numbers pages`, /page 1 of 30/.test(t));
    ok(`${size}: the footer names the organisation`, t.includes('Meridian Operations Group'));
  }
  // Widened out of the literal types, which are constants and which the
  // typechecker correctly refuses to compare as though they might be equal.
  ok('the two sizes are genuinely different widths',
    (PAGE_SIZES.Letter.w as number) !== (PAGE_SIZES.A4.w as number));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
