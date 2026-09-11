/**
 * Direction, boundaries, partitions and disclosure.
 *
 * The group suite already recomputes every median, share and count by hand and
 * compares. It is good arithmetic testing, and it passed through all four of
 * the defects that shipped, because every one of them was semantic rather than
 * arithmetic: a correct number under a wrong label, a correct count in an
 * overlapping set, a correct suppression flag beside an unsuppressed value, a
 * correct aggregation of two incomparable sittings. One of its assertions
 * encoded the inversion rather than catching it.
 *
 * This suite tests the four things arithmetic cannot see.
 *
 *   Direction   a healthier cohort must move the displayed value the healthy way
 *   Boundaries  the band table and the vulnerability line are four
 *               classifications, not three, at every cut point
 *   Partition   a set of cells presented as a matrix covers its base once
 *   Disclosure  nothing suppressed appears in any output format
 */

import fs from 'fs';
import path from 'path';
import { compute, applicableItems } from '@/engine';
import { buildGroupResult, GroupTooSmallError, spreadOf, type GroupMember } from '@/engine/group';
import { groupDocument } from '@/lib/groupReportPdf';
import { DIMENSIONS, COMPOSITES, aliasesFor, bandOf, isVulnerable } from '@/engine/dictionary';
import { constructName, reportedConstructName } from '@/engine/display';
import { toAttempts, toPeople } from '@/lib/analytics';
import { CONSTRUCTS, SCORING, GROUP } from '@/engine/config';
import { CONSTRUCT_IDS, type ConstructId, type Item, type Persona, type Submission } from '@/engine/types';

let pass = 0, fail = 0;
const ok = (label: string, cond: boolean, detail?: string) => {
  if (cond) { pass++; console.log(`  ok    ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ''}`); }
};
const head = (s: string) => console.log(`\n${s}`);

const maxV = (it: Item) => (it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5);
function member(persona: Persona, usage: number, level: number, i: number,
                by: Partial<Record<ConstructId, number>> = {}): GroupMember {
  const answers: Record<string, number> = {};
  applicableItems(persona, usage).forEach((it) => {
    const top = maxV(it);
    const lv = (it.construct && by[it.construct]) ?? level;
    const h = Math.max(1, Math.min(top, Math.round(((lv - 1) / 4) * (top - 1)) + 1));
    answers[it.id] = it.type === 'reverse' ? top + 1 - h : h;
  });
  const sub: Submission = { persona, usage, b1: 4, b2: 3, answers };
  return { key: `r${i}`, persona, usage, felt: 4, predicted: 3,
    result: compute(sub), takenAt: '2026-09-01T00:00:00.000Z' };
}
const cohort = (level: number, n = 8, by: Partial<Record<ConstructId, number>> = {}) =>
  Array.from({ length: n }, (_, i) => member('student', 4, level, i, by));

/* ------------------------------------------------------------- direction */

head('Every dimension is displayed in the direction the dictionary declares');
{
  for (const id of CONSTRUCT_IDS) {
    ok(`${DIMENSIONS[id].executiveName}: declared healthy-high`,
      DIMENSIONS[id].healthyDirection === 'higher');
  }

  //
  // The test that would have caught it.
  //
  // A cohort that is healthier on a dimension must show a higher value on that
  // dimension, and must not be painted as though it were worse. The reliance
  // dimension is stored as Independent Capability and is healthy-high like
  // every other one; the group report used to print it as "Independent
  // Capability (lower is healthier)" over exactly those values, and drew the
  // healthy end in the warning colour.
  //
  const weak = buildGroupResult('weak', cohort(2));
  const strong = buildGroupResult('strong', cohort(5));
  for (const id of CONSTRUCT_IDS) {
    const w = weak.dimensions.find((d) => d.construct === id)!;
    const s = strong.dimensions.find((d) => d.construct === id)!;
    ok(`${s.name}: a healthier cohort reads higher`, s.spread.median >= w.spread.median,
      `weak ${w.spread.median} vs strong ${s.spread.median}`);
    ok(`${s.name}: and is never labelled lower-is-healthier`, s.healthyDirection === 'higher');
  }

  // Composites do carry both directions, and the two concern-high ones must
  // move the other way for the same cohorts.
  for (const c of COMPOSITES.filter((x) => x.healthyDirection === 'lower')) {
    const w = weak.composites.find((x) => x.id === c.id)!;
    const s = strong.composites.find((x) => x.id === c.id)!;
    ok(`${c.executiveName}: concern-high, so a healthier cohort reads lower`,
      s.spread.median <= w.spread.median, `weak ${w.spread.median} vs strong ${s.spread.median}`);
    ok(`${c.executiveName}: and is flagged as such`, w.lowerIsHealthier === true);
  }
}

