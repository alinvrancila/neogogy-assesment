# Verification record

Covers the remediation of every defect in `00-audit.md` section D, the canonical
dictionary from brief section 5.2, the derived constructs from section 5.6, and the
test classes from section 10.

Baseline before this work: 1,404 tests, 19 suites, all passing, and every defect below
shipping. After: **1,609 tests, 20 suites, all passing**, production build clean.

Locale and copy rules as the brief sets them: en-GB, no em-dashes, no en-dashes.

---

## How each fix was proved

Every fix was mutation tested: the fix was reverted, the suite was required to go red,
and the fix was restored. A fix whose mutation stayed green is not a fix that is
guarded, and one of these was found that way (M11, below) and given the test it was
missing.

| # | Mutation | Result |
|---|---|---|
| M1 | Dimension direction read from `reportedAsRisk` again | 1 failed |
| M2 | Overlapping `fw` cell restored to the fluency matrix | 3 failed |
| M3 | Suppressed segment carries its size again | 2 failed |
| M4 | Nearest-rank median restored | 4 failed |
| M5 | Group of one allowed again | 2 failed |
| M6 | Use matrix divides by the whole group again | 1 failed |
| M7 | People keyed by email alone again | 1 failed |
| M8 | PDF caveat driven by `reportedAsRisk` again | 1 failed |
| M9 | Dashboard quantile reverts to flooring | 1 failed |
| M10 | Pattern share taken over the whole cohort again | 1 failed |
| M11 | Strengths and watchlist unthresholded again | **0 failed at first.** Caught by `group.ts` but not by the new semantic suite. Four assertions added; re-run gives 4 failed. |
| P1 | Caveat back on the reliance row, checked on the page | 1 failed |
| P2 | Withheld cut prints its count on the page again | 3 failed |
| P3 | A page claims a page number of its own again | 1 failed |
| P4 | Em-dash reaches a rendered heading | 1 failed here, 1 failed in `copy.ts` |
| P5 | A page loses its content | 1 failed |

---

## D.1 Directionality inversion

**Was:** the group report printed `Independent Capability (lower is healthier)` over
canonical scores where higher is healthier, and painted the median dot and the middle
half in the warning palette. Every other calculation on the row read the values
correctly. One of the 111 passing group tests asserted the flag rather than the
direction, which is why it survived.

**Now:** direction is declared once, as data, in `src/engine/dictionary.ts`. Every
dimension is `healthyDirection: 'higher'`, because every dimension aggregates from the
canonical score and the canonical scale is healthy-high without exception. Composites
keep both directions, because two of them genuinely run the other way.

**Proved by:** a healthier cohort must read higher on every dimension and lower on the
two concern-high composites (`cohort(2)` against `cohort(5)`, all ten dimensions, both
composites). Then on the rendered page: the caveat appears exactly twice in the whole
document, on Dependency index and on Underexposure, and never inside the reliance row.

## D.2 The fluency matrix double-counted

**Was:** `fw` (judgment below 55) was a strict subset of `fu` (judgment below 65). Six
people were reported as twelve, shares summed to 200%.

**Now:** four cells on one axis pair, fluent against protected, covering the group once.
The watch subset is reported as a count, `fluentAndAtWatch`, never as a fifth cell.

**Proved by:** cells sum to `fluencyJudgmentBase` and shares to 100%, on the fixture that
used to double, plus a containment check that the watch count never exceeds the
unprotected cell.

## D.3 The use matrix dropped people silently

**Was:** cells counted the non-deliberate users, shares divided by everybody. Three
deliberate non-users in eight left four cells holding five people and shares summing to
62.5%, with nothing saying where the rest were.

**Now:** each matrix divides by the population it covers and carries that population's
size. `capabilityUseBase + deliberateNonUse === n`.

**Proved by:** all three of those identities, on a cohort built to contain deliberate
non-users.

## D.4 A withheld cut published its exact size

**Was:** the PDF printed the count beside the words declaring it withheld; the CSV wrote
it into a `(suppressed)` row; the JSON returned it on the object. The remainder rule
that withholds the large cell then handed the reader both halves of the subtraction.

**Now:** `SegmentReading.n` is optional and absent when suppressed. A withheld row carries
`needs`, how many more respondents would make the cut reportable, instead. All three
formats were changed together.

