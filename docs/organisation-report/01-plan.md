# Organisation report: the plan

Checkpoint B deliverable, against `BRIEF.md` section 3.2. Sections E to I as specified.

Written after `00-audit.md` (Checkpoint A) and after the remediation recorded in
`02-verification.md`, which fixed the four live defects the audit found and built the
foundation the chapters sit on. Current state: 1,609 tests, 20 suites, all passing,
production build clean.

Copy rules observed here as in the product: en-GB, no em-dashes, no en-dashes.

---

## What is already done, and what this plan covers

The brief's phases 2 and 3 were largely completed during the remediation, because the
defects and the foundation were the same code. This plan covers what remains.

| Phase | State |
|---|---|
| 1. Audit | Done. `00-audit.md`. |
| 2. Report data model | **Partly done.** The aggregate carries lean, gate distances, adoption blockers, said-against-chosen, mobility split three ways, constraint gaps, workforce consistency, provenance and a cohort summary. Six constructs remain: the readiness matrix, cohorts, the priority score, the practice portfolio, the roadmap and `privacyState`. |
| 3. Statistical and privacy tests | **Partly done.** Direction, boundaries, partition, disclosure, quantile and vocabulary are covered by `tests/humanAdvantage/dictionary.ts`. The section 10 list adds roughly 15 more groups. |
| 4 to 10 | Not started. This plan. |

Two findings from the remediation change the plan's assumptions and are worth stating
before section E.

**The brief's worked example only renders under the corrected median.** Section 6.4 gives
median 58.9 from eight people. Eight values consistent with the whole example are
`[50.1, 56.0, 56.0, 58.0, 59.8, 63.5, 63.5, 73.0]`, which interpolate to Q1 56.0, median
58.9, Q3 63.5, width 7.5. Under the nearest-rank rule the report shipped with, the same
eight people would have rendered 59.8. The acceptance item that the worked example
"renders exactly" was unreachable before D.8 was fixed.

**The vocabulary the brief specifies is the Professional edition's.** Recorded in
`00-audit.md` D.11 and settled in `src/engine/dictionary.ts`: the body speaks the
executive names, every edition's own name is derived from the display layer as an alias,
and the reliance dimension answers to five aliases rather than the three the brief lists
(Dependency Risk, Continuity Risk, Reliance Risk, Operational Continuity, Unaided
Capability).

---

## E. Proposed report

All 22 chapters, the cover, the visual contents and the appendix, in the brief's order.
Every deviation is listed below with its reason; there are seven, and five of them are
forced by data the platform does not hold.

### E.1 Deviations, each with its reason

**1. Chapter 12d (segments) will mostly render withheld notices, and the chapter says so
in its opening line rather than only in each notice.**
The schema holds no department, business unit, site, role, leadership level, tenure or
training field (`00-audit.md` C.1). The only cuts that exist are persona and reported use,
and in a cohort of the design size both are frequently withheld by the remainder rule. A
chapter whose visible content is four withheld notices reads as a fault in the report
rather than a fact about the data, so it opens with one sentence naming which cuts the
platform can currently make and what would have to be collected to make more. The
mini-dashboard component is built and exercised against a synthetic cohort with organisation
fields, so it works the day the fields exist.

**2. Chapter 22 will render the baseline state, not a trend, for every organisation
today.**
No record written before this month carries the versions that scored it (`00-audit.md`
D.6), and section 5.8 forbids comparing across unmatched versions. Records now carry
`versions`, so the trend chapter becomes reachable one wave from now. The comparison
components are built and tested against synthetic prior waves (matching versions,
mismatched versions, improvement, decline) so the chapter is complete rather than
deferred, and the baseline panel is the honest state until a second wave exists.

