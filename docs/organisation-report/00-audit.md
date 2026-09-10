# Organisation report: audit of what exists

Phase 1 deliverable. No file outside `docs/organisation-report/` was changed to produce this.

Audited at commit `51250dc`, against a full suite run of 1,404 tests across 19 suites, all passing.
Every claim below was checked against code and, where the behaviour was not obvious from reading,
against a throwaway probe driving the real engine. Probes were deleted; the working tree is clean.

Locale note: this document follows the brief's copy rules (en-GB, no em-dashes, no en-dashes).

---

## Summary for the decision you have to make

Three things matter more than the rest of this document.

1. **The data is richer than the brief assumes in most places, and thinner in three.** Every one of
   the ten dimensions carries a stored said-against-chosen delta for every persona, which the brief
   was unsure about. But there is no department, business unit, site, tenure, role level or training
   field anywhere in the schema, so the organisational segmentation the brief anticipates cannot be
   built from stored data. And no record stores the instrument version it was scored under, so
   wave-on-wave comparability cannot be validated for anything already collected.

2. **The current group report has four live defects, one of which is a privacy breach and one of
   which is a directionality inversion of exactly the kind section 5.1 asks me to hunt.** All four
   ship today. The 111 tests in the group suite pass through all of them, because they verify
   arithmetic and never semantics.

3. **The brief's canonical dictionary is built on a false premise.** There is no single
   "individual report name" per dimension. There are three vocabularies, and the names the brief
   proposes as executive display names are the Professional edition's names specifically. This needs
   a decision from you before Phase 2, and it is in the open questions at the end.

---

## The pipeline, confirmed against code

```
raw answer  (Answers: Record<itemId, number>)
  ↓ healthyValue()                       scoring.ts:88    reverse inverted, outcome 0 = abstain
  ↓ selfReportGaps()                     scoring.ts:150   per-construct signed gap, said minus chosen
  ↓ computeGaps()                        scoring.ts:180   pairId-linked claim vs scenario
  ↓ contributionsFor()                   scoring.ts:110   type weight x item weight x self-report damper
  │                                                       + secondary effects + per-option nudges
  ↓ scoreDimensions()                    scoring.ts:236   10 dimensions: score, reportedScore,
  │                                                       confidence, evidenceCount, consistencyGap,
  │                                                       microState.  Under 2 scored inputs a
  │                                                       dimension holds a prior of 50 and an
  │                                                       evidenceCount of 0, which excludes it below.
  ↓ usageProfile()                       scoring.ts:213   category, lowUseReason,
  │                                                       intentionalSelectiveUse, underexposed
  ↓ composites()                         scoring.ts:333   6 composites
  ↓ developmentalIndex()                 continuum.ts:33  weighted over evidenced dimensions only
  ↓ gateCap()                            continuum.ts:52  highest stage the gates allow
  ↓ placeOnContinuum()                   continuum.ts:80  stage, substage, borderline, gated
  ↓ findBottleneck()                     continuum.ts:130 gate first, else largest weighted deficit
  ↓ detectPatterns()                     patterns.ts      help / harm / mixed / neutral
  ↓ classify()                           archetypes.ts    one of nine
  ↓ buildRecommendations()               recommendations.ts  from 66 library entries
  ↓ calibration()                        scoring.ts:377   B1 desirability gap, B2 prediction gap
  ↓ overallConfidence()                  scoring.ts:400
  → HumanAdvantageResult                 index.ts:27
```

Orchestration is `compute()` in `src/engine/index.ts:27`. It is isomorphic and does no I/O, so
retroactive rescoring of stored records is a batch job rather than a re-survey. That matters for
Phase 2: the analytics layer can rescore rather than depend on what was stored.

---

## A. Current data architecture

### A.1 What each completed assessment carries

Stored as `LeadRecord.result` (`src/lib/storage.ts:52`), typed `HumanAdvantageResult`
(`src/engine/types.ts:236`). Confirmed present on all 29 v2 records in the local store.