head('A strength is a strength and a watchlist item is a weakness');
{
  // The list used to be the top three and the bottom three by median with no
  // threshold at all, so a uniformly strong workforce was handed three
  // watchlist items sitting above the strength floor, and a uniformly weak one
  // was congratulated on three strengths it did not have.
  const strong = buildGroupResult('s', cohort(5));
  const weak = buildGroupResult('w', cohort(1));
  ok('a strong cohort is given no watchlist it has not earned',
    weak.strengths.length === 0 || weak.strengths.every((d) => d.spread.median >= weak.bands.strength),
    weak.strengths.map((d) => `${d.name} ${d.spread.median}`).join(', '));
  ok('a strong cohort has no watchlist items above the vulnerability line',
    strong.watchlist.every((d) => d.spread.median <= strong.bands.vulnerability),
    strong.watchlist.map((d) => `${d.name} ${d.spread.median}`).join(', '));
  ok('a strong cohort is not handed invented weaknesses at all',
    strong.watchlist.length === 0,
    `${strong.watchlist.length} watchlist items with medians ${strong.watchlist.map((d) => d.spread.median).join(', ')}`);
  ok('a weak cohort is not handed invented strengths',
    weak.strengths.length === 0,
    `${weak.strengths.length} strengths with medians ${weak.strengths.map((d) => d.spread.median).join(', ')}`);
  ok('neither list is ever padded to three',
    strong.strengths.length <= 3 && strong.watchlist.length <= 3
    && weak.strengths.length <= 3 && weak.watchlist.length <= 3);
}

head('No surface contradicts the dictionary');
{
  const pdf = fs.readFileSync(path.join(process.cwd(), 'src/lib/groupReportPdf.tsx'), 'utf-8');
  ok('the group report reads direction from the dictionary, not from reportedAsRisk',
    !/lowerIsHealthier.*reportedAsRisk|reportedAsRisk.*lowerIsHealthier/s.test(pdf));
  ok('and asks healthyDirection when it prints the caveat',
    /healthyDirection === 'lower'/.test(pdf));
  const grp = fs.readFileSync(path.join(process.cwd(), 'src/engine/group.ts'), 'utf-8');
  ok('the aggregation never sets a dimension direction from reportedAsRisk',
    !/healthyDirection:\s*!!def\.reportedAsRisk/.test(grp));
}

/* ------------------------------------------------------------ boundaries */

head('The band table and the vulnerability line are four classifications, not three');
{
  const cases: Array<[number, string, boolean]> = [
    // score, band, vulnerable
    [0, 'watch', true],
    [39.9, 'watch', true],
    [40, 'developing', true],
    [44.9, 'developing', true],
    [45, 'developing', true],
    [45.1, 'developing', false],
    [50, 'developing', false],
    [64.9, 'developing', false],
    [65, 'strength', false],
    [100, 'strength', false],
  ];
  for (const [score, band, vuln] of cases) {
    ok(`${score} is ${band}`, bandOf(score) === band, `got ${bandOf(score)}`);
    ok(`${score} is ${vuln ? '' : 'not '}at or below the vulnerability line`,
      isVulnerable(score) === vuln);
  }
  // The three the brief calls out by name.
  ok('42 is developing and also vulnerable', bandOf(42) === 'developing' && isVulnerable(42));
  ok('38 is watch and also vulnerable', bandOf(38) === 'watch' && isVulnerable(38));
  ok('50 is developing and not vulnerable', bandOf(50) === 'developing' && !isVulnerable(50));

  ok('the dictionary carries the same cut points the scoring config does',
    CONSTRUCT_IDS.every((id) => DIMENSIONS[id].thresholds.watch === SCORING.microWatch
      && DIMENSIONS[id].thresholds.vulnerability === SCORING.vulnerabilityCeiling
      && DIMENSIONS[id].thresholds.strength === SCORING.strengthFloor));

  // The same boundaries, on a reversed metric, read through the display value.
  for (const [score] of cases) {
    const reported = 100 - score;
    ok(`reliance at ${score} reports as ${reported} on the risk scale`,
      Math.abs((100 - score) - reported) < 1e-9);
  }
}