**3. Chapter 3's density marks are positioned by stage, never by index.**
The brief allows "one anonymous dot per person stacked at the camp". A dot placed at its
exact index position is a readable individual score, which section 4 forbids below 10
respondents and which the platform's privacy code has no provision for at any N. Dots are
therefore stacked within the stage band and carry exactly the information the printed
stage count already carries. No dot is ever placed on the index axis, at any N. This is
stricter than the brief and section 4 says to apply whichever is stricter.

**4. No jittered density behind the matrices in chapter 5, at any N.**
Same reason. The brief permits it "only if the platform's privacy code permits plotting
individual points at all", and it does not. The cells carry counts, percentages and
callouts instead. Revisit if a points policy is added.

**5. Chapter 21's module list is rendered from a declared extension-point registry, not
from prose.**
The brief wants no placeholder values and architected extension points. A registry of six
modules, each with an id, a name, what it would add and an explicit `collected: false`,
gives the chapter its cards and gives the codebase the extension points in the same
object. Nothing renders a number.

**6. Chapter 19's tier ladder maps cohorts to tiers by a declared table, and a tier with
no cohort is shown empty rather than hidden.**
Hiding empty tiers would let a reader think the ladder has fewer rungs than it does, and
the six tiers are a fixed vocabulary the organisation is meant to learn once.

**7. The HTML report is a new admin-only surface, not a public one.**
There is no organisation-facing web route today; the report is generated by
`/api/admin/org-report`. Phase 7 adds `/admin/org-report` behind the feature flag, served
to an authenticated admin. Giving organisations their own authenticated web view is a
larger access-control question than this brief covers, and the PDF remains the artefact
that is sent.

### E.2 Chapter to data map

Every chapter names the aggregate fields it consumes and the individual-report section it
aggregates (the "where this comes from" line the brief requires). Chapters marked **new
data** need a construct built in phase 2.

| Ch | Level | Consumes | Where this comes from | State |
|---|---|---|---|---|
| Cover | | `cohort`, `personas`, `window`, `provenance` | Cover | ready |
| Contents | | chapter registry | | new component |
| 1 Executive answer | 6 | `centre`, `index`, `headline`, `composites`, `lean`, `mobility`, `constraints`, `strengths`, `consistency`, `calibration`, `governance`, `priorities` | Whole report | needs `priorities` |
| 2 How to read | | `bands`, `BANDS`, dictionary | Reading guide | new copy |
| 3 Journey | 1 | `distribution`, `centre`, `index`, `mobility`, `gateAnalysis` | "Where you are on the route" | ready |
| 4 Lean | 1, 4 | `lean`, `composites.underexposure`, `composites.dependencyIndex` | "Which way you are of the path" | ready |
| 5 Readiness against protection | 2, 3 | **new**: `readinessProtection` | Not in the individual report | **new data** |
| 6 Ten dimensions | 2, 3 | `dimensions` (median, bands, vulnerable, nearThreshold, preliminary, polarised, spread), dictionary clusters | "Your ten dimensions" | ready |
| 7 Six questions | 2, 3 | `composites`, composite dictionary | "Six bigger questions" | ready |
| 8 Use against capability | 4 | `quadrants.capabilityUse`, `capabilityUseBase`, `deliberateNonUse`, usage distribution | Group report page 3 | needs usage distribution |
| 9 Fluency against protection | 3 | `quadrants.fluencyJudgment`, `fluentAndAtWatch` | Group report page 3 | ready |
| 10 Strengths | 2 | `dimensions` strong shares, `patterns.help`, `headline.healthyAdoption`, `quadrants` | "Where AI seems to be helping" | ready |
| 11 Risks | 3 | `governance`, `dimensions.vulnerable`, `patterns.harm`, `flags`, `gateAnalysis` | "What to watch" | ready |
| 12 Not one group | 4 | `archetypes`, polarised dimensions, **new**: `developmentCohorts`, `segments`, **new**: `privacyState` | "What your answers say about you" | **new data** |
| 13 Say against do | 3 | `saidVsChosen` | "Said against chosen" | ready |
| 14 Calibration | 3 | `calibration` | "Feel against measure" | ready |
| 15 Bottlenecks | 5 | `constraints`, `constraintGap`, `gateAnalysis` | "The constraint" | ready |
| 16 Mobility | 5, 6 | `mobility`, `stagePlan` | "Moving people up" | ready |
| 17 Priorities | 6 | **new**: `priorities` | "Your practices, in detail" | **new data** |
| 18 Portfolio | 6 | **new**: `practicePortfolio` (uncapped) | "Your practices, in detail" | **new data** |
| 19 Training architecture | 6 | `developmentCohorts` + tier table | Derived | **new data** |
| 20 90-day plan | 6 | **new**: `roadmap` | "Your plan" | **new data** |
| 21 What to measure next | | module registry | Appendix | new registry |
| 22 Retake or baseline | 6 | `movement`, `provenance`, **new**: `trendAnalysis` | Not in the individual report | **new data** |
| Appendix | | dictionary, `bands`, `versions`, `provenance`, `cohort`, disclaimers | Appendix | ready |