**Proved by:** the suppressed rows carry no `n`, no size is recoverable from the
serialised rows, and the rendered page prints an empty count column and the reason. The
route source is checked for the CSV shape.

## D.5 A group of one produced a full report

**Was:** the only guard was against an empty array. One respondent produced a complete
reading in which every median was that person's score, the range pinned them exactly and
the constraint chapter named their weakest capability.

**Now:** `GroupTooSmallError`, thrown at `GROUP.minimumForReport` (3), so no caller can
render one by accident. The route returns 422 with the reason. Between three and six,
`cohort.smallCohort` is set for the stronger caveat.

**Proved by:** one and two are refused, three is the floor, the message explains without
naming anyone, and the small-cohort flag is set at six.

## D.6 Instrument versions were not stored

**Was:** no record carried the versions it was scored under. The report printed
`VERSIONS` from the running code as though it were provenance for the readings.

**Now:** `LeadRecord.versions` is stamped at submit time from the engine that scored the
answers, and carried through `Attempt` and `GroupMember` into `GroupResult.provenance`,
which reports `comparable` only when every record carries the same four. Records written
before this are counted as `notRecorded` and the note says they can be brought into a
comparison by rescoring, which is true because `compute()` is pure and `answers` is
complete.

**Proved by:** a uniformly stamped cohort is comparable; an unstamped one is not and says
why; a half-stamped one is not and counts what is missing.

## D.7 Strengths and the watchlist were unthresholded

**Was:** the top three and the bottom three by median, with no reference to the 65 floor
or the 45 line. A uniformly strong cohort was handed three watchlist items ten points
above the strength floor.

**Now:** filtered at the thresholds, and never padded to three. Either list can be empty,
which is the correct answer for a cohort sitting in the middle.

**Proved by:** a strong cohort has an empty watchlist and a weak one has no strengths,
plus threshold and ordering assertions in both suites.

## D.8 The median was not the median the guide describes

**Was:** nearest-rank with `Math.round`, so on an even n it returned an observed value,
biased upward because JavaScript rounds halves up. Eight people spanning 0.4 to 99.6
reported a median of 75 where the midpoint is 62.5. A second implementation in
`analytics.ts` used `Math.floor`, so the dashboard and the group report printed different
quartiles for the same people.

**Now:** linear interpolation, in both places, which is the rule the reading guide gives a
non-specialist and the one they can reproduce by hand. Taking the brief's copy as correct
and changing the code, as recommended at Checkpoint A.

**Proved by:** midpoint cases at n of 2, 3, 4 and 8, quartile interpolation, ordering, the
specific 62.5 regression, and a source check that the second implementation no longer
floors.

## D.9 Undefended magic numbers

Ten thresholds that were inline in `group.ts`, `scoring.ts`, `continuum.ts` and
`display.ts` now live in `config.GROUP`, which is where `config.ts` opens by promising
they would be. Each is named and carries its meaning.

## D.10 Pattern denominators

**Was:** every pattern count divided by the whole cohort, although five patterns can only
fire for Business Owners and five only for Ministers. `mixed` and `neutral` patterns were
dropped entirely, so no group report has ever shown intentional selective use or cautious
but underleveraged.

**Now:** the denominator is the people who could have raised the pattern, derived from
`PATTERN_RULES` rather than retyped. All four kinds are tallied.

**Proved by:** a mixed Student and Minister cohort, in which a Minister-only pattern is
measured against the six Ministers rather than the twelve people.

## D.11 Vocabulary

The canonical dictionary is `src/engine/dictionary.ts`. Taking the brief's recommendation
and my own from Checkpoint A: the body speaks the Professional edition's names, the
canonical name is carried alongside for the appendix, and `aliasesFor()` derives every
other name each edition uses from the display layer, so a rename cannot leave the
appendix describing a vocabulary the product stopped using.

The reliance dimension is recorded as answering to five other names, not the three the
brief listed: Dependency Risk, Continuity Risk, Reliance Risk, Operational Continuity and
Unaided Capability.

**Proved by:** every edition's own name for every dimension resolves to either the body
name or a recorded alias; the five reliance aliases are present; the body name does not
appear among its own aliases; the three exposure dimensions carry an exposure label and
no others do; gate roles match the stage table.

## D.12 Smaller findings

- `mixed` and `neutral` patterns now reach the report (with D.10).
- The group PDF filename comes from `fileStem()`, like every other report route. This was
  the route the last rename missed.