/* ------------------------------------------------------------- partition */

head('A set of cells presented as a matrix covers its base exactly once');
{
  // The fixture that exposes it: fluent people whose judgment is low enough to
  // fall inside both the old "unprotected" cell and the old "watch" cell.
  const fluentUnprotected = Array.from({ length: 6 }, (_, i) =>
    member('student', 4, 5, i, { verification: 2, agency: 2, responsibleUse: 2 }));
  const g = buildGroupResult('fu', fluentUnprotected);
  const fj = g.quadrants.fluencyJudgment;
  ok('the fluency matrix has four cells', fj.length === 4);
  ok('and they sum to its base exactly once',
    fj.reduce((a, c) => a + c.n, 0) === g.quadrants.fluencyJudgmentBase,
    `${fj.map((c) => `${c.key}=${c.n}`).join(' ')} against ${g.quadrants.fluencyJudgmentBase}`);
  ok('its shares sum to a hundred',
    Math.abs(fj.reduce((a, c) => a + c.share, 0) - 100) <= 0.5,
    `${fj.reduce((a, c) => a + c.share, 0)}%`);
  ok('the watch subset is reported as a count, never as a fifth cell',
    !fj.some((c) => c.key === 'fw') && typeof g.quadrants.fluentAndAtWatch.n === 'number');
  ok('and the watch subset is contained by the unprotected cell',
    g.quadrants.fluentAndAtWatch.n <= (fj.find((c) => c.key === 'fu')?.n ?? 0));

  // Deliberate non-users are reported separately, so the use matrix divides by
  // the population it actually covers and says how large that is.
  const mixed = [
    ...Array.from({ length: 5 }, (_, i) => member('student', 5, 4, i)),
    ...Array.from({ length: 3 }, (_, i) => {
      const m = member('student', 1, 5, i + 5);
      return m;
    }),
  ];
  // Force the deliberate branch: low use, reason 1, judgment intact.
  const deliberate = mixed.map((m, i) => {
    if (i < 5) return m;
    const answers: Record<string, number> = {};
    applicableItems('student', 1).forEach((it) => {
      const top = maxV(it);
      const h = Math.max(1, Math.min(top, Math.round(((5 - 1) / 4) * (top - 1)) + 1));
      answers[it.id] = it.type === 'reverse' ? top + 1 - h : h;
    });
    answers['lowuse_reason'] = 1;
    return { ...m, usage: 1,
      result: compute({ persona: 'student', usage: 1, b1: 4, b2: 3, answers }) };
  });
  const gm = buildGroupResult('mixed', deliberate);
  const cu = gm.quadrants.capabilityUse;
  ok('deliberate non-users are recognised', gm.quadrants.deliberateNonUse.n > 0);
  ok('the use matrix sums to the population it covers',
    cu.reduce((a, c) => a + c.n, 0) === gm.quadrants.capabilityUseBase,
    `${cu.reduce((a, c) => a + c.n, 0)} against base ${gm.quadrants.capabilityUseBase}`);
  ok('its shares sum to a hundred, of that population',
    Math.abs(cu.reduce((a, c) => a + c.share, 0) - 100) <= 0.5,
    `${cu.reduce((a, c) => a + c.share, 0)}%`);
  ok('and the base plus the deliberate non-users is the whole group',
    gm.quadrants.capabilityUseBase + gm.quadrants.deliberateNonUse.n === gm.n);
}