---

## F. Component plan

### F.1 The central decision: one chart definition, two renderers

A chart must appear in the PDF (react-pdf primitives) and in HTML (DOM SVG). These have
incompatible element models, so writing each chart twice would guarantee they drift, and
the brief requires that the printed page and the web page show the same thing.

**Every chart is a pure function `(data, layout) => Scene`,** where a `Scene` is a flat,
ordered list of primitives:

```ts
type Prim =
  | { k: 'rect'; x, y, w, h, r?, fill?, stroke?, strokeWidth?, opacity? }
  | { k: 'line'; x1, y1, x2, y2, stroke, strokeWidth, dash? }
  | { k: 'circle'; cx, cy, r, fill?, stroke? }
  | { k: 'path'; d: string; fill?, stroke?, strokeWidth? }
  | { k: 'text'; x, y, text, size, weight?, fill?, anchor?, font? }
  | { k: 'callout'; x, y, toX, toY, text }        // leader line plus label
  | { k: 'group'; children: Prim[]; tx?, ty? };

type Scene = { w: number; h: number; prims: Prim[]; alt: string; callouts: number };
```

Two thin renderers map `Scene` to react-pdf `Svg` children and to DOM `<svg>` children.
Neither renderer contains chart logic.

Why this and not the alternatives:

- **Rejected: a charting library (recharts, visx, Chart.js).** All of them render to the
  DOM or a canvas. The print pipeline must not need a browser, and react-pdf cannot mount
  DOM SVG. Using one would mean a second, hand-written implementation for print, which is
  the drift this decision exists to prevent.
- **Rejected: rendering charts to raster images and embedding them.** Loses vector output
  (acceptance item 19), loses the PDF text layer (which the dash grep in item 6 depends
  on), and needs a headless browser this machine does not have.
- **Rejected: react-pdf primitives everywhere, with a DOM shim.** Inverts the dependency,
  making the web report a hostage to the print library's SVG subset.

The `Scene` approach also makes the acceptance checklist testable without rendering
anything. Item 29 ("at least one callout, no more than four") is `scene.callouts`. Item 21
("alt text stating the finding") is `scene.alt`. Item 5 (reversed metrics drawn reversed)
is an assertion about marker coordinates. These become unit tests, not screenshot reviews.

### F.2 Component inventory

**Primitives and layout** (`src/report/org/kit/`)

| Component | Purpose |
|---|---|
| `Block` | A chart plus its four explanatory blocks as one unit. `wrap={false}` in print. Carries an estimated height for the packer. |
| `ChapterStrip` | Question, one-line answer, key figure, mini visual (2.5 item 8). |
| `ChapterClose` | The "In one line:" box, and the "where this comes from" line. |
| `Explain` | The four fixed-label blocks (6.2), two columns under a wide chart. |
| `Callout` | Short label with a leader line. Under twelve words, enforced by a test. |
| `BandPill`, `PriorityPill`, `StageBadge` | The one visual language of 2.5 item 7. |
| `DimensionIcon` | One icon per dimension, learned in chapter 2. |
| `ScoreCard` | Big figure, label, one sentence, band pill, icon. |
| `Page`, `Footer` | Running footer, page x of y, Letter and A4. |