| Field | Path on result | Type | Notes |
|---|---|---|---|
| Persona | `persona` | `Persona` | Authoritative. `LeadRecord.role` is the denormalised copy. |
| Usage band | `usageProfile.usage` | 1..5 | Respondent's own answer. |
| Usage category | `usageProfile.category` | minimal / light / regular / heavy | |
| Low-use reason | `usageProfile.lowUseReason` | string | Five labelled reasons, persona-specific for Minister. |
| Deliberately selective | `usageProfile.intentionalSelectiveUse` | boolean | Requires reason 1, usage <= 2, and verification and agency both >= 60. |
| Underexposed | `usageProfile.underexposed` | boolean | |
| Ten dimensions | `dimensions[id].score` | 0..100, healthy high | Canonical. |
| | `dimensions[id].reportedScore` | 0..100 | Only `dependencySafety` differs: 100 minus score. |
| | `dimensions[id].confidence` | high / moderate / preliminary / insufficient | |
| | `dimensions[id].evidenceCount` | integer | **0 means the dimension did not meet the two-input minimum** and is excluded from the index, the gates and the bottleneck. |
| | `dimensions[id].microState` | strong / developing / watch | |
| | `dimensions[id].consistencyGap` | `{claim, behavior, gap, flagged}` | Signed. See A.3. |
| Six composites | `composites.*` | 0..100 | `underexposure` and `dependencyIndex` are concern-high. |
| Patterns | `patterns[]` | `{id, label, kind, narrative, evidence[]}` | 20 defined: 10 general, 5 Business, 5 Minister. |
| Risk signals | `riskSignals[]` | `{tag, construct, severity, evidence[]}` | |
| Strengths | `strengths[]` | dimensions at or above 65, top 5 | Correctly thresholded here. |
| Vulnerabilities | `vulnerabilities[]` | dimensions at or below 45, top 5 | Correctly thresholded here. |
| Stage | `stage.stage`, `stageId`, `stageName` | 1..10 | `stageName` is resolved in the persona's own vocabulary at compute time and stored. |
| Index | `stage.rawIndex` | 0..100 | Ungated. `stage.index` is the gated, capped value. |
| Within-stage position | `stage.substage` | early / established / transitioning | |
| Borderline | `stage.borderline` | `{adjacentStage, distance}` | Only when not gated. |
| Gate | `stage.gated` | `{cappedFrom, reasons[], constructs[]}` | `constructs` is parallel to `reasons`. |
| Next target | `nextTarget` | `{stage, stageName, requirements[]}` | |
| Bottleneck | `bottleneck` | `{construct, reason, viaGate, saturated?}` | |
| Profile | `archetype` | `{id, name, tagline, narrative}` | One of nine. |
| Fingerprint | `fingerprint[]` | string[] | |
| Practices | `recommendations[]` | `{tag, priority, capability, behaviorChange, practice, evidenceOfProgress, riskToMonitor}` | Four priority levels. |
| Calibration | `calibration` | `{desirabilityGap?, calibrationGap?, note}` | |
| Overall confidence | `overallConfidence`, `confidenceNotes[]` | | |
| Business only | `riskRegister[]`, `ninetyDayPlan[]` | | Empty for other personas. |
| Minister only | `dependenceCheck`, `formationRoadmap[]` | | Undefined for other personas. |

### A.2 What the record carries around the result

`LeadRecord` (`src/lib/storage.ts:17`): `id`, `name`, `firstName`, `lastName`, `email`,
`mobilePhone`, `heardFrom`, `role`, `modality`, `consent`, `persona`, `personaName`, `overall`,
`dimensions`, `answers`, `baseline {b1, b2}`, `usageVal`, `createdAt`, `engineVersion`, `result`,
`stage`, `stageName`, `archetypeId`, `archetypeName`, `confidence`, `rescoredFrom`, `reportToken`,
`reportTokenIssuedAt`, `emailSent`, `emailError`, `meta`.

`meta` (`SubmissionMeta`, `src/lib/storage.ts:85`) holds roughly 80 fields across four groups: the
sitting (duration, revisions, away time, answer pace, rushed answers, resumed), the device, the
person's locale and network, and the acquisition source. Server-filled fields include IP, geo and
ISP. **None of it is used in scoring, and none of it is organisational.**

The one organisational-looking field is `meta.business` (`company`, `industry`, `teamSize`,
`tools`), which is free text, optional, volunteered, and **collected for the Business Owner persona
only**.

### A.3 Answers to the specific questions the brief asked

**Is every dimension's said-against-chosen delta stored, or only the three largest?**
All ten, for all seven personas. Verified by probe: every persona bank contains exactly ten
`pairId`-linked claim and scenario pairs, and every one of the ten `DimensionResult` objects came
back carrying a populated `consistencyGap`. The delta is **signed** (`claim` minus `behavior`), so
"healthier in situations than described" is recoverable as well as the flattering direction.

One caveat for the interpretation engine: `consistencyGap.flagged` is one-directional
(`gap >= 2`, `config.ts:96`). It flags self-flattery only. The signed `gap` supports the symmetric
reading the brief wants; `flagged` does not, and must not be used for it.

