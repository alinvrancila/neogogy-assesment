# The aggregate model

The one object every component consumes. Defined in `src/engine/orgAnalytics.ts`
and `src/engine/group.ts`; this describes it in prose.

## The rule the shape enforces

`buildOrganisationAnalytics(label, members, now, exclusions)` is the only function
in the report that ever sees a `GroupMember`. Nothing downstream can reach one.
Suppression happens inside it, and a withheld cut is **built without its values**
rather than filtered afterwards, which is the difference between a value that is
hidden and a value that was never carried.

It throws `GroupTooSmallError` below three respondents, so no caller can render a
report of one person by accident.

```
OrganisationReportAnalytics
  group                        the full GroupResult, below
  readinessProtectionMatrix    { cells[4], base }
  developmentCohorts           { cohorts[], merged[] }
  practicePortfolio            { themes[], total }
  priorities                   PriorityItem[]
  roadmap                      RoadmapBand[3]
  trend                        comparable, or the baseline state with its reason
  futureMeasurement            MeasurementModule[6], every one collected: false
  privacyState                 PrivacyNote[] , every cut with shown | withheld
```

## `group`, the distributions

| Field | What it holds |
|---|---|
| `label`, `n`, `generatedAt`, `window` | The cohort and when it was read |
| `cohort` | The attempts rule, exclusions with reasons, and the small-cohort flag |
| `versions` | The versions in the running code |
| `provenance` | The versions that actually produced the readings, and whether they match |
| `personas` | Which assessments are present, with counts |
| `index` | `Spread`: median, Q1, Q3, min, max, mean, sd, and a CI only at 30 or more |
| `distribution`, `centre`, `shape` | Stage counts, the modal stage, and the spread label |
| `dimensions` | Per dimension: spread, band counts, vulnerable, nearThreshold, preliminary, polarised, uniformlyLow, evidence, confidence, and both names |
| `composites` | Six spreads, each with its own direction |
| `strengths`, `watchlist` | Thresholded at 65 and 45. Either may be empty. |
| `correlations` | Only at 30 or more |
| `archetypes`, `patterns` | Profile counts; help, harm, mixed and neutral tallies, each with its own base |
| `calibration` | Felt and predicted, each against the people who answered |
| `usageDistribution` | Reported use, five bands |

## `group`, the derived readings

| Field | What it answers |
|---|---|
| `lean` | Three counts by the platform's own `riskLean` rule, and the response that leads |
| `gateAnalysis` | Per gate: dimension, requirement, who it holds, their median, the gap, how many are close |
| `adoptionBlockers` | Why the people who did not meet healthy adoption did not meet it |
| `saidVsChosen` | All ten dimensions, three ways, with a median magnitude |
| `mobility` | Each stage split into immediately movable, gate constrained, development required |
| `constraintGap` | Median points between a constraint and what would clear it |
| `consistency` | The width of the middle half, and the sentence that translates it |
| `constraints`, `lowestScores`, `concentration` | What holds the group, and how concentrated it is |
| `moves` | Every practice given to anyone, uncapped, with its progress indicator and watch-for |
| `stagePlan`, `nextStage` | What each camp needs to move |
| `quadrants` | Two matrices, each with the base it covers, plus the deliberate non-use count |
| `governance` | The three exposure dimensions, counted at or below the vulnerability line |
| `headline` | Healthy adoption, and what is not collected |
| `flags` | Five signals worth opening an individual report for |
| `segments` | Cuts, shown or withheld. A withheld one carries `needs` and **no** `n`. |
| `movement` | Repeat takers, direction, and the transition matrix |
| `confidence` | How much weight the reading can carry |

## The three invariants

**Partition.** Any set of cells presented as a matrix covers its base exactly once
and divides by the population it covers. `capabilityUseBase + deliberateNonUse === n`.

**Direction.** Every dimension is aggregated from the canonical score, on which
higher is healthier. `healthyDirection` comes from the dictionary, never from
`reportedAsRisk`. Two composites genuinely run the other way and say so.

**Disclosure.** `SegmentReading.n` is optional and absent when suppressed. Nothing
suppressed appears on the object, in either export, on the page, or in the PDF
text layer.

## Where the prose comes from

`orgInterpret.ts` holds thirteen functions from aggregate values to the four
explanatory blocks, and `orgCopy.ts` holds the sentence templates. No prose is
written into a chapter, no language model runs at render time, and the same
numbers give the same sentences every time.