**Charts** (`src/report/org/charts/`), each a `Scene` function

`rangeComponent` (9.3, used by chapters 3, 4, 6, 7, 22), `bandRuler`, `medianIllustration`,
`journeyContinuum`, `stageTable`, `divergingBar`, `quadrant` (chapters 5, 8, 9),
`heatmap`, `stackedBandBar`, `useBar`, `strengthCard`, `exposureMeter`, `registerTable`,
`profileGrid`, `polarisationBar`, `cohortCard`, `segmentDashboard`, `mirroredBar`,
`bottleneckBar`, `gateFunnel`, `mobilityTable`, `bubbleMatrix`, `practiceCard`,
`tierLadder`, `timeline`, `moduleCard`, `waveComparison`.

Twenty-seven scene functions. `rangeComponent` and `quadrant` carry six chapters between
them, so the real count of distinct visual ideas is closer to twenty.

### F.3 Pagination and the visual-area requirement

`wrap={false}` on `Block` satisfies "no block split" directly. "No empty or half-empty
pages" needs measurement, which react-pdf does not offer before render. Approach: each
`Block` declares an estimated height from its `Scene.h` plus a measured line-count
estimate for its prose, and a packer assigns blocks to pages greedily with a
look-ahead that pairs a short trailing block with the next chapter opener rather than
leaving it alone.

For acceptance item 27 (visual area at least a third, about half on average) I will
**measure the rendered PDF rather than assert the intent**. A PDF content stream is a
sequence of drawing operators with coordinates; inflating the streams and summing the
bounding boxes of fill and stroke operations, against the text-showing operations, gives a
real per-page visual-area ratio. This was proved viable during the remediation: the
content streams inflate and parse. It becomes a test, not a judgement.

---

## G. Implementation plan

### G.1 File layout

```
src/engine/
  dictionary.ts             built.  dimensions, composites, aliases, bands
  orgAnalytics.ts           new.    the OrganisationReportAnalytics adapter (5.3)
  orgInterpret.ts           new.    the 13 interpret* functions (6.1)
  orgCopy.ts                new.    the string table, keyed (10, 13)
  group.ts                  built.  stays; feeds orgAnalytics and the v1 report
src/report/org/
  kit/                      new.    layout and primitives (F.2)
  charts/                   new.    27 Scene functions
  render/pdf.tsx            new.    Scene -> react-pdf
  render/dom.tsx            new.    Scene -> DOM SVG
  chapters/01..22.tsx       new.    one module per chapter, data in, Blocks out
  document.tsx              new.    chapter registry, cover, contents, appendix
src/app/admin/org-report/   new.    the HTML surface (deviation 7)
src/lib/orgReportPdf.tsx    new.    v2 print entry, replaces nothing until the flag flips
src/lib/groupReportPdf.tsx  kept.   v1, behind the flag
docs/organisation-report/
  03-model.md               new.    the aggregate schema
  data-dictionary.md        new.    every field (5.4)
```

### G.2 The feature flag

`ORG_REPORT_V2` in the platform's env convention, off by default, read once in
`/api/admin/org-report` and in the admin dashboard. With the flag off, the route behaves
exactly as it does today. With it on, the route serves the v2 document and the dashboard
offers both. The flag is removed only after acceptance.

### G.3 Sequence