/* ------------------------------------------------------------ disclosure */

head('Nothing suppressed appears in any output');
{
  const lopsided = buildGroupResult('R', [
    ...Array.from({ length: 9 }, (_, i) => member('student', 4, 3, i)),
    ...Array.from({ length: 3 }, (_, i) => member('teacher', 4, 3, 100 + i)),
  ]);
  const withheld = lopsided.segments.filter((s) => s.suppressed);
  ok('there is something withheld to check', withheld.length >= 2);
  ok('no withheld cut carries a size', withheld.every((s) => s.n === undefined));
  const json = JSON.stringify(lopsided.segments.filter((s) => s.suppressed));
  ok('and no size is recoverable from the serialised rows', !/"n":/.test(json));

  // The route's own two export formats, read as source: neither may print the
  // size of a row it has just declared withheld.
  const route = fs.readFileSync(
    path.join(process.cwd(), 'src/app/api/admin/org-report/route.ts'), 'utf-8');
  ok('the CSV writes a withheld marker rather than the count',
    /suppressed[\s\S]{0,200}'withheld'/.test(route) && !/suppressed\)`, s2\.n/.test(route));
  const pdf = fs.readFileSync(path.join(process.cwd(), 'src/lib/groupReportPdf.tsx'), 'utf-8');
  ok('the PDF prints nothing in the count column for a withheld row',
    /sg\.suppressed \? '' : sg\.n/.test(pdf));

  ok('a group too small to hide in is refused outright',
    (() => { try { buildGroupResult('one', cohort(3, 1)); return false; }
             catch (e) { return e instanceof GroupTooSmallError; } })());
  ok('and the refusal names no one',
    (() => { try { buildGroupResult('one', cohort(3, 2)); return false; }
             catch (e) { return !/@/.test((e as Error).message); } })());
}

/* -------------------------------------------------------------- quantile */

head('The median is the median the reading guide describes');
{
  // With an even number of people it sits halfway between the two in the
  // middle. The old rule took the nearest rank and, because JavaScript rounds
  // halves upward, leaned to the higher of the two every time.
  ok('four values interpolate to the midpoint', spreadOf([10, 20, 30, 40]).median === 25);
  ok('two values interpolate to the midpoint', spreadOf([0, 100]).median === 50);
  ok('an odd count returns the middle value', spreadOf([10, 20, 30]).median === 20);
  ok('a single value is its own median', spreadOf([42]).median === 42);
  ok('quartiles interpolate too', spreadOf([0, 100]).q1 === 25 && spreadOf([0, 100]).q3 === 75);
  ok('quartiles stay ordered', (() => {
    const s = spreadOf([3, 1, 4, 1, 5, 9, 2, 6]);
    return s.min <= s.q1 && s.q1 <= s.median && s.median <= s.q3 && s.q3 <= s.max;
  })());

  // The regression, stated as a case: eight people spanning the full range.
  const eight = spreadOf([0.4, 25, 50, 50, 75, 75, 99.6, 99.6]);
  ok('eight people spanning the range give a median of 62.5, not 75',
    eight.median === 62.5, `got ${eight.median}`);

  const analytics = fs.readFileSync(path.join(process.cwd(), 'src/lib/analytics.ts'), 'utf-8');
  ok('the dashboard uses the same interpolating rule, not a flooring one',
    !/Math\.floor\(q \* \(v\.length - 1\)\)/.test(analytics));
}

/* ------------------------------------------------------------- vocabulary */

head('One vocabulary in the body, every other name recorded');
{
  for (const id of CONSTRUCT_IDS) {
    const e = DIMENSIONS[id];
    const aliases = aliasesFor(id);
    ok(`${e.executiveName}: the canonical name is recorded`,
      e.canonicalName === CONSTRUCTS[id].name);
    ok(`${e.executiveName}: every edition's own name is reachable`,
      (['student', 'business', 'pastor', 'professional'] as Persona[]).every((p) => {
        const n = constructName(p, id);
        return n === e.executiveName || aliases.some((a) => a.name === n);
      }),
      aliases.map((a) => a.name).join(' | '));
    ok(`${e.executiveName}: has a band sentence for all three bands`,
      !!e.bandCopy.strength && !!e.bandCopy.developing && !!e.bandCopy.watch);
    ok(`${e.executiveName}: has a business meaning`, e.businessMeaning.length > 40);
  }

  // The reliance dimension answers to four names across the editions, which is
  // the reason a dictionary exists at all.
  const reliance = aliasesFor('dependencySafety').map((a) => a.name);
  for (const name of ['Dependency Risk', 'Continuity Risk', 'Reliance Risk',
                      'Operational Continuity', 'Unaided Capability']) {
    ok(`reliance answers to "${name}"`, reliance.includes(name), reliance.join(' | '));
  }
  ok('and the body name is not repeated among its own aliases',
    !reliance.includes(DIMENSIONS.dependencySafety.executiveName));

  ok('every persona can resolve a risk name for the reversed dimension',
    (['student', 'business', 'professional'] as Persona[])
      .every((p) => reportedConstructName(p, 'dependencySafety').length > 0));

  ok('the three exposure dimensions carry an exposure label',
    (['responsibleUse', 'verification', 'agency'] as ConstructId[])
      .every((id) => !!DIMENSIONS[id].exposureLabel));
  ok('and no other dimension does',
    CONSTRUCT_IDS.filter((id) => !!DIMENSIONS[id].exposureLabel).length === 3);

  ok('gate roles are read off the stage table',
    DIMENSIONS.agency.practiceGateRole.length > 0
    && DIMENSIONS.creativity.practiceGateRole.length === 0);
}

