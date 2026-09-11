/**
 * Charts, checked without drawing them.
 *
 * Every chart is a pure function to a flat list of primitives with
 * coordinates, which means most of the brief's acceptance checklist is a unit
 * test rather than a screenshot review: whether a chart carries a callout,
 * whether its alt text states the finding, whether a marker sits where its
 * value says it should, whether a reversed metric is drawn reversed.
 */

import { rangeScene } from '@/report/org/charts/range';
import { quadrantScene } from '@/report/org/charts/quadrant';
import { CALLOUT_MAX, CALLOUT_MAX_WORDS, countCallouts, C, type Prim, type Scene } from '@/report/org/scene';

let pass = 0, fail = 0;
const ok = (label: string, cond: boolean, detail?: string) => {
  if (cond) { pass++; console.log(`  ok    ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ''}`); }
};
const head = (s: string) => console.log(`\n${s}`);

const textsOf = (s: Scene) => s.prims.filter((p): p is Extract<Prim, { k: 'text' }> => p.k === 'text');
const calloutsOf = (s: Scene) => s.prims.filter((p): p is Extract<Prim, { k: 'callout' }> => p.k === 'callout');
const allCopy = (s: Scene) =>
  [s.title, s.alt, ...textsOf(s).map((t) => t.text), ...calloutsOf(s).map((c) => c.text)].join(' | ');

const RANGE = rangeScene({
  title: 'The middle person sits in the developing band',
  median: 58.9, q1: 56.0, q3: 63.5, min: 50.1, max: 73.0, n: 8,
});
const REVERSED = rangeScene({
  title: 'How much depends on the tool',
  median: 40, q1: 30, q3: 55, min: 12, max: 70, n: 8, lowerIsHealthier: true,
});
const QUAD = quadrantScene({
  title: 'Most of your people are capable and using it',
  xLabel: 'Capability and readiness', yLabel: 'Human protection',
  xLow: 'lower', xHigh: 'higher', yLow: 'lower', yHigh: 'higher',
  base: 17, asideLabel: 'deliberately selective use', asideN: 3,
  cells: [
    { key: 'hh', at: 'tr', title: 'Scale and lead', n: 6, share: 35.3, response: 'Scale what they do.' },
    { key: 'hl', at: 'br', title: 'Powerful but exposed', n: 5, share: 29.4, response: 'Judgment work first.', highlight: true },
    { key: 'lh', at: 'tl', title: 'Protected but under-activated', n: 4, share: 23.5, response: 'Bounded practice.' },
    { key: 'll', at: 'bl', title: 'Build the foundation', n: 2, share: 11.8, response: 'Both, together.' },
  ],
});
const ALL: Array<[string, Scene]> = [['range', RANGE], ['reversed range', REVERSED], ['quadrant', QUAD]];

head('Every chart annotates itself');
for (const [name, s] of ALL) {
  const n = countCallouts(s);
  ok(`${name}: carries at least one callout`, n >= 1, `${n} callouts`);
  ok(`${name}: and no more than ${CALLOUT_MAX}`, n <= CALLOUT_MAX, `${n} callouts`);
  for (const c of calloutsOf(s)) {
    const words = c.text.trim().split(/\s+/).length;
    ok(`${name}: callout "${c.text}" is under ${CALLOUT_MAX_WORDS} words`, words <= CALLOUT_MAX_WORDS, `${words} words`);
  }
}

head('Every chart states its finding, in words');
for (const [name, s] of ALL) {
  ok(`${name}: the alt text is a sentence, not a chart type`,
    s.alt.length > 40 && /\d/.test(s.alt) && !/\b(two by two|bar chart|line chart|pie chart|a chart|this chart|matrix of)\b/i.test(s.alt), s.alt);
  ok(`${name}: the title states a conclusion rather than a variable name`,
    s.title.split(/\s+/).length >= 4, s.title);
  ok(`${name}: the alt text ends as a sentence`, /[.]$/.test(s.alt.trim()));
}

head('The alt text carries the findings, not a description of the drawing');
{
  const quadCells = [6, 5, 4, 2];
  ok('the quadrant alt names every cell count',
    quadCells.every((n) => new RegExp(`\\b${n}\\b`).test(QUAD.alt)), QUAD.alt);
  ok('and the population it covers', /\b17\b/.test(QUAD.alt));
  ok('the range alt carries the median, the middle half and the reach',
    ['58.9', '56.0', '63.5', '50.1', '73.0'].every((v) => RANGE.alt.includes(v)), RANGE.alt);
  ok('and names the band the middle person is in', /\b(strength|developing|watch)\b/.test(RANGE.alt));
}

head('Counts lead, and percentages never replace them');
{
  const copy = allCopy(QUAD);
  ok('every cell prints its count', [6, 5, 4, 2].every((n) => new RegExp(`\\b${n}\\b`).test(copy)));
  ok('the base is printed beside each count', /of 17/.test(copy));
  ok('the population reported separately is named',
    /deliberately selective/.test(copy) && /\b3\b/.test(copy));
  ok('no percentage appears without a count nearby',
    !textsOf(QUAD).some((t) => /^\d+%$/.test(t.text.trim())));
}

head('No false precision');
for (const [name, s] of ALL) {
  const nums = allCopy(s).match(/\d+\.\d+/g) ?? [];
  ok(`${name}: nothing carries more than one decimal`,
    nums.every((v) => (v.split('.')[1] ?? '').length <= 1), nums.join(', '));
}