| Step | Work | Gate |
|---|---|---|
| 1 | The six remaining constructs in `orgAnalytics.ts` (section I) | Tests before UI, per phase 3 |
| 2 | The section 10 test list, roughly 15 further groups | All green |
| 3 | `orgCopy.ts` and `orgInterpret.ts`, with the 6.4 snapshot | The worked example renders exactly |
| 4 | `kit/` and `render/`, then `rangeComponent` and `quadrant` first | Scene tests: callouts, alt, direction |
| 5 | The remaining 25 charts | Each with its Scene test |
| 6 | Chapters 1 to 22 against the 9.9 minimums | A per-chapter test asserting the floor |
| 7 | `document.tsx`, cover, contents, appendix, pagination | No split, no empty page |
| 8 | PDF entry, Letter and A4 | Rendered-area measurement |
| 9 | HTML surface, animation, reduced motion, toggles | Reduced-motion and no-external-calls tests |
| 10 | QA cohort matrix (section 11), then the flip test | Recorded in `02-verification.md` |

### G.4 Things that must change outside the new code

- `group.ts` `moves` is capped at the top eight (`slice(0, 8)`). Chapter 18 needs every
  practice given to anyone in the group. The cap moves to the presentation layer.
- `GroupMember.segments` is never populated by the route. It will be, from whatever
  organisation fields exist, so the day a field is added the cut appears.
- The PDF page size is Letter only. `Page` takes a size and both are rendered in QA.
- The report currently has no chapter registry; the visual contents page needs one, and
  the "where this comes from" lines live on it.

### G.5 Known blockers, not resolvable here

1. **The LifeX logo.** `public/orgs/lifex.png` is the superseded lockup. The current
   artwork cannot be produced here and must be supplied as a file. Acceptance item 23
   cannot pass without it. Everything else proceeds; the strip reads the same asset path.
2. **A real cohort for phase 10.** The local store holds 30 records across four test
   domains and no Life College data. Phase 10 will run against the synthetic matrix in
   section 11 unless a real cohort is made available. The flip test is still meaningful on
   a synthetic cohort, but it is a weaker signal than a real one.
3. **Organisation fields.** Deviation 1. A collection change, not a report change.

---

## H. Privacy plan

The rule is that nothing suppressed leaves the adapter. The remediation established that
for segments; this extends it to every new cut the 22 chapters introduce.

### H.1 Layers

1. **Adapter.** `orgAnalytics.ts` is the only place that sees `GroupMember[]`. Everything
   downstream sees the aggregate. Suppressed cells are constructed without their values,
   not filtered afterwards, so there is no object holding a value that must then be
   stripped.
2. **`privacyState`.** Every requested cut is recorded with `shown | withheld`, the reason,
   and how many more respondents it would need. This is the honest replacement for the
   current report's "work from the segment page", which points a reader at nothing.
3. **Presentation.** Components take the aggregate and cannot reach a member. A component
   that receives a withheld cut renders the notice; it has nothing else to render.
4. **Outputs.** The dash grep, the no-per-person-row check and the suppressed-value check
   run against all four outputs: DOM, PDF text layer, PDF metadata, and the CSV and JSON
   exports.

### H.2 The new cuts, and how each is handled

| Cut | Risk | Rule |
|---|---|---|
| Developmental cohorts (12c) | A cohort of one is one person's constraint | Merged upward into the nearest theme below the segment threshold; the report says which were merged. Never withheld silently. |
| Profiles (12a) | Nine cells, some tiny | A distribution, not a demographic cut: all nine always shown with counts, as the brief requires. A profile count identifies nobody, because the profile is derived from the same answers already summarised elsewhere. Stated in the appendix. |
| Exposure register (11b) "reports to open" | A count of people | Already published as the vulnerability count on the dimension. No new disclosure. |
| Stage density dots (3a) | A dot could be a score | Positioned by stage band, never by index. Deviation 3. |
| Matrix density (5a) | Same | Not drawn at any N. Deviation 4. |
| Wave comparison (22) | Small movement cells | Movement counts follow the segment threshold; a transition cell below it is folded into "other movement". |
| Priority bubbles (17) | Bubble is a practice, never a person | Reach is a count already published in chapter 18. |