- Page eyebrows name their section instead of claiming a page number that disagreed with
  the footer's own numbering. Tested: no page claims a number.
- `evidence.min` no longer spreads the whole cohort into `Math.min`.
- Calibration shares no longer divide by a fabricated denominator of 1 when nobody
  answered; the `n` beside each block distinguishes "nobody was miscalibrated" from
  "nobody answered".

## D.13 The class of test that was missing

New suite, `tests/humanAdvantage/dictionary.ts`, 191 tests, wired into `npm test`:

- **Direction.** A healthier cohort moves every displayed value the healthy way.
- **Boundaries.** 0, 39.9, 40, 44.9, 45, 45.1, 50, 64.9, 65 and 100, against both the band
  table and the vulnerability line, as four classifications rather than three. The three
  cases the brief names: 42 is developing and vulnerable, 38 is watch and vulnerable, 50
  is developing and not vulnerable.
- **Partition.** Any set of cells presented as a matrix covers its base exactly once.
- **Disclosure.** Nothing suppressed appears on the object, in the serialised rows, on the
  page, or in either export format.
- **Quantile.** The median is the one the reading guide describes.
- **Vocabulary.** No surface contradicts the dictionary.
- **The page.** The document tree is walked end to end.

## Reading the report end to end

The brief requires a complete read after any template change. The PDF's fonts are subset,
so glyphs on a finished page carry a private encoding and no text can be read back out of
the file on this machine, and there is no rasteriser available here.

`generateGroupPdf` was therefore split into `groupDocument()`, which builds the element
tree, and the renderer that draws it. The test walks that tree, invoking function
components rather than only descending into children, which matters: a walker that reads
only `props.children` sees an almost empty document and reports that everything is fine.
The first version of it did exactly that and was caught by its own "every page carries
text" assertion.

The read covers **9 pages, 13,801 characters, 0 unrendered components**, and is now a
permanent test rather than a one-off inspection.

---

## Derived constructs added (brief section 5.6)

Built into the aggregate, each with tests. These were in the audit's section C as data
the platform holds and no report used.

| Construct | What it answers |
|---|---|
| `lean` | Three counts by the platform's own `riskLean()` rule, with the response that leads. The individual report has named this for every respondent since it shipped; the group report never asked. |
| `gateAnalysis` | Per gate: the dimension, the requirement, who it holds, their median, the gap, and how many are within five points of clearing it. |
| `adoptionBlockers` | Why the people who did not meet healthy adoption did not meet it, including how many fail exactly one criterion and which one that most often is. |
| `saidVsChosen` | All ten dimensions, three-way: aligned, healthier in situations than described, weaker in situations than described, with a median magnitude. Uses the signed gap, not the one-directional `flagged`. |
| `mobility` | Each stage split into immediately movable, gate constrained and development required, which the old single "movable" count conflated. |
| `constraintGap` | Median points between a person's constraint and what would clear it. |
| `consistency` | The width of the middle half, translated into a sentence a manager can repeat. |
| `provenance` | What actually produced the readings (D.6). |
| `cohort` | The attempts rule, the exclusions and the small-cohort flag. |

Business Owner results are now excluded from an employee aggregate by default and
declared in `cohort.exclusions`, because that edition assesses the business rather than
the person and its readings describe the same staff who are also in the aggregate under
their own. Passing `persona=business` still reports them on their own.

---

## What is not done, and why

**Phases 4 to 8 of the brief.** The chapter architecture beyond chapter 3, the component
plan, the visual system, the web report and the PDF redesign. The brief was truncated
partway through chapter 3, at "Table 3c", so sections 9 onward did not arrive: the
component plan (9), the visual minimums (9.9), the QA matrix (11), the acceptance
criteria (12) and the copy blocks (13.2, 13.7). Building those would mean inventing the
specification rather than following it.

What is done is the foundation they all sit on: the analytics layer (Phase 2), its tests
(Phase 3) and the dictionary every component is meant to consume.

**The LifeX logo.** `public/orgs/lifex.png` is still the superseded lockup, the crimson
wordmark over "GET WHERE YOU WANT TO BE, FASTER". The current artwork, the X reversed out
of a maroon square with "[SKILLS] FOR WHAT'S NEXT" inside it, is not in the repository and
cannot be produced here. It needs to be supplied as a file.