head('The four classifications are drawn as four, not three');
{
  const lines = RANGE.prims.filter((p): p is Extract<Prim, { k: 'line' }> => p.k === 'line');
  const dashed = lines.filter((l) => !!l.dash);
  ok('the vulnerability line is drawn dashed and on its own', dashed.length === 1);
  ok('and in the vulnerability colour, not a band colour',
    dashed[0]?.stroke === C.vulnerability, dashed[0]?.stroke);
  ok('it is taller than the band boundary ticks so it reads as separate',
    !!dashed[0] && Math.abs(dashed[0].y2 - dashed[0].y1) > 16);
  ok('the band boundaries at 40 and 65 are drawn too',
    lines.filter((l) => !l.dash && l.stroke === C.hair && Math.abs(l.y2 - l.y1) === 16).length === 2);
  ok('the vulnerability line is labelled in words', /vulnerability line/.test(allCopy(RANGE)));
}

head('A marker sits where its value says it does');
{
  // The median marker is the only circle on the range, and its x must be the
  // value scaled on to the axis. This is the assertion that would catch a chart
  // drawing the right number in the wrong place.
  const dot = RANGE.prims.find((p): p is Extract<Prim, { k: 'circle' }> => p.k === 'circle' && p.r > 3)!;
  const W = RANGE.w - 8;
  const expected = 4 + (58.9 / 100) * W;
  ok('the median marker is at its own value', Math.abs(dot.cx - expected) < 0.5,
    `${dot.cx.toFixed(2)} against ${expected.toFixed(2)}`);
  const box = RANGE.prims.filter((p): p is Extract<Prim, { k: 'rect' }> => p.k === 'rect' && p.h === 10)[0];
  ok('the middle half starts at Q1', Math.abs(box.x - (4 + (56.0 / 100) * W)) < 0.5);
  ok('and ends at Q3', Math.abs(box.x + box.w - (4 + (63.5 / 100) * W)) < 0.5);
  ok('the median sits inside the middle half', dot.cx >= box.x && dot.cx <= box.x + box.w);
}

head('A reversed metric says so, in bold, and is not silently flipped');
{
  // Case-insensitive on purpose: the failure being guarded against is the
  // caveat being shouted instead of bolded, and a case-sensitive lookup would
  // simply not find it and throw, which aborts the suite instead of reporting.
  const prim = textsOf(REVERSED).find((t) => /lower is healthier/i.test(t.text));
  ok('the caveat is present', !!prim, textsOf(REVERSED).map((t) => t.text).join(' | '));
  ok('it is set in bold', (prim?.weight ?? 400) >= 700, `weight ${prim?.weight}`);
  ok('and not in capitals', !!prim && prim.text === prim.text.toLowerCase(), prim?.text);
  ok('the healthy-high chart does not carry it', !/lower is healthier/.test(allCopy(RANGE)));
  // The canonical value is never altered: the marker still sits at 40.
  const dot = REVERSED.prims.find((p): p is Extract<Prim, { k: 'circle' }> => p.k === 'circle' && p.r > 3)!;
  ok('the canonical value is plotted unaltered',
    Math.abs(dot.cx - (4 + (40 / 100) * (REVERSED.w - 8))) < 0.5);
}

head('The copy rules hold inside the drawing');
for (const [name, s] of ALL) {
  const copy = allCopy(s);
  ok(`${name}: no em-dash or en-dash`, !/[—–]/.test(copy),
    (copy.match(/.{20}[—–].{20}/) ?? []).join(' | '));
  ok(`${name}: no all-caps emphasis`,
    !textsOf(s).some((t) => t.text.length > 3 && t.text === t.text.toUpperCase() && /[A-Z]{4,}/.test(t.text)),
    textsOf(s).filter((t) => t.text.length > 3 && t.text === t.text.toUpperCase()).map((t) => t.text).join(', '));
  ok(`${name}: nothing is set below six points`,
    !textsOf(s).some((t) => t.size < 5.5), textsOf(s).filter((t) => t.size < 5.5).map((t) => `${t.text}@${t.size}`).join(', '));
}

head('A scene stays inside its own box');
for (const [name, s] of ALL) {
  const out = s.prims.filter((p) => {
    if (p.k === 'rect') return p.x < -1 || p.y < -1 || p.x + p.w > s.w + 1 || p.y + p.h > s.h + 1;
    if (p.k === 'circle') return p.cx - p.r < -1 || p.cx + p.r > s.w + 1;
    if (p.k === 'line') return Math.max(p.x1, p.x2) > s.w + 1 || Math.min(p.y1, p.y2) < -1;
    return false;
  });
  ok(`${name}: nothing is drawn outside the canvas`, out.length === 0,
    out.map((p) => p.k).join(', '));
}

head('The two renderers agree, because there is one geometry');
{
  // Not a snapshot of two outputs: the point of the design is that there is
  // only one set of coordinates, and both renderers read it.
  const a = rangeScene({ title: 'x', median: 50, q1: 40, q3: 60, min: 10, max: 90, n: 12 });
  const b = rangeScene({ title: 'x', median: 50, q1: 40, q3: 60, min: 10, max: 90, n: 12 });
  ok('the same input gives the same scene', JSON.stringify(a) === JSON.stringify(b));
  ok('a different input gives a different scene',
    JSON.stringify(a) !== JSON.stringify(rangeScene({ title: 'x', median: 51, q1: 40, q3: 60, min: 10, max: 90, n: 12 })));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