### H.3 Thresholds

Unchanged from the platform, and the stricter of the brief and the code applies: segments
at 7, sensitive cuts at 10, remainder suppression, no confidence intervals or correlations
below 30, no report below 3, the stronger caveat from 3 to 6. Two of these were added
during the remediation (the floor of 3, and the caveat flag). The sensitive-cut threshold
of 10 is **declared but still unused**, because no cut is currently classified sensitive;
when organisation fields arrive, any cut on a protected characteristic is classified
sensitive and takes the 10.

---

## I. Derived constructs

For each: the exact canonical fields, the rule, and the alternatives rejected. Seven from
section 5.6, of which five are built and two are new, plus the four aggregate constructs
the chapters need.

### I.1 Lean (built)

`riskLean(composites.dependencyIndex, composites.underexposure)` from `display.ts`, which
is the platform's own rule and the one the individual report has used since it shipped:
dependence when the dependency index is at or above 55 and exceeds underexposure by 15 or
more; disconnection on the mirror condition; balanced otherwise. Three counts, because the
platform does have a balanced state. Response by the brief's rule, with "both, run for
different people" when the two sides are within one person.

*Rejected:* a fresh margin defined for the group. The brief forbids inventing one, and a
group rule that disagreed with the individual reports would be indefensible when a manager
holds both.

### I.2 Readiness against protection (new, flagship)

- X, capability: `composites.futureReadiness >= 65`.
- Y, protection: `composites.judgment >= 65` **and** `dimensions.responsibleUse.score >= 65`
  **and** `dimensions.dependencySafety.score >= 65`.

Four cells, copy from 13.7.

*Why all three rather than two of three:* this is exactly the healthy-adoption protection
test minus the usage criterion, so chapter 5 and chapter 13's adoption funnel reconcile to
the same people. A "two of three" rule would put someone in "scale and lead" who fails a
criterion that the adoption chapter counts as a blocker, and a reader comparing the two
chapters would find them inconsistent.

*Rejected:* a continuous scatter on the two composites. The brief prefers threshold cells,
and a scatter plots individual points, which section 4 forbids.

*Rejected:* a protection composite computed here. The code holds none, and inventing one
would be a new scored instrument output, which section 5.6 forbids.

### I.3 Healthy adoption blockers (built)

The four criteria, in the order the code applies them: regular or deliberately selective
use; judgment at or above 65; The Line You Hold at or above 65; Independent Capability at
or above 65. For everyone failing the standard: which criteria fail, how many fail exactly
one, and the most common sole blocker. Denominator is the people who did not meet the
standard, not the whole group, because the question is "why the other 87 per cent".

### I.4 Developmental cohorts (new, rule validated)

The brief's proposed rule, which I validated before committing to it, as section 5.6
instructs. Assignment order:

1. Stage 1 to 3, or early on both in the use-against-capability cross, goes to
   **Foundations**.
2. Stage 7 or above with no gate held goes to **Advanced human-AI integration**.
3. A saturated bottleneck (no meaningful deficit) also goes to **Advanced human-AI
   integration**.
4. Otherwise, by bottleneck dimension, mapped to a theme: Practical AI Fluency and
   Deliberate Practice to **Fluency development**; Checking Before You Act and The Line You
   Hold to **Judgment and verification**; Decision Ownership and Independent Capability to
   **Agency and independence**; Better Thinking and Your Own Voice to **Amplification and
   strategic use**; What You Keep and Craft That Still Grows to **Transfer and skill
   preservation**.

Validation, on a 30-person synthetic workforce built to contain every shape: every person
received exactly one cohort, none undefined, and **all seven themes were reachable**.

One finding to carry forward: Foundations took 12 of 30, because "early on both" is a wide
condition (index below 55 and use below weekly). The rule is sound but the catch-all is
large, so chapter 12c reports the distribution plainly and the tier ladder in chapter 19
does not assume the cohorts are evenly sized. Worth retuning against real data, which is
recorded here rather than hidden in code.