A second, richer measure exists and is **discarded**: `selfReportGaps()` (`scoring.ts:150`) computes
a per-construct signed gap over all self-descriptions against all situations, not just the paired
items. It drives the scoring damper and is then thrown away, never reaching the result. Phase 2
should surface it, because it is the better input for a said-against-chosen chapter.

**How are multiple attempts by one person handled? What is the canonical rule?**
Two different rules exist in the codebase, and they disagree.

- `priorAttempts()` (`src/lib/history.ts:63`) matches on **email and persona**, with a comment
  explaining exactly why persona is part of the match: the seven sets ask different questions and
  place on differently named stages, so an index from one is not comparable with an index from
  another.
- `toPeople()` (`src/lib/analytics.ts:92`) groups on **email alone**. It is the function the group
  report uses. `first` and `latest` can therefore be different assessments, and the `indexDelta` and
  `priorStage` fed into the group report's movement chapter can be a Teacher result minus a Parent
  result.

**This is the same defect class that `history.ts` was fixed for, still live in the analytics path.**
See D.5. The canonical rule should be the one `history.ts` already documents: latest completed
attempt per person **per persona**, within the window.

**Do Business Owner results belong in an employee aggregate?**
No. The Business Owner instrument assesses the business, not the person: its dimensions are named
"Operational Continuity", "Team Capability Growth", "Governance, Data, and Trust", its stages are a
different ten ("AI Absent" to "AI Compounding"), and its index is the "Business AI Health Score". A
Business Owner's "Team Capability Growth" reading is a statement about their staff, so aggregating
it alongside those staff's own readings double-counts the same workforce through two different
instruments. Recommend excluding by default with a note in the cohort summary, and offering it as a
separate one-person context panel. The route already supports a `persona` filter, so the mechanism
exists.

**Are prior waves recorded, and are versions stored?**
Attempts are recorded and orderable by `createdAt`, so waves can be reconstructed by date window.
**Versions are not stored on any record.** `VERSIONS` (`config.ts:19`) is a module constant read at
render time, so a group report prints the instrument, scoring, scenario and language versions of the
code that is running now, not the versions that produced the readings. See D.6.

### A.4 Organisation membership

There is no organisation entity. Membership is derived from the **email domain**
(`domainOf()`, `analytics.ts:61`), with free and disposable providers excluded from organisational
rollups (`isOrgDomain()`). `OrgProfile` (`src/lib/orgProfile.ts`) holds only cover presentation: a
domain, a title, a subtitle and a base64 logo. It has **no DynamoDB path**; it reads and writes
`data/org-profiles.json` on local disk only.

---

## B. Current group report architecture

### B.1 The path

```
GET /api/admin/org-report?domain=&persona=&from=&to=&label=&format=
  → isAdminAuthed()
  → listLeads() → toAttempts()      filters engineVersion === 2 && result
  → date and persona filters
  → toPeople()                      groups by email, keeps latest
  → filter by domain
  → GroupMember[]                   pseudonymous key r1..rN
  → buildGroupResult()              src/engine/group.ts:174, all aggregation
  → generateGroupPdf()              src/lib/groupReportPdf.tsx, or JSON, or CSV
```

Called from one place in the UI: `src/components/admin/Dashboard.tsx:907`.

### B.2 What is aggregated today

`GroupResult` (`group.ts:107`) carries: personas with counts; the index `Spread`; the stage
distribution; the modal `centre`; a `shape` label; `earlyRoute`; `gateHeld` with a per-gate count;
`movableMiddle`; ten `dimensions` each with a `Spread`, band shares, `polarised` and `uniformlyLow`
flags, evidence and a confidence tally; six `composites`; `strengths` and `watchlist`;
`correlations`; nine `archetypes` with counts; help and harm `patterns`; `calibration`;
`constraints`; `lowestScores`; `concentration`; `moves`; `stagePlan`; `nextStage`; two `quadrants`
sets; three `governance` readings; a `healthyAdoption` headline and a `notCollected` list; five
`flags`; `segments`; `movement`; and a `confidence` level.

### B.3 Statistical methods in use

- `spreadOf()` (`group.ts:161`): nearest-rank quantiles via `Math.round(q * (n - 1))`. Returns
  median, Q1, Q3, min, max, mean, SD, range. Adds a distribution-free CI on the median at n >= 30.
- `spearman()` (`group.ts:184`): tie-corrected rank correlation, used at n >= 30 for three pairs.
- Band shares: strong at >= 65, watch at < 40, developing in between.
- `shape`: "two groups" when four or more stages separate occupied camps, else by SD at 10 and 18.
- `concentration`: top constraint share at 50 and 33.

### B.4 Privacy as implemented