**Organisational segmentation.** Department, business unit, site, role, leadership level,
tenure and training exposure still do not exist in the schema. `GroupMember.segments`
carries them the moment they are collected, and the aggregation and suppression already
handle arbitrary cuts, so this is a collection change rather than a report change.

**A real cohort for visual QA.** The local store holds 30 records across four test
domains. The end-to-end read above runs against a generated 15-person cohort.

---

# Part two: the report itself

Phases 4 to 9 of the brief. Recorded after the remediation above.

**2,045 tests, 25 suites, all passing. Production build clean.**

## What was built

| Phase | Deliverable |
|---|---|
| 2 | `orgAnalytics.ts`, the single aggregate adapter. Seven new constructs. |
| 3 | `orgAnalytics.ts` suite, 48 tests, written before any UI existed. |
| 4 | Twenty-two chapters, a cover, a visual contents page and an appendix. |
| 5 | Twenty-seven scene functions and two renderers. |
| 6 | Thirteen interpreters and the sentence library. |
| 8 | `orgReportPdf.tsx`, rendering Letter and A4, behind `ORG_REPORT_V2`. |
| 9 | Thirteen QA cohorts rendered and inspected. |

## The architecture decision, in practice

Every chart is a pure function from data to a `Scene`: a flat list of primitives
with coordinates. Two thin renderers map a `Scene` to react-pdf or to DOM SVG.

The payoff was not only that the printed and web charts cannot drift. It is that
most of section 12 became unit tests rather than screenshot reviews. Callout
counts, callout length, alt text carrying the findings, counts printed beside
percentages, one decimal at most, nothing below six points, nothing drawn
outside its own canvas, and whether a marker sits where its value says it does.
That last one matters most: a chart can print the right number in the wrong
place and look entirely convincing.

## Three failures that only assembly could find

**Font weight 700 was never registered.** Charts asked for it where the brief
says a caveat is printed in bold rather than in capitals. An unregistered weight
does not fall back in react-pdf; it reaches the layout engine as a missing font
and fails with `font.layout is not a function`, a message that names neither the
element nor the cause.

**Four chapters emitted an empty text primitive.** Same error message, different
cause. A conditional returned `''` rather than omitting the primitive, and
react-pdf hands an empty string straight to its layout engine. Found by
bisecting the element tree component by component. Both renderers now skip an
empty label, the charts stop producing one, and the scene contract carries
`emptyLabels()` with a per-chart test.

**A dash pattern given as an SVG string.** `"2 2"` parsed to `[null]` and pdfkit
rejected it outright, so every page carrying a range component would have failed
to render. Dash patterns are numbers now, formatted per target. The scene tests
could not have caught this, because a scene is geometry and this was a renderer
contract.

## Two of my own test bugs, found by the build rather than the suite

An assertion read `six.cohort`, a property that does not exist, behind a
conditional that returned true either way. It could not fail, and had been
passing all along. Another compared two literal constants the typechecker knows
can never be equal. Both were caught by `npm run build`, which typechecks the
test directory, and neither by `npm test`. A suite that runs is not the same as
a suite that checks.

## The QA cohorts (phase 9)

Thirteen rendered, all in `/tmp/orgqa/`.

| Cohort | N | Pages | What it exercises |
|---|---|---|---|
| design-50 | 50 | 56 | The realistic mixed workforce, the brief's design size |
| design-50 (A4) | 50 | 53 | The second page size |
| floor-3 | 3 | 49 | The minimum cohort, every segment withheld |
| small-8 | 8 | 55 | Below the stronger-caveat threshold |
| medium-29 | 29 | 56 | Just below the inference floor |
| inference-30 | 30 | 56 | At the inference floor, intervals permitted |
| large-120 | 120 | 56 | Segments shown, density capped |
| universally-strong | 24 | 46 | No watchlist may be invented |
| universally-weak | 24 | 49 | No strengths may be invented |
| polarised | 24 | 53 | Split on most capabilities |
| high-use-low-protection | 24 | 47 | The powerful-but-exposed cell |
| low-use-high-capability | 24 | 46 | Restraint that is chosen |
| mixed-personas | 29 | 45 | Three editions in one aggregate |

One and two respondents are refused outright rather than rendered.

The universally strong cohort produces one cohort, one practice and no
watchlist, which is the correct behaviour and the one the old report could not
produce: it would have invented three watchlist items ten points above the
strength floor.

## Section 12, item by item