*Rejected:* demographic cohorts. They are unavailable, and they would carry the segment
threshold into a chapter that is meant to work at any N above the report floor.

*Rejected:* multi-cohort membership. The brief says exactly one primary cohort, and a
person counted in three cohorts makes the headcounts in chapter 19 unusable for planning.

### I.5 Priority score (new)

Deterministic, from fields confirmed present:

- **Reach**, the x axis: how many people were given this practice by their own report.
- **Importance**, the y axis, summed: the practice's canonical priority level (immediate
  3, important 2, developmental 1, advanced 0); plus 2 if the dimension it addresses gates
  the next stage for anyone in this group (`gateAnalysis`); plus 1 if the count at or below
  the vulnerability line on that dimension is a fifth of the group or more.
- **Bubble size**: the median distance from the gate or threshold (`constraintGap`, or the
  gate gap where the dimension gates).
- **Region**: act now (reach above the median reach and importance 4 or more); target
  (importance 4 or more, lower reach); scale (the dimension is a group strength); monitor
  (everything else).

Note: the same practice tag carries different priority levels in different persona
libraries (`underexposure_fluency` is important in one and developmental in another), so
importance is read per person and then aggregated, never looked up once per tag.

*Rejected:* any monetary or time weighting. Section 4 forbids estimates.

### I.6 Workforce consistency (built)

Width of the middle half in points, translated by the brief's thresholds (under 10 high,
10 to 20 moderate, over 20 low), with the split sentence added when two or more dimensions
are polarised. Standard deviation moves to the appendix.

### I.7 Near-term mobility (built)

Per stage, three exclusive states summing to the stage headcount: immediately movable
(within five index points of the next stage and not gated), gate constrained (a gate is
capping the stage), development required (neither). The single "movable" count the old
report carried conflated the first two and counted anyone gated at any distance.

### I.8 Practice portfolio (new)

Every practice given to anyone, uncapped, grouped by the eleven themes in chapter 18, each
carrying reach and share, canonical priority, dimension addressed, the stages it can
unlock (from `practiceGateRole` in the dictionary), the expected behaviour change, the
progress indicator and the watch-for. The last three already exist per practice as
`behaviorChange`, `evidenceOfProgress` and `riskToMonitor`, and the current group report
drops all three.

### I.9 Roadmap (new)

Three bands. Days 1 to 30: practices at immediate priority, ranked by reach. Days 31 to
60: important priority, plus the practices addressing the most-held gate. Days 61 to 90:
developmental priority, the most-held gate itself, and the retake. Owner and target date
are rendered as blank fields, and the chapter says plainly which columns the assessment
supplies and which the organisation sets.

### I.10 Trend analysis or baseline (new)

Comparable only when `provenance.comparable` is true and a prior wave exists with matching
versions. When comparable: paired medians, stage movement, dimensions improved and
declined, share moving up and holding, gates cleared, gates newly appearing. When not: the
reason, drawn from `provenance.note`, and no comparison. When no prior wave: the baseline
panel.

### I.11 privacyState (new)

Every cut the report requested, with `shown | withheld`, the reason, and the shortfall.
Built in the adapter alongside the suppression decision rather than reconstructed
afterwards, so it cannot disagree with what was actually suppressed.

---

## What I need from you at Checkpoint B

1. **Approval of the seven deviations in E.1**, particularly deviations 3 and 4, where I
   am applying a stricter privacy rule than the brief allows.
2. **The LifeX artwork**, as a file.
3. **A real cohort for phase 10**, if one exists. It does not need to leave the server.
4. One decision I could not make for you: **deviation 7**, whether the HTML report stays
   an admin surface or whether organisations should eventually get their own authenticated
   view. It does not block anything; it changes what phase 7 builds towards.