`SUPPRESSION = { descriptive: 7, sensitive: 10 }` and `INFERENCE_FLOOR = 30` are declared at
`group.ts:120`. Enforcement, grepped across `src/`:

| Rule | Enforced? | Where |
|---|---|---|
| Segment cut at 7 or more | Yes | `group.ts:544` |
| Remainder rule (withhold when the other side falls below 7) | Yes | `group.ts:544` |
| No CI below 30 | Yes | `group.ts:176` |
| No correlations below 30 | Yes | `group.ts:293` |
| Sensitive cuts at 10 or more | **No.** `SUPPRESSION.sensitive` is referenced only to pick a confidence label. No cut is classified sensitive anywhere. | |
| Minimum N to produce a report at all | **No.** `buildGroupResult` throws only on zero members. | |
| Suppressed cell size withheld | **No.** The exact `n` reaches the PDF, the JSON and the CSV. | |
| No per-person row in any export | Yes | JSON and CSV are aggregate-only; verified by reading `toCsv()` and the JSON branch. |
| Report token never exported | Yes | Stripped elsewhere; not present on `GroupMember`. |

### B.5 The rendered document

`generateGroupPdf()` emits a cover plus nine content pages, one of which is conditional, so 10
physical pages at most. The eyebrow labels ("Page 1", "Page 2, continued", "Pages 4 and 5") are a
legacy of an earlier layout and disagree with the footer's own `pageNumber of totalPages`.

Visual inventory, which is the brief's central complaint and is accurate: a stage distribution bar
chart (`Distribution`), a median-and-IQR rule per dimension (`DimRow`), a count bar (`Tally`), and a
`SpreadLine` that is pure text. That is the entire chart vocabulary. There is no matrix, no funnel,
no ruler with bands, no cohort visual, no priority plot, no annotation on any chart, and no
per-chart explanatory block.

---

## C. Missed business intelligence

Checked against the 23-row inventory in the brief. "Available" means it can be computed from stored
per-person data with no new collection.

| # | Inventory row | Today | Available | Note |
|---|---|---|---|---|
| 1 | Practice Health Score distribution | Partial | Yes | Spread and stage counts exist. No spread-to-English translation, no ruler visual. |
| 2 | Stage and within-stage position | Partial | Yes | `substage` is stored and **never aggregated**. Relation of each stage to the median is not computed. |
| 3 | Lean, three counts | **Missing** | Yes | `riskLean()` (`display.ts:859`) is the canonical rule, has a genuine "balanced" state, and is used in four individual-report components. The group report never calls it. |
| 4 | Ten dimensions, full aggregation | Partial | Yes | Missing: count at or below 45 per dimension, preliminary share as a share, count within five points of the next threshold, change from a prior wave. |
| 5 | Six composites | Yes | | Present, text-only. |
| 6 | Profile distribution | Partial | Yes | Counts exist. No per-profile guidance, no "profiles absent" reading. |
| 7 | Help and watch patterns | Partial | Yes | **`mixed` and `neutral` patterns are silently dropped** by `tally()`, which only counts help and harm. "Intentional selective use" and "Cautious but underleveraged" can therefore never appear. Pattern components are not surfaced. |
| 8 | Use intensity and deliberate selectivity | Partial | Yes | `deliberateNonUse` count exists; no usage distribution. |
| 9 | Capability against use | Yes, defective | Yes | See D.3. |
| 10 | Fluency against protection | Yes, defective | Yes | See D.2. |
| 11 | Readiness against protection | **Missing** | Yes | All inputs stored. This is the brief's flagship map. |
| 12 | Vulnerability line on the three governance dimensions | Yes | | The one place the vulnerability line is used correctly. |
| 13 | Healthy adoption | Partial | Yes | Pass count only. **The blocker distribution, which is the actionable half, is not computed.** |
| 14 | Signals | Yes | | Five flags present. |
| 15 | Calibration | Yes | | Present. Denominators are the answering subgroup, which needs stating in copy. |
| 16 | Said-against-chosen per dimension | **Missing** | Yes | All ten deltas stored per person, all seven personas. Nothing aggregates them. |
| 17 | Bottleneck distribution | Partial | Yes | Counts exist. **Median gap to the gate is not computed**, so "which capability, if grown, moves the most people" cannot be answered by magnitude. |
| 18 | Practice gates per transition | Partial | Yes | Count only. No dimension threshold, no current median, no gap, no count close to clearing. |
| 19 | Movable flag | Partial | Yes | `movableMiddle` conflates "within five index points" with "gated at any distance", so a person 40 points short of a gate counts as movable. The three states the brief wants (immediately movable, gate constrained, development required) are all derivable and are not separated. |
| 20 | Practice reach and priority mix | Partial | Yes | Top 8 by count. No priority mix, no dimension addressed, no stages unlocked, no progress indicator, no watch-for. |
| 21 | Next-stage actions by transition | Yes | | `stagePlan` covers it. |
| 22 | Persona and organisation fields | Partial | **No** | Persona and reported use only. See below. |
| 23 | Dates, versions, prior waves | Partial | **No** | See D.6. |