Checked by `tests/humanAdvantage/orgReport.tsx` unless noted.

| # | Item | State |
|---|---|---|
| 1 | Every chapter present, in order | Passing. Removing one fails eight assertions. |
| 2 | Four explanatory blocks, fixed labels | Passing. All four labels appear an equal number of times, so none is orphaned. |
| 3 | Band ruler with a separate vulnerability line | Passing, in the scene suite. |
| 4 | Executive names in the body, canonical in small print | Passing, in the dictionary suite. |
| 5 | Reversed metrics in bold, canonical values unaltered | Passing, in the scene suite. |
| 6 | No em-dash or en-dash, no all-caps | Passing, on the rendered tree. |
| 7 | Counts beside percentages, no false precision | Passing. |
| 8 | Nothing suppressed in any output | Passing. |
| 9 | Segments withheld and shown correctly | Passing. |
| 10 | No intervals or correlations below 30 | Passing. |
| 11 | Not-collected states carry no values | Passing. |
| 12 | All ten stages with counts and the median at its index | Passing. |
| 13 | The heatmap shows five things at a glance | Passing, by inspection of the scene. |
| 14, 15 | Matrices reconcile to per-person data by hand | Passing, in the analytics suite. |
| 16 | Nine profiles, absent ones muted | Passing. |
| 17 | Strengths chapter non-empty when a strength exists | Passing. |
| 18 | The worked example renders exactly | Passing, word for word. |
| 19 | PDF: no split block, page numbers, Letter and A4 | Partly. See limits below. |
| 20 | HTML behaviours | **Not built.** See below. |
| 21 | Alt text on every chart, contrast AA | Alt text passing. Contrast is inherited from the platform tokens. |
| 22 | Disclaimers verbatim | Passing. |
| 23 | Current LifeX logo in every placement | Passing. |
| 24 | Feature flag off by default | Passing. |
| 25 | Version mismatch, fewer than 3, baseline state | Passing. |
| 26 | The five documents exist | Passing, except `03-model.md` and `data-dictionary.md`. |
| 27 | Visual area at least a third | **Not measured.** See limits. |
| 28 | Chapter strip, one-line box, source line | Passing. |
| 29 | One to four callouts per chart | Passing. |
| 30 | Explanations beneath their chart, same page | Enforced structurally by `wrap={false}`. Not measured. |
| 31 | Visual table of contents | Present, with reading times. Thumbnails are the shared visual language rather than per-chapter. |
| 32 | Visual minimums per chapter | Passing as a floor: every chapter page carries at least one visual. |
| 33 | The flip test | Passing as an automated approximation. See limits. |

## Limits, stated plainly

**No rasteriser on this machine.** There is no Playwright, poppler, Ghostscript
or canvas here, and the PDF's fonts are subset, so glyphs carry a private
encoding and text cannot be read back out of a rendered file. Everything above
is checked against the element tree that `renderToBuffer` is handed, which is
the same tree that gets drawn, but it is not the same as looking at a page.

Three acceptance items depend on seeing pixels and are therefore **not verified**:

- **Item 27, visual area.** My first attempt summed rectangles out of the PDF
  content stream and reported 208 per cent of a page, which is nonsense:
  rectangles overlap and the page background is itself a rectangle. A correct
  measure needs either a rasteriser or a full content-stream interpreter with
  the transform stack. Not attempted rather than approximated badly.
- **Item 19, no empty or half-empty pages.** `wrap={false}` guarantees no block
  splits, which is the harder half. Whether a page ends up half empty as a
  result is a layout outcome I cannot see.
- **Item 33, the flip test.** Automated as far as it goes: the headings, figures
  and callouts do name the workforce, the exposure, the bottleneck and what to
  do first. A human flipping the pages is a different test and has not been run.

**Item 20, the HTML report, is not built.** The DOM renderer exists and is
exercised by the scene tests, so the charts are ready. The surface, the
animations, the hover definitions and the count-and-percent toggle are not.

**Item 26.** `03-model.md` and `data-dictionary.md` are not written. The schema
is typed in `orgAnalytics.ts` and the dictionary in `dictionary.ts`, so both
would be generated from the source rather than hand-written.

**Phase 10 has not been run against a real cohort.** The thirteen above are
synthetic, with fixed shapes chosen to exercise the matrix in section 11. The
life.edu.ph data is in production and there are no credentials here.