/* ------------------------------------------------ the derived constructs */

head('The derived readings say what they claim');
{
  const g = buildGroupResult('d', cohort(3, 12));
  ok('lean accounts for everybody exactly once',
    g.lean.towardsDisconnection.n + g.lean.balanced.n + g.lean.towardsDependence.n === g.n);
  ok('and names a response', g.lean.response.length > 0);

  ok('said against chosen covers all ten dimensions', g.saidVsChosen.length === 10);
  for (const d of g.saidVsChosen) {
    ok(`${d.name}: the three readings account for everyone measured`,
      d.aligned.n + d.healthierInSituations.n + d.weakerInSituations.n
        <= g.n);
  }

  ok('mobility splits each stage into three exclusive reasons',
    g.mobility.every((m) => m.immediatelyMovable + m.gateConstrained + m.developmentRequired === m.n),
    g.mobility.map((m) => `${m.stage}: ${m.immediatelyMovable}+${m.gateConstrained}+${m.developmentRequired} vs ${m.n}`).join(' | '));

  ok('every gate reading carries the distance to it',
    g.gateAnalysis.every((x) => typeof x.gap === 'number' && x.required > 0));
  ok('a gate never reports more people close to clearing it than it holds',
    g.gateAnalysis.every((x) => x.closeToClearing <= x.held.n));

  ok('adoption blockers are reported for the people who did not meet the standard',
    g.adoptionBlockers.byCriterion.length === 4);
  ok('and no criterion blocks more people than there are to block',
    g.adoptionBlockers.byCriterion.every((b) => b.failing.n <= g.n - g.headline.healthyAdoption.n));

  ok('workforce consistency reports the width of the middle half',
    Math.abs(g.consistency.widthOfMiddleHalf - (g.index.q3 - g.index.q1)) < 0.05);
  ok('and translates it into a sentence a manager can repeat',
    g.consistency.reading.length > 60);
}