### C.1 The three things that are not available from stored data

1. **Organisational segmentation.** Department, business unit, site, role, leadership level, tenure
   and training exposure do not exist in the schema. `GroupMember.segments` is a generic
   `Record<string, string>` that would carry them, and the org-report route **never populates it**.
   Today's only cuts are Assessment (persona) and Reported use. Everything the brief expects at
   level 4 beyond those two needs a collection change. This is the single biggest gap between the
   brief's ambition and the data.

2. **Wave comparability.** Not validatable for existing records. See D.6.

3. **The six not-collected modules** the current report already lists honestly: verification
   coverage and sign-off rates, task time and quality against a baseline, capability retention,
   net task value, team climate and training exposure, intervention lift. The brief agrees these
   stay uncollected and must be declared, and the existing `notCollected` list is a good starting
   point.

### C.2 What the data supports that neither report uses

- `substage` across the group: how many people are late in their stage and therefore closest to
  moving, which is a sharper mobility signal than index distance alone.
- `stage.borderline`: stored per person, never aggregated.
- `riskSignals` tallied by tag: a governance exposure list finer than the three-dimension line.
- `evidenceCount` per dimension as a data-quality readout per chapter.
- `meta.durationMs`, `rushedAnswers`, `revisions`: a cohort data-quality panel, already computed
  for the admin dashboard by `buildQualityReport()` and never offered to the organisation.
- `PatternHit.evidence`: which items produced each pattern.
- Recommendation `evidenceOfProgress` and `riskToMonitor`: exactly the "how will I know it worked"
  and "watch-for" content the brief asks for in chapter 17, already written per practice, and
  dropped by the group's `moves` tally.

---

## D. Data and scoring problems

Ordered by severity. Each was confirmed by probe against the real engine, not by reading alone.

### D.1 Directionality inversion on Independent Capability (**live defect, brief section 5.1**)

`group.ts:307` builds each dimension row as:

```ts
const scores = results.map((r) => r.dimensions[c]?.score ?? 0);   // canonical, healthy HIGH
return { name: def.name,                                          // "Independent Capability"
         lowerIsHealthier: !!def.reportedAsRisk,                  // true
         spread: spreadOf(scores), ... }
```

`DimRow` (`groupReportPdf.tsx:264`) then prints the name, appends "(lower is healthier)" when the
flag is set, and colours the median dot and the IQR band with the warning palette when it is set.

Probe output, on a cohort of eight:

```
label printed : "Independent Capability (lower is healthier)"
median plotted: 75
canonical .score      (Independent Capability, higher healthier): 0.8, 25, 50, 50, 75, 75, 100, 100
.reportedScore        (Dependency Risk, lower healthier)        : 99.2, 75, 50, 50, 25, 25, 0, 0
bands from canonical: strong 4, developing 2, watch 2
```

The row plots canonical Independent Capability values, labels them Independent Capability, and
declares that lower is healthier. Every other computation on the row (band counts, `polarised`,
`uniformlyLow`) correctly treats the values as healthy-high. **Only the label and the colour are
inverted.** A workforce with strong independent capability is drawn in the alarm colour under a
sentence telling the reader to want less of it.

The individual report does not have this bug: `history.ts:138` pairs the name "Dependency Risk"
with `reportedScore`, which is consistent.

Fix is one line either way, but the dictionary in Phase 2 must settle which convention wins so it
cannot recur. The tests in `tests/humanAdvantage/group.ts` assert the flag matches
`reportedAsRisk`, which is why 111 passing tests never caught it: the assertion encodes the bug.

### D.2 The fluency-against-protection matrix double-counts (**live defect**)

`group.ts:452`. The four cells are not a partition:

- `fu` = fluency >= 65 and judgment < 65
- `fw` = fluency >= 65 and judgment < 55
- `fp` = fluency >= 65 and judgment >= 65
- `nf` = fluency < 65

`fw` is a strict subset of `fu`. Probe, on six members with fluency 100 and judgment 29.4:

```
cells: fu "Fluent and unprotected"=6  fw "Fluent, unprotected, watch"=6  fp=0  nf=0
sum of cells = 12 against n = 6   shares sum = 200.0%
```

The page presents this as a four-cell matrix. It reports twelve people in a group of six.