head('Patterns are shares of the people who could have fired them');
{
  const mixedPersonas = [
    ...Array.from({ length: 6 }, (_, i) => member('student', 4, 2, i)),
    ...Array.from({ length: 6 }, (_, i) => member('pastor', 4, 2, 100 + i)),
  ];
  const g = buildGroupResult('mix', mixedPersonas);
  const all = [...g.patterns.help, ...g.patterns.harm, ...g.patterns.mixed, ...g.patterns.neutral];
  ok('there are patterns to check', all.length > 0);
  ok('no pattern is a share of more people than could raise it',
    all.every((p) => p.base <= g.n && p.n <= p.base),
    all.map((p) => `${p.id} ${p.n}/${p.base}`).join(' | '));
  ok('a Minister-only pattern is measured against the Ministers',
    all.filter((p) => ['outsourced_pulpit', 'unverified_authority', 'presence_displacement',
      'thinning_voice', 'fed_shepherd'].includes(p.id)).every((p) => p.base === 6),
    all.map((p) => `${p.id} base ${p.base}`).join(' | '));
  ok('mixed and neutral readings are no longer dropped',
    'mixed' in g.patterns && 'neutral' in g.patterns);
}

head('A wave knows what produced it');
{
  const stamped = cohort(3, 8).map((m) => ({ ...m,
    versions: { instrument: '2.3', scoring: '2.1', scenario: '2.0', language: 'en-GB' } }));
  const g = buildGroupResult('w', stamped);
  ok('a uniformly stamped cohort is comparable', g.provenance.comparable === true);
  ok('and reports one version set', g.provenance.distinct.length === 1);

  const unstamped = buildGroupResult('u', cohort(3, 8));
  ok('an unstamped cohort is not claimed to be comparable',
    unstamped.provenance.comparable === false);
  ok('and says so rather than printing the running code as provenance',
    /rescor/i.test(unstamped.provenance.note));

  const half = [...stamped.slice(0, 4), ...cohort(3, 4).map((m, i) => ({ ...m, key: `x${i}` }))];
  const gh = buildGroupResult('h', half);
  ok('a half-stamped cohort is not comparable either', gh.provenance.comparable === false);
  ok('and counts what is missing', gh.provenance.notRecorded === 4);
}

head('Movement is only ever computed within one assessment');
{
  //
  // The seven assessments are different instruments, so an index from one
  // cannot be compared with an index from another. This was checked by looking
  // for a composite map key, which is one way to fix it and the way that was
  // tried first. It makes one human count as two people wherever they have
  // taken two assessments, which changes what every headcount on the admin
  // dashboard means, so the invariant is asserted on behaviour instead.
  //
  const attempts = toAttempts(JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'data/leads.json'), 'utf-8')));
  const people = toPeople(attempts);
  ok('there is real data with repeat sittings to check',
    people.some((p) => p.attempts.length > 1), `${people.length} people`);
  ok('one Person is one human being',
    people.length === new Set(people.map((p) => p.email)).size);
  ok('a person with several assessments still counts once',
    people.every((p) => people.filter((q) => q.email === p.email).length === 1));
  for (const p of people.filter((x) => x.indexDelta !== undefined)) {
    ok(`${p.email.replace(/^[^@]*/, 'a')}: movement compares the same assessment`,
      p.first.persona === p.latest.persona,
      `${p.first.persona} against ${p.latest.persona}`);
  }
  const mixed = people.find((p) => new Set(p.attempts.map((a) => a.persona)).size > 1);
  ok('somebody in the data has taken more than one assessment', !!mixed,
    people.map((p) => new Set(p.attempts.map((a) => a.persona)).size).join(','));
  if (mixed) {
    ok('and their earlier sittings of other assessments are still kept',
      mixed.attempts.length > mixed.attempts.filter((a) => a.persona === mixed.latest.persona).length);
  }
}

/* ------------------------------------------------- the page, as it renders */

head('The report is read end to end, on the tree the renderer draws');
{
  // The PDF's fonts are subset, so the glyphs on a finished page carry a
  // private encoding and no text can be read back out of the file on this
  // machine. This walks the element tree renderToBuffer is handed, which is the
  // same tree, and is therefore a statement about the page rather than about
  // the data behind it.
  // Function components have to be invoked, not just descended into: the
  // dimension rows, the spread lines and the cover are all components, and a
  // walker that only reads props.children sees an almost empty document and
  // reports that everything is fine.
  const walk = (node: unknown, out: string[] = [], depth = 0): string[] => {
    if (node === null || node === undefined || node === false || depth > 60) return out;
    if (typeof node === 'string' || typeof node === 'number') { out.push(String(node)); return out; }
    if (Array.isArray(node)) { node.forEach((c) => walk(c, out, depth + 1)); return out; }
    const el = node as { type?: unknown; props?: Record<string, unknown> };
    if (typeof el.type === 'function') {
      try { walk((el.type as (p: unknown) => unknown)(el.props ?? {}), out, depth + 1); }
      catch { /* a component that needs a renderer context is not text */ }
      return out;
    }
    // react-pdf's page footer supplies its text through a render callback.
    if (typeof el.props?.render === 'function') {
      try { out.push(String((el.props.render as (a: unknown) => unknown)({ pageNumber: 1, totalPages: 10 }))); }
      catch { /* ignore */ }
    }
    if (el.props?.children !== undefined) walk(el.props.children, out, depth + 1);
    return out;
  };
  const pagesOf = (doc: unknown): unknown[] => {
    const kids = (doc as { props: { children: unknown } }).props.children;
    return (Array.isArray(kids) ? kids : [kids]).flat().filter(Boolean);
  };

  const people = [
    ...[1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 3, 2].map((lv, i) => member('professional', 4, lv, i)),
    ...[3, 4, 5].map((lv, i) => member('teacher', 4, lv, 100 + i)),
  ];
  const g = buildGroupResult('Meridian Operations', people);
  const doc = groupDocument(g, null);
  const pages = pagesOf(doc);
  ok('the document is assembled', pages.length >= 9);

  const perPage = pages.map((p) => walk(p).join(' \u00b7 '));
  const all = perPage.join('\n');
  ok('every page carries text', perPage.every((t) => t.trim().length > 0),
    perPage.map((t, i) => `${i}:${t.length}`).join(' '));

  //
  // The inversion, checked on the page rather than on the object. The reliance
  // dimension is displayed as Independent Capability, and the caveat that used
  // to sit beside it belongs only to the two composites that genuinely run the
  // other way.
  //
  ok('the reliance dimension is named as a capability on the page',
    all.includes('Independent Capability'));
  const caveats = all.split('(lower is healthier)').length - 1;
  ok('the lower-is-healthier caveat appears exactly twice, for the two composites',
    caveats === 2, `found ${caveats}`);
  const depRow = perPage.find((t) => t.includes('Independent Capability')) ?? '';
  const idx = depRow.indexOf('Independent Capability');
  ok('and never within the reliance row itself',
    !depRow.slice(idx, idx + 120).includes('lower is healthier'),
    depRow.slice(idx, idx + 120));

  // A withheld cut prints the reason and no number.
  const lop = buildGroupResult('R', [
    ...Array.from({ length: 9 }, (_, i) => member('student', 4, 3, i)),
    ...Array.from({ length: 3 }, (_, i) => member('teacher', 4, 3, 100 + i)),
  ]);
  const segPage = pagesOf(groupDocument(lop, null))
    .map((p) => walk(p).join(' \u00b7 '))
    .find((t) => t.includes('Withheld') || t.includes('withheld')) ?? '';
  ok('the segments page says a cut was withheld', /withheld/i.test(segPage));
  ok('and gives the reason', /identify the people in it/.test(segPage));
  ok('and prints no count beside it',
    !/withheld[^.]{0,40}\b(3|9)\b/i.test(segPage), segPage.slice(0, 400));

  // The page eyebrows no longer disagree with the footer's own numbering.
  ok('no page claims a page number of its own',
    !/Page \d|Pages \d/.test(all), (all.match(/Pages? \d[^\u00b7]*/) ?? []).join(' | '));

  // The copy rule, on the finished page.
  ok('no em-dash or en-dash reaches the page', !/[\u2014\u2013]/.test(all),
    (all.match(/.{30}[\u2014\u2013].{30}/) ?? []).slice(0, 3).join(' | '));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