### D.3 The capability-against-use matrix drops people silently (**live defect**)

`group.ts:445`. Cells are computed over `scored` (members excluding deliberate non-users) but the
share divides by the full `n`. Probe, five regular users and three deliberate non-users:

```
n=8  deliberate non-use=3
cells: hh=5 hl=0 lh=0 ll=0  sum=5  shares sum=62.5%
-> 3 people appear in no cell of the matrix
```

Deliberate non-use is reported separately, which is the right editorial call, but the matrix reads
as covering the workforce and does not say that 37.5% of it is elsewhere.

### D.4 A withheld segment publishes its exact size (**live privacy defect**)

`groupReportPdf.tsx:574` renders the cell count and the withholding notice in the same row:

```
Assessment    Teacher                          2
              Withheld: too few people to report without identifying them.
```

`toCsv()` (`org-report/route.ts:59`) does the same: `countRow('segment', '... (suppressed)', s2.n, 0)`.
The JSON export returns the whole `GroupResult`, `segments[].n` included.

Probe on eight Students and two Teachers:

```
Assessment / Student: suppressed=true n=8
Assessment / Teacher: suppressed=true n=2
```

Note the Student row is correctly withheld by the remainder rule, and the remainder rule then
becomes the mechanism of the leak: the reader is given both cell sizes and told they cannot be
shown. In a ten-person organisation, "two Teachers" is identifying information.

This is the rule the brief states as absolute: nothing suppressed exists in the DOM, a tooltip, an
export, an API response, PDF metadata or an alt text.

### D.5 A group of one produces a full report (**live privacy defect**)

`buildGroupResult` throws only on an empty member list. `/api/admin/org-report` guards only on
`!people.length`. Probe:

```
n=1 built without error. index median=0.4 min=0.4 max=0.4
named constraint: Human Agency for 1 of 1
```

Every median is that person's score, the range identifies them exactly, and the report names their
bottleneck. This is an individual report with the person's name removed and their employer's name
on the cover. The brief's floor of three, with a stronger caveat from three to six, would close it.

Related: `toPeople()` groups by email alone (`analytics.ts:92`), so `indexDelta` and `priorStage`
fed into the movement chapter can compare a person's Teacher attempt against their Parent attempt.
`history.ts` was fixed for exactly this and carries a comment describing the failure it caused: a
respondent shown a climb of sixty-seven points that never happened. The analytics path was not
fixed with it.

### D.6 Instrument versions are not stored, so waves cannot be validated

`VERSIONS` is a module constant. No record carries the versions it was scored under; confirmed by
inspecting all 29 v2 records in the local store, none of which has a `versions` key on `result`.

The group report prints `versions: VERSIONS`, which is a claim about the running code presented as
provenance for the readings. The brief's section 5.8 rule cannot be satisfied for anything already
collected, and cannot be satisfied going forward without a schema addition.

Two consequences to decide in Phase 2. Going forward, stamp `VERSIONS` onto the record at submit
time. Historically, records can only be described as "version not recorded", and a wave comparison
across the boundary should be refused rather than qualified. The mitigating fact is that `compute()`
is pure and stored `answers` are complete, so a historical wave can be **rescored** under today's
engine to make it comparable, which is a better answer than refusing. That should be an explicit
option in the plan.

### D.7 Strengths and the watchlist are unthresholded

`group.ts:340`: `strengths` is the top three dimensions by median and `watchlist` is the bottom
three, with no reference to the 65 floor or the 45 line. Probe on a uniformly strong cohort:

```
strengths: Human Agency 75 | Verification & Judgment 75 | Independent Capability 75
watchlist: Creative Leverage 75 | Responsible Use 75 | Adaptive Growth 75
strength floor is 65
```

Three dimensions at 75, a full ten points above the strength floor, are presented to an executive as
the workforce's watchlist. Symmetrically, a uniformly weak workforce is given three strengths it
does not have. `compute()` already does this correctly for individuals (`index.ts:44`, filtered at
65 and 45), so the correct pattern exists in the codebase.

### D.8 The median is not the median the reading guide will describe

`spreadOf` uses nearest-rank with `Math.round`, which on an even n returns a single observed value
rather than the midpoint of the two central ones, biased upward because JavaScript rounds halves up.
Probe on eight members:

```
sorted index values: 0.4, 25, 50, 50, 75, 75, 99.6, 99.6
engine median: 75   |  4th=50 5th=75  midpoint=62.50
engine q1: 50 (3rd)   q3: 75 (6th)
```

The brief's section 7 draft copy says "With an even number of people, the median sits halfway
between the two in the middle." Against this code that sentence is false, and off by 12.5 points on
this cohort. One of the two has to move. My recommendation is to change the code to linear
interpolation, because the brief's sentence is the one a reader can verify by hand and the current
rule has an upward bias no one chose.

Related inconsistency: `analytics.ts:134` has a second `spread()` with the same purpose and a
different rule (`Math.floor`). The admin dashboard and the group report therefore report different
quartiles for the same people. Phase 2 should collapse these to one implementation.

### D.9 Undefended magic numbers

`config.ts` opens by declaring that every threshold is named and in one place. These are not:

| Value | Where | Meaning |
|---|---|---|
| 55 | `group.ts:443` | "high capability" for the use matrix |
| 55 | `group.ts:453` | "watch" judgment cut in the protection matrix |
| 5 | `group.ts:257` | index points defining "movable" |
| 4 | `group.ts:243` | stage gap defining "two groups" |
| 10, 18 | `group.ts:245` | SD cuts for tight / moderate / spread |
| 50, 33 | `group.ts:412` | constraint share cuts for concentration |
| 55, 55 | `group.ts:522` | dependency and readiness cuts for the "eroding" flag |
| 55 | `scoring.ts:229` | fluency cut for `underexposed` |
| 60 | `continuum.ts:162` | healthy floor when the next stage has no gates |
| 55, 15 | `display.ts:859` | the lean rule's level and margin |

Every one of these will be load-bearing in the new report. They belong in the dictionary.

### D.10 Denominator problems in the pattern tally

`tally()` (`group.ts:373`) divides every pattern count by the full `n`. Five patterns can only fire
for Business Owners and five only for Ministers. In a mixed cohort, a Minister-only pattern that
fired for every Minister present is reported as a small share of the whole workforce. Either scope
the denominator to the personas that can fire the pattern, or scope the chapter.

The same applies to `calibration`, which correctly divides by the answering subgroup but is rendered
without saying so, and to `governance`, which is fine because all personas carry those three
dimensions.

### D.11 Vocabulary is not one vocabulary (**affects brief section 5.2 directly**)

There is no single individual-report name per dimension. Probe across all seven editions:

| Canonical | Student, Teacher, Parent, Leader, Minister | Business Owner | Professional |
|---|---|---|---|
| Human Agency | Human Agency | Owner Decision Ownership | Decision Ownership |
| Verification & Judgment | Verification & Judgment | Verification Before Consequence | Checking Before You Act |
| Independent Capability | Independent Capability | Operational Continuity | Unaided Capability |
| AI Fluency | AI Fluency | Business AI Fluency | Practical AI Fluency |
| Learning Transfer | Learning Transfer | Institutional Knowledge Capture | What You Keep |
| Cognitive Amplification | Cognitive Amplification | Strategic Amplification | Better Thinking, Not Only Faster |
| Skill Growth | Skill Growth | Team Capability Growth | Craft That Still Grows |
| Adaptive Growth | Adaptive Growth | Business Adaptability | Deliberate Practice |
| Responsible Use | Responsible Use | Governance, Data, and Trust | The Line You Hold |
| Creative Leverage | Creative Leverage | Market Differentiation | Your Own Voice |

The reversed dimension has three risk names, not the two the brief lists: **Dependency Risk**
(five editions), **Continuity Risk** (Business), **Reliance Risk** (Professional).

Stages and the index differ too:

| Edition | Stage 1 | Stage 5 | Stage 10 | Index name |
|---|---|---|---|---|
| Student, Teacher, Parent, Leader, Professional | AI Detached | AI Functional | Future-ready / Generative | |
| Business Owner | AI Absent | AI Operational | AI Compounding | Business AI Health Score |
| Minister | At a Distance | Working | Rooted and Fruitful | Formation Health Score |
| Professional | | | | Practice Health Score |
| Student, Teacher, Parent, Leader | | | | developmental index |

Two consequences for the brief as written:

- The names the brief proposes as `executiveName` (Decision Ownership, Checking Before You Act, and
  so on) are **the Professional edition's names**, presented as though they were the individual
  report's names generally. They are a reasonable choice for an executive audience, but they are a
  choice, not a fact about the platform.
- "The Practice Health Score" is the Professional edition's name for the index, not a platform-wide
  name. Used unqualified on the organisation report's cover it will not match what a Business Owner
  or a Minister sees on their own report.
- The current group report resolves all stage names through `stageName(lead, stage)`, where `lead`
  is simply the **most common persona in the cohort**. A mixed group of six Professionals and five
  Business Owners is labelled entirely in Professional stage names, and the Business Owners' own
  reports disagree.

The brief's "where this comes from" line, which exists so a manager can match a voluntarily shared
employee report against the group report, therefore breaks for two of the seven editions unless
this is resolved. It is the first item in the open questions.

### D.12 Smaller findings

- **`mixed` and `neutral` patterns never reach a group report** (C, row 7).
- **`fileStem()` is not used by the group report.** The filename is built inline as
  `${label}_Group_Report.pdf` (`org-report/route.ts:132`), which is the exact pattern that left
  `Neogogy_Formation_Compass.pdf` in production through three renames. The individual routes were
  moved onto `fileStem()`; this one was missed.
- **The report's own page numbering disagrees with itself** (B.5).
- **`OrgProfile` has no DynamoDB path.** Cover branding lives in a local JSON file on one instance
  and will not survive an instance replacement, unlike every other stored thing.
- **`evidence.min` uses `Math.min(...ev)`** (`group.ts:328`), a spread over one element per member.
  Fine at current sizes, a stack overflow at the "N of 8,000" scale the brief contemplates.
- **`count(x, feltN || 1)`** (`group.ts:397`) makes shares against a denominator of 1 when nobody
  answered the calibration questions, producing a 0% that means "no data" rather than "nobody".
- **The LifeX logo asset is the superseded version.** `public/orgs/lifex.png` is the crimson LIFEX
  wordmark over "GET WHERE YOU WANT TO BE – FASTER". The brief describes the current lockup as the
  X reversed out of a maroon square with "[SKILLS] FOR WHAT'S NEXT" inside it. **The replacement
  artwork is not in the repository** and I cannot produce it. See open questions.

### D.13 Why 111 passing group tests caught none of this

`tests/humanAdvantage/group.ts` recomputes medians, shares and counts by hand and compares. It is
good arithmetic testing. Every defect above is semantic: a correct number under a wrong label, a
correct count in an overlapping set, a correct suppression flag beside an unsuppressed value, a
correct aggregation of an incomparable pair. The suite also contains at least one assertion that
encodes D.1 rather than catching it.

Phase 3 should add the class of test that would: partition tests (cells sum to n), direction tests
(a healthier cohort moves the displayed value the healthy way), disclosure tests (no suppressed
value appears in any of the three output formats), and boundary tests at 0, 39.9, 40, 44.9, 45,
64.9, 65 and 100 for both a capability metric and a reversed one, as the brief specifies.

---

## Open questions for Checkpoint A

These change what I build, so I would rather have your answer than a documented assumption.

1. **Which vocabulary does the organisation report speak?** (D.11) Three options: the Professional
   edition's names as the brief proposes, which reads best to an executive but matches only one of
   seven editions; the canonical names, which match nothing a respondent sees but are neutral across
   editions; or the lead persona's names, which is what happens today and silently mislabels
   minorities in a mixed cohort. My recommendation is the brief's proposal, the Professional names,
   with the canonical name in small print on each card and a per-edition alias table in the
   appendix, because the executive reader is the one the report is for.

2. **Do we fix the median rule or the reading guide?** (D.8) My recommendation is to fix the code to
   linear interpolation and keep the brief's sentence.

3. **The LifeX logo.** (D.12) I need the current artwork as a file. Without it the partnership strip
   will carry the superseded lockup, which the brief explicitly forbids, or nothing.

4. **Is there a real cohort for Phase 10?** The local store holds 30 records across four test
   domains, no Life College data. I can render the visual QA against a generated cohort matrix
   instead, which is better for coverage but will not show you your own numbers. If a real cohort
   exists in production I would rather use it, and it does not need to leave the server.

5. **Sections 9 onward of your brief did not arrive.** The message was truncated partway through
   chapter 3, at "Table 3c". I have the chapter architecture through chapter 3 and the numbered
   references to sections 9.3, 9.9, 11, 12, 13.2 and 13.7, but not their content. The audit did not
   need them. `01-plan.md` does: the component plan, the remaining chapters, the QA matrix and the
   copy blocks all live in the missing part. Please resend from section 9.

---

## What Phase 2 inherits

Good news, so it is not buried under the defect list:

- `compute()` is pure and stored answers are complete, so any historical record can be rescored.
- All ten said-against-chosen deltas are stored, signed, for all seven personas.
- The canonical lean rule exists, with a real "balanced" state.
- Gates carry their construct id, so gate analysis needs no string parsing.
- The practice library holds 66 entries with priorities, evidence-of-progress and watch-for text.
- Suppression is already enforced in one place, which is the right architecture. It needs its leak
  closed and its floor added, not a rewrite.
- Individual-level strengths and vulnerabilities are already correctly thresholded, so the correct
  pattern is in the codebase to copy.
