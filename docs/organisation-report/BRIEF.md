# Brief for Claude Code: the Neogogy Human Advantage Organisation Report, rebuilt as an executive workforce intelligence report

**How to use this file.** Save it as `docs/organisation-report/BRIEF.md` in the assessment.neogogy.ai repository, open Claude Code in the repository root, and send:

> Read `docs/organisation-report/BRIEF.md` in full. Begin with section 3, phase 1. Do not modify any file until you have delivered the plan described in section 3.2 and I have approved it. The code and the canonical scoring definitions are the source of truth, not the sample PDFs. Never fabricate data the platform does not hold. Treat section 2.5 (visually rich and easy to follow) as a governing requirement on every page you produce, equal in weight to the privacy rules.

---

## 1. Context and the standard

### 1.1 What exists

You are working inside the codebase that powers **assessment.neogogy.ai**, the Neogogy Human Advantage Assessment (internal shorthand HAS), delivered under the LifeX and ICAN brands with Life College International as the institutional home. Instrument 2.3, scoring rules 2.1, scenarios 2.0, language en-GB. Seven personas: Student, Teacher, Parent, Leader/Administrator, Minister/Preacher, Business Owner, Professional. The instrument scores ten dimensions from 0 to 100, places each person on a ten-stage gated continuum by a continuous developmental index (the Practice Health Score), assigns one of nine pattern-based profiles, fires help and watch patterns, and prescribes practices on a this-week, 30-day, 90-day cadence.

Two documents exist today.

1. **The individual report** ("Human Advantage Report: Professional Edition", sixteen pages). Rich. Beyond the ten dimension scores it carries stage and within-stage position, direction of lean (towards disconnection or towards dependence), six composites, a profile, patterns fired, calibration (how the person felt, what they predicted, what was measured), said-against-chosen (self-description versus situational choices, per dimension), a named bottleneck with the gate value the next stage requires, next-stage actions, four prioritised practices, and a sequenced plan.

2. **The organisation report** (currently titled "Group Report", twelve pages). It aggregates a set of individual results for one organisation. It is statistically careful, it respects privacy thresholds, and it is honest about what is not collected. It is also written for an analyst. A business owner reads "median 65.2, Q1 60.3, Q3 67.6, polarised" and does not know what workforce they have, where the risk is, or what to do on Monday. It has almost no visuals. It uses technical dimension names (Human Agency, Verification and Judgment) where the individual report uses friendly names (Decision Ownership, Checking Before You Act). It leaves several aggregations the individual data already supports unused (lean, bottleneck distribution, gate distribution, said-against-chosen, healthy-adoption blockers, developmental cohorts, profile-level guidance, strengths). And when segments are withheld for a small group, it tells the reader to "work from the segment page", which leaves them with nothing.

Do not assume the two sample PDFs show every field the application holds. Audit the code.

### 1.2 What this project is

This is not primarily a graphic redesign. It is a data architecture, analytics, information design, and executive decision-support project. The objective is to turn aggregated assessment results into a report that a business owner, CEO, executive team, HR leader, Chief People Officer, Chief AI Officer, or Learning and Development lead can use without statistical, assessment, or AI expertise. The report answers one compound question:

> What kind of AI workforce do I actually have, where are we strong, where are we exposed, what is preventing us from becoming AI-ready, and what should I do next?

The report must read well whether the organisation is a bakery chain, a BPO, a shared-services centre, a school, or a church. Write to role families and to the work itself, never to one sector.

### 1.3 The standard you are judged against

A CEO given the finished PDF should understand:

- in under 60 seconds, where the workforce broadly stands;
- in under 5 minutes, the main strengths, risks, and developmental bottlenecks;
- in under 15 minutes, which populations inside the workforce need different kinds of development;
- in under 30 minutes, what organisational AI capability strategy follows from the results;

and should be able to answer, in their own words, "What should we do Monday morning?"

Every number should have a sentence next to it that a manager could repeat to a colleague. Every chart should be understandable without its text, and the text without its chart. The report should be as honest as the current one about what it does not know, and far easier to act on.

---

## 2. The idea the whole report carries

### 2.1 The question is not "how much AI do they use"

The instrument does not ask whether a workforce uses AI. It asks whether the way people use AI, or choose not to, is strengthening their capabilities. The individual report treats future readiness and human protection (judgment, agency, independence, verification, responsible use) as related but distinct. That distinction is the spine of the organisation report.

A workforce with heavy AI use is not necessarily AI-ready. A workforce with little AI use is not necessarily unhealthy. A workforce can show any of these combinations, and the report must make them visible:

- high adoption with high capability
- high adoption with weak judgment
- high adoption with dependence that is eroding capability
- low adoption with strong human capability (restraint that is chosen)
- low adoption with low capability (restraint that is simply unpractised)
- high fluency with poor verification
- high output with weak transfer
- high creativity with weak ownership
- strong governance with thin practical fluency

### 2.2 Never collapse the workforce into one number

The group developmental index stays. The reader must never be allowed to read it as "our workforce is 59% AI-ready". The report is organised as a six-level hierarchy, and every chapter belongs to one level:

1. **Workforce position.** Where is the workforce on the developmental continuum?
2. **Workforce capability.** Which capabilities are strong or weak?
3. **Human protection.** Are judgment, agency, independence, verification, and responsible use keeping pace with use?
4. **Adoption pattern.** How much AI are people actually using, and is restraint chosen or unpractised?
5. **Development constraint.** What is keeping people from progressing?
6. **Action.** What should the organisation do next, in what order, and how will it know it worked?

### 2.3 The character of Neogogy

The desired endpoint is not maximum AI use. It is human capability strengthened through intelligent use of AI: agency, judgment, verification, independent capability, learning transfer, skill development, cognitive amplification, adaptability, responsible use, and creative ownership. The best employee is not the person using the most AI. Keep that visible on the cover page, in the executive answer, and in every management response.

### 2.4 The "so what" rule

No statistic is ever orphaned. Every major figure is followed by what it means for the workforce and, where relevant, what management should do. A bad rendering is "Verification median: 56.4." A good rendering is: "Checking Before You Act is developing rather than consistently strong. The middle person shows some checking behaviour, but the workforce does not yet check consistently at the level mature AI use needs. Increasing adoption without strengthening checking would widen exposure. Management response: set a verification standard for consequential AI-supplied claims and build it into training and workflows." Generate this kind of language from the data with deterministic rules (section 6), never hard-code it to the sample.

### 2.5 Visually rich and easy to follow (governing requirement)

The reader is a busy executive who will flip before they read. The report must carry its story in visuals first and prose second, and every visual must explain itself where it stands. These rules apply to every page from the cover through chapter 22; only the appendix may be text-led.

1. **No page without a visual.** Every page in chapters 1 to 22 carries at least one visual element that is not a paragraph: a chart, a scorecard, a table with in-cell bars or band pills, an annotated illustration, a callout box, or a timeline. A page of running text is a defect.
2. **About half of every page is visual.** As a working target, visual elements (charts, cards, rulers, illustrations, callouts) occupy roughly half the area of each executive page, and never less than a third. Prose fills the rest in short paragraphs of at most four sentences.
3. **Every visual explains itself, in place.** The four explanatory blocks (6.2) sit directly beneath their chart, in the same column, on the same page. An explanation on the next page is a defect. In PDF, the chart and its blocks move together as one unit.
4. **Every chart is annotated.** At least one callout on each chart points at the finding in words ("5 of 8 people are here", "the middle person sits here", "this gate holds 4 people"). Axes and legends are not enough; the chart must say what it shows.
5. **Titles are findings.** Every chart title and every section heading states the conclusion in a plain sentence, so that the headings alone tell the story.
6. **Numbers are drawn, not only printed.** Any figure that matters is also shown as a bar, a marker on a ruler, a filled pill, a dot count, or a cell shade. Tables use in-cell bars and coloured band pills rather than bare digits.
7. **One visual language, learned once.** One icon per dimension, one colour and label per band, one badge style per stage, one range component for every distribution, one quadrant style for every matrix. The reader learns the system in chapter 2 and never has to relearn it.
8. **Progressive disclosure.** Each chapter opens with a strip: the question it answers, the one-line answer, the key figure, and a mini visual. Then the main visuals. Then detail. In HTML, detail is expandable; in PDF, detail sits after the main visual or in the appendix.
9. **Visual table of contents.** After the cover, one page listing every chapter with the question it answers, an estimated reading time, and a thumbnail of its main visual.
10. **End-of-chapter line.** Every chapter closes with a one-line summary in a small box ("In one line: ...").
11. **Where this comes from.** Each chapter carries one small line naming the section of the individual report it aggregates, so a manager holding an employee's report (shared voluntarily) can match the two.
12. **The flip test.** A reader who turns every page and reads only the headings, the visuals, and the callouts must still be able to say what workforce the organisation has, where the exposure is, what the bottleneck is, and what to do first. Test this explicitly in phase 10 and record the result.
13. **Whitespace is part of the design.** Generous margins and spacing between blocks; never crowd two charts to fit a page budget. Add a page instead.

---

## 3. Working method and checkpoints

### 3.1 Phase 1. Audit before anything changes

Do not modify any file in this phase. Inspect and document, with file paths:

- assessment question definitions and persona-specific questions
- the scoring engine: answer types, scenario evidence, dimension contributions, evidence counts and the preliminary (confidence) flag
- dimension calculations, composite calculations, the developmental index
- the ten-stage continuum, stage thresholds, within-stage position, the practice gates and their minimum readings
- the lean rule (underexposure against dependency index) and how "deliberately selective" is decided
- profile logic (all nine), help and watch pattern logic (the full library and thresholds)
- calibration (the two unscored pre-questions and how prediction accuracy is banded)
- said-against-chosen: whether every dimension's delta is stored or only the three largest shown per person
- bottleneck (constraint) logic and the gate value it reports
- next-stage logic, the practice library, priority levels (immediate, important, developmental)
- movable logic (within five index points or held only by a gate)
- group aggregation logic as it stands (medians, quartiles, band counts, polarised detection, healthy adoption, the two crosses, signals)
- privacy suppression logic (segment threshold, sensitive-cut threshold, remainder rule, small-N statistical restrictions) and where it is enforced (server, presentation, exports, API)
- the database schema; every demographic or organisation field that exists (persona, reported use frequency, department, business unit, role, leadership level, site, tenure, training exposure, or anything else)
- how multiple attempts by one person are handled (the launch audit flagged retake history mixing personas under one email); determine the canonical rule for which attempt counts in a wave
- whether Business Owner persona results (which assess the business rather than the person) belong in the same aggregate as employee personas; if not, exclude with a note
- historical waves: whether prior completions per organisation exist and how versions are recorded
- report HTML and components, charting libraries, PDF generation, print CSS, design tokens, fonts, logo assets
- current tests

Draw the pipeline map and confirm each step against code:

```
raw answer
  → answer type / scenario evidence
  → dimension contribution
  → ten dimensions (score, band, confidence, evidence count)
  → six composites
  → developmental index
  → stage, within-stage position, lean
  → practice gates / constraint (bottleneck)
  → profile, help patterns, watch patterns
  → priority practices
  → next-stage pathway, movable flag
```

Then determine which of these can be safely and meaningfully aggregated across a group, and which cannot.

Deliver `docs/organisation-report/00-audit.md` containing:

- **A. Current data architecture.** Every individual-level field that exists, with path and type.
- **B. Current group report architecture.** What is aggregated today and how.
- **C. Missed business intelligence.** Group insights the existing data supports that are not produced today (check against the inventory in section 5.5).
- **D. Data and scoring problems.** Especially metric naming, directionality, threshold consistency, and privacy enforcement gaps (see section 5.1).

**Checkpoint A.** Stop and show me `00-audit.md`.

### 3.2 The plan

Deliver `docs/organisation-report/01-plan.md` containing:

- **E. Proposed report.** Chapter architecture (start from section 8; list every deviation with its reason).
- **F. Component plan.** Charts and reusable components (start from section 9).
- **G. Implementation plan.** Files, components, services, and the analytics layer you will build or refactor.
- **H. Privacy plan.** How aggregation and suppression remain safe at every layer.
- **I. Derived constructs.** For every construct in section 5.6, the exact canonical fields and rules you will use, with the alternatives you rejected.

**Checkpoint B.** Stop and show me `01-plan.md`. Implementation begins only after approval.

### 3.3 Phases 2 to 10

- **Phase 2. Report data model.** Build or refactor the safe aggregate analytics layer (section 5.3).
- **Phase 3. Statistical and privacy tests.** Prove the data layer correct before any UI (section 10).
- **Phase 4. Information architecture.** Implement the chapter structure (section 8).
- **Phase 5. Visual system.** Reusable visualisation components (section 9).
- **Phase 6. Interpretation engine.** Deterministic interpretation rules and sentence templates (section 6).
- **Phase 7. Web report.** Responsive, restrained animation.
- **Phase 8. PDF report.** Premium print output from the same template.
- **Phase 9. QA.** The cohort matrix in section 11.
- **Phase 10. Visual QA.** Render the full Life College sample and inspect every page as an image, not as HTML.

Keep the existing report available behind a feature flag until the new one is approved. Record verification in `docs/organisation-report/02-verification.md` against section 12.

---

## 4. Constraints that do not bend

**Privacy.** This is an organisational development report, not an employee appraisal. Nothing names, ranks, or singles out a respondent. No per-person row is exported. Segment threshold, sensitive-cut threshold, remainder suppression, and small-N statistical restrictions stay exactly as the platform defines them (today: segments at 7 or more, sensitive cuts at 10 or more, a cut withheld when its remainder would fall below threshold, no confidence intervals or correlations below 30). Apply whichever is stricter, this brief or the code. Suppression is enforced server-side in the analytics layer and again at presentation; nothing suppressed exists in the DOM, a tooltip, an export, an API response, PDF metadata, or an alt text. Below 10 respondents no individual score is readable from any chart (median, middle half, and range only; the current report already reports min and max, so range is permitted). At 10 or more, an anonymised, jittered, unlabelled dot strip or density is allowed with no hover values on points, and only if the platform's privacy code permits plotting individual points at all.

**Counts lead.** Every percentage sits beside its count and never replaces it. Below 30, counts are primary and percentages are rounded to whole numbers. No false precision: "1 of 8 (13%)", never "12.5% versus 13.1%". A difference inside the noise of a small group is not a finding and the copy never calls it one. As N grows, percentages may become more prominent (section 5.7).

**Nothing estimated.** If a module is not collected (task time, quality, rework, capability retention, net task value, team climate, training exposure, intervention lift), say so. No projected productivity figures, no cost savings, no ROI, no benchmarks against other organisations unless the platform holds a validated norm set (it does not today). No runtime language-model prose; interpretation is deterministic and auditable.

**Directionality.** No capability metric is ever displayed with risk directionality, and no canonical value is altered for presentation (section 5.1).

**One vocabulary.** The canonical dimension dictionary (section 5.2) supplies one executive display name per dimension, used everywhere in the body, with the canonical name in small print once per card and in the appendix. Independent Capability is the display name for the reliance dimension (plotted so higher is healthier); Reliance Risk, Dependency Risk, and Unaided Capability are recorded as aliases and appear only in the appendix. The audit should note that the individual report uses three names for one construct; aligning it is a follow-up, not part of this brief.

**Copy style.** No em-dashes or en-dashes anywhere in any output: templates, chart labels, alt text, PDF text layer, tests fixtures. Use commas, colons, periods, or parentheses. Ordinary hyphens inside compound words are fine. No all-caps for emphasis (bold or italics instead; "lower is healthier" is printed in bold, not capitals). No superlatives, no alarm language, no framings such as "everything depends on this". Plain, grounded, inviting. Second person ("your people", "your organisation"). Never "pupil" (use "student", "child", or "young learner" for school cohorts). British spelling to match the instrument's en-GB locale, driven by the platform's locale setting.

**Disclaimers preserved verbatim.** The assessment-indices disclaimer and the not-for-ranking-appraisal-or-selection disclaimer appear unchanged. Caveats stay concise and never crowd out usability.

**The scale's asymmetry stands.** Dependence costs more on the index than underexposure does, by design (dependence erodes capability that is slow to rebuild; underexposure leaves capability intact and is a fluency gap, held back by the gates rather than the index). The reading guide explains this once. The report does not relitigate it.

**Logo.** Use the current LifeX logo only: the LIFEX wordmark in crimson with the X reversed out of a maroon square and "[SKILLS] FOR WHAT'S NEXT" inside the lockup. The partnership strip on both existing reports still shows the superseded "Get where you want to be, faster" version; replace it. Because the tagline is inside the lockup, never repeat it as separate text.

---

## 5. Data foundations

### 5.1 Directionality audit, before any redesign

Three related fields exist: Dependency Risk (a dimension, stored with lower healthier), Independent Capability (100 minus Dependency Risk, higher healthier), and the dependency index (a composite across several dimensions, higher is a concern). The current group report appears to handle these correctly, but the individual report labels the same construct three ways, and the risk of a future inversion is real. Do this before anything else:

1. Trace the canonical calculation in code. Do not accept the relationships above because they are written here.
2. Establish canonical field names, canonical directionality, and display names, and record them in the dictionary (5.2).
3. Make every report consistent with the dictionary.
4. Add automated tests that fail on any inversion, including boundary cases at 0, 39.9, 40, 44.9, 45, 64.9, 65, and 100 for both a capability metric and a reversed metric.
5. Confirm that the band table and the vulnerability line are applied as four distinct classifications and never conflated: watch below 40; vulnerability at or below 45; developing 40 to 64.9; strength at or above 65. A reading of 42 is both developing and vulnerable; a reading of 38 is both watch and vulnerable; a reading of 50 is developing and not vulnerable. Tests cover all three.

### 5.2 The canonical dimension dictionary

One central definition per dimension, consumed by every component; nothing invents terminology locally. Verify the mapping against the implementation before codifying it. Expected content:

| canonicalName | executiveName (display) | individualReportName (alias) |
|---|---|---|
| Human Agency | Decision Ownership | Decision Ownership |
| Verification and Judgment | Checking Before You Act | Checking Before You Act |
| Dependency Risk (stored, lower healthier) | Independent Capability (displayed, higher healthier) | Reliance Risk; Unaided Capability; Independent Capability |
| AI Fluency | Practical AI Fluency | Practical AI Fluency |
| Learning Transfer | What You Keep | What You Keep |
| Cognitive Amplification | Better Thinking, Not Only Faster | Better Thinking, Not Only Faster |
| Skill Growth | Craft That Still Grows | Craft That Still Grows |
| Adaptive Growth | Deliberate Practice | Deliberate Practice |
| Responsible Use | The Line You Hold | The Line You Hold |
| Creative Leverage | Your Own Voice | Your Own Voice |

Each entry stores at least:

```
{
  canonicalId, canonicalName, executiveName, individualReportAliases,
  cluster,                       // judgment and protection | capability that lasts | fluency and growth
  whatItMeasures,                // one sentence, canonical copy
  businessMeaning,               // section 13.2
  bandCopy: { strength, developing, watch },
  healthyDirection,              // "higher" | "lower", with the display transform if any
  thresholds: { watch: 40, vulnerability: 45, strength: 65 },
  practiceGateRole,              // which transitions it gates and the minimum reading
  relatedCompositeIds,
  exposureLabel,                 // for the three governance dimensions only
  recommendedPractices           // library IDs
}
```

Build the same kind of dictionary for the six composites (question wording, direction, band copy), the ten stages (canonical description, business meaning, what people here need next, gates that open it), the nine profiles (description, opportunity, risk, developmental emphasis, first conversation), and every help and watch pattern (components, description, organisational response).

### 5.3 The analytics layer

Page components never interrogate raw submissions. A pure adapter turns the list of completed assessments plus the organisation record (and any prior waves) into one safe aggregate object, and every web and PDF component consumes only that object. Suppression is applied inside the adapter, so a suppressed segment never leaves it.

```
type OrganisationReportAnalytics = {
  cohortSummary;            // N, window, personas, attempts rule applied, exclusions with reasons
  stageDistribution;        // per stage: count, pct, relation to median, movable, gate held
  continuum;                // index median, Q1, Q3, min, max, spread label, consistency copy
  lean;                     // towards disconnection / balanced / towards dependence
  dimensionAnalytics;       // per dimension: full aggregation of 5.5 row 4
  compositeAnalytics;
  readinessProtectionMatrix;
  usageCapabilityMatrix;
  fluencyProtectionMatrix;
  healthyAdoption;          // count, pct, funnel, blocker distribution
  profileDistribution;
  helpPatterns; watchPatterns;
  calibration;
  saidVsChosen;
  gateAnalysis;
  bottlenecks;
  mobility;
  practicePortfolio;
  developmentCohorts;
  priorities;
  roadmap;
  trendAnalysis | baselineState;
  futureMeasurement;        // modules not collected, with what each would add
  privacyState;             // every requested cut with shown | withheld and reason, and how many more respondents would be needed
  versions;
};
```

Document its schema in `docs/organisation-report/03-model.md`.

### 5.4 The data dictionary

Generate `docs/organisation-report/data-dictionary.md` documenting every field available to the report: field, source, calculation, range, direction, thresholds, privacy status, aggregation method, display name, business interpretation, allowed segmentation. Cover dimensions, composites, stages, index, lean, profiles, patterns, calibration, said-against-chosen, gates, bottleneck, movable, practices, use intensity, metadata, historical fields.

### 5.5 The data inventory: what each completed assessment carries, and how it aggregates

Confirm every row against the schema in phase 1. Where the schema carries a field, use it. Where it does not, derive it at report time from per-person data and say so in `00-audit.md`. Where it cannot be derived, the section that needs it renders the honest "not collected yet" state.

| # | What each person's assessment carries | Where it sits in the individual report | Group aggregation | The business question it answers | Level |
|---|---|---|---|---|---|
| 1 | Practice Health Score (developmental index, 0 to 100) | "Where you are on the route" | Median, middle half (Q1 to Q3), range, spread label from the platform's thresholds, distribution | How far along is my workforce, and how alike are my people? | 1 |
| 2 | Stage (1 to 10), within-stage position (early, settled, late) | Same | Count and pct per stage; centre (stage holding most people); reach (lowest to highest); relation of each stage to the median; count near the next boundary | What can I expect people to handle, and how many are close to the next step? | 1, 5 |
| 3 | Lean: underexposure composite against dependency index | "Which way you are of the path" | Counts towards disconnection, balanced, towards dependence (the platform's rule, not a new one) | Is my risk avoidance or over-reliance? They need opposite responses. | 1, 4 |
| 4 | Ten dimensions: score, band, preliminary flag, evidence count | "Your ten dimensions" | Per dimension: N; median; Q1; Q3; min and max where privacy-safe; strong, developing, watch counts and pct; count and pct at or below 45; share preliminary and median evidence count; polarised flag; count and pct within five points of the next threshold; change from a prior comparable wave | Where is my workforce strong, developing, vulnerable, or divided? | 2, 3 |
| 5 | Six composites | "Six bigger questions" | Median, Q1, Q3, range, band counts, direction | The six executive questions | 2, 3 |
| 6 | Profile (one of nine) | "What your answers say about you" | Count and pct per profile; profiles absent | What kinds of AI users do I employ, and how do I lead each kind? | 4 |
| 7 | Help patterns and watch patterns fired | "Where AI seems to be helping" and "What to watch" | Count and pct per pattern; count with no watch pattern; count with at least one help pattern; the components that produce each pattern | Which self-reinforcing habits are forming, good and bad? | 2, 3 |
| 8 | Reported use intensity; deliberately-selective flag | Pre-questions; signals | Distribution; deliberately-selective count separate from low use | How much are people using AI, and is restraint chosen? | 4 |
| 9 | Capability against use (derived cross) | Group report page 3 | Four counts and pct | Who do I scale, check, develop first, or found? | 4 |
| 10 | Fluency against protection (derived cross) | Group report page 3 | Four counts and pct | Are AI skills developing faster than AI judgment? | 3 |
| 11 | Readiness against protection (derived, section 5.6) | Not shown today | Four cells (or density at large N) | Are we building AI capability safely? | 2, 3 |
| 12 | Vulnerability-line status on The Line You Hold, Checking Before You Act, Decision Ownership | "At a glance" | Count and pct at or below 45 on each | Where is my exposure on confidential information, unverified claims, delegated decisions? | 3 |
| 13 | Healthy adoption (four criteria) | Appendix definition | Funnel; count passing all; blocker distribution for those not passing | How many use AI the way I would want everyone to, and what blocks the rest? | 3, 4 |
| 14 | Signals: held by a gate, underexposed, capability on thin protection, deliberately selective, thin evidence | Group report pages 4 and 5 | Count per signal | Which individual reports are worth opening, and why? | 3, 5 |
| 15 | Calibration: feel, prediction, measured; prediction accuracy | "Feel against measure" | Counts feels healthier, about right, feels less healthy; prediction exact, within one band, further | Does my workforce know where it stands? | 3 |
| 16 | Said-against-chosen deltas per dimension with direction and magnitude | "Said against chosen" | Per dimension: aligned; healthier in situations than described; weaker in situations than described; magnitude distribution | Where do people under-credit or over-credit their own practice? | 3 |
| 17 | Bottleneck dimension and required gate value | "The constraint" | Count and pct per bottleneck dimension; median gap to gate | Which single capability, if grown, moves the most people? | 5 |
| 18 | Practice gates held, per transition | "Moving people up" | Per gate: dimension, count held, pct, current median, required threshold, gap, count close to clearing | Which guardrail is keeping people from the next stage? | 5 |
| 19 | Movable flag | "Moving people up" | Per stage: current, immediately movable, gate constrained, development required, likely next stage | How many people can move within a quarter? | 5, 6 |
| 20 | Recommended practices with priority | "Your practices, in detail" | Reach count and pct per practice; priority mix; dimension addressed; stages it can unlock; progress indicator; watch-for | What training reaches the most people? | 6 |
| 21 | Next-stage actions | "Where next" | Grouped by transition | What does each camp need to move? | 6 |
| 22 | Persona and any organisation fields | Cover; enrolment | Segments at threshold; sensitive cuts at threshold | Do different parts of the organisation need different things? | 4 |
| 23 | Dates, report IDs, versions, prior waves | Cover; appendix | Window; version match; trend where comparable | Can I compare this with the last wave and the next? | 6 |

### 5.6 Derived constructs (define in the plan, verify in tests)

Every construct below is built from canonical fields and canonical thresholds. None introduces a new scored instrument output. Each is documented in the data dictionary and, in plain words, in the appendix.

**Lean.** Use the platform's rule that produces "towards disconnection" or "towards dependence" in the individual report (underexposure composite against dependency index). Three counts. Do not invent a margin; if the platform has no "balanced" state, report two counts and say so.

**Readiness against protection (the flagship map).** X: capability and readiness, from the future readiness composite. Y: protection, from the healthy-adoption protection criteria (Judgment composite at or above 65, The Line You Hold at or above 65, Independent Capability at or above 65) or, if the code holds a protection composite, that. Prefer cells defined by canonical thresholds over a continuous scatter. Four cells: high capability with high protection ("scale and lead"); high capability with low protection ("powerful but exposed"); low capability with high protection ("protected but under-activated"); low capability with low protection ("build the foundation"). Copy for each cell in section 13.7. At N of 10 or more, and only if privacy code permits, a jittered anonymous density may sit behind the cells.

**Healthy adoption blockers.** For every person not meeting healthy adoption, which of the four criteria fail. Aggregate into a blocker distribution (count failing each criterion; count failing exactly one; the single blocker most common among those failing exactly one). This turns "13% healthy adoption" into "why the other 87% have not yet met the standard".

**Developmental cohorts.** Needs-based, not demographic, so they stay privacy-safe at any N above the segment threshold. Assign each person to exactly one primary cohort by a deterministic rule, then report counts only. Proposed rule, to validate against data: stages 1 to 3, or "early on both" in the use-against-capability cross, go to Foundations; otherwise assign by bottleneck dimension mapped to a theme (Practical AI Fluency and Deliberate Practice to Fluency development; Checking Before You Act and The Line You Hold to Judgment and verification; Decision Ownership and Independent Capability to Agency and independence; Better Thinking and Your Own Voice to Amplification and strategic use; What You Keep and Craft That Still Grows to Transfer and skill preservation); stages 7 and above with no gate held go to Advanced human-AI integration. Cohorts under the segment threshold are merged upward into the nearest theme or withheld, and the report says which. Do not hard-code cohort labels until you have confirmed they can be generated reliably.

**Priority score (for the priority matrix).** Deterministic and documented: reach (count affected) on one axis; importance on the other, computed from the practice's canonical priority level (immediate, important, developmental), whether the dimension it addresses gates the next stage for people in this group, and the count at or below the vulnerability line on that dimension. Bubble size: median distance from the gate or threshold. Categories: act now (large reach, meaningful vulnerability); target (smaller but higher-risk reach); scale (existing strength worth spreading); monitor (no immediate intervention). No monetary weighting.

**Workforce consistency.** Translate the spread label: tight becomes "workforce consistency: relatively high; most employees sit within a narrow developmental range, so a shared programme may work better here than in a dispersed workforce"; wide becomes "workforce consistency: low; employees operate at substantially different levels, so one universal programme is unlikely to meet the needs of the whole organisation"; and where polarisation exists on several dimensions add "the workforce is split rather than uniformly weak or strong". The body uses the width of the middle half in points; the standard deviation sits in the appendix.

**Near-term mobility.** "{k} of {N} people appear close to their next developmental stage under current scoring rules." Conditions stated, movement never promised.

### 5.7 Reporting that responds to sample size

The report grows more sophisticated as N grows and never uses the same density for N of 8 and N of 8,000.

- **Small N (below 30).** Counts lead; distributions as median, middle half, range; broad findings; segments only where thresholds allow; no confidence intervals, correlations, or trend inference beyond like-for-like medians.
- **Medium N (30 to roughly 100).** Richer distributions, cohort comparisons, safe segment analysis, confidence intervals only if the canonical methodology defines them.
- **Large N.** Correlations and confidence intervals if the methodology permits, richer organisational segmentation, historical trend analysis, density plots behind the matrices.

Below 3 respondents, do not generate a report; render a notice stating the minimum. From 3 to 6, generate the full report with all segments withheld and a stronger caveat on the cover and in the executive answer.

### 5.8 Waves and comparability

A comparison across waves is valid only when instrument, scoring, scenario, and language versions all match. When they do, the trend chapter shows prior and current medians, stage movement, dimensions improved and declined, share moving upward and stable, gates cleared, new gates appearing, and change linked to an intervention only where the platform records the intervention. When they do not match, say so and do not compare. When no prior wave exists, the chapter becomes "This is your baseline" and explains what the next assessment will let the organisation learn.

### 5.9 Attempts and personas

Use the platform's canonical rule for which attempt counts in a wave (expected: the latest completed attempt per person within the window). Report the rule on the cover in one line. Confirm in the audit whether Business Owner persona results belong in an employee aggregate; if they assess the business rather than the person, exclude them with a note in the cohort summary.

---

## 6. The interpretation engine

Prose is generated by deterministic, testable functions that take aggregate values and return structured text. No prose is tied to the Life College sample. No language model runs at render time unless a controlled, audited layer already exists in the platform (state in the plan if it does).

### 6.1 Functions

```
interpretContinuum({ stageCounts, median, q1, q3, min, max, spreadLabel, n })
interpretLean({ towardsDisconnection, balanced, towardsDependence, n })
interpretDimension({ id, median, q1, q3, strongPct, developingPct, watchPct, vulnerabilityPct,
                     polarised, preliminaryShare, healthyDirection, n })
interpretComposite({ id, median, q1, q3, direction, n })
interpretMatrix({ id, cells, n })
interpretHealthyAdoption({ count, funnel, blockers, n })
interpretProfiles({ counts, n })
interpretPatterns({ help, watch, n })
interpretCalibration({ feel, prediction, n })
interpretSaidVsChosen({ perDimension, n })
interpretGates({ gates, n })
interpretMobility({ perStage, n })
interpretPriorities({ items, n })
```

Each returns:

```
{ headline, howToRead, interpretation, businessMeaning, recommendedResponse, caveat }
```

### 6.2 The four explanatory blocks under every significant chart

Fixed labels, in this order, each two to four sentences:

- **How to read this.** What the chart shows, in words, with the key number.
- **What your workforce is telling you.** The aggregated pattern interpreted.
- **Why this matters to the business.** Workplace consequences.
- **What management should do.** A development or governance response grounded in the practice library, never an ultimatum.

Where a chart is small (a tile, a counter), the last three collapse into one sentence of meaning.

### 6.3 Sentence templates (string keys in the platform's i18n convention)

- **Count.** "{k} of {n} people ({pct}%)."
- **Median.** "The middle person in your group scores {median} on {name}. That is in the {band} band: {bandCopy}."
- **Middle half.** "The middle half of your people sit between {q1} and {q3}, a spread of {width} points, so {interpretation}." Interpretation by width, using the platform's thresholds if defined, otherwise: under 10 points, "your people are similar on this and one approach can serve the core"; 10 to 20, "there is a real difference between your stronger and weaker half"; over 20, "one approach will not fit everyone here".
- **Range.** "Your people reach from {min} to {max}."
- **Polarised.** "{kStrong} people are in the strength band and {kWatch} in the watch band on {name}. This is not one workforce problem but at least two employee populations: a single shared session would be too basic for one and too thin for the other. Coach this in two groups."
- **Preliminary.** "{k} of {n} readings on {name} are preliminary, meaning they rest on fewer answers than usual. Treat the median lightly and expect it to firm up on a retake."
- **Vulnerability.** "{k} of {n} people are at or below the vulnerability line (45) on {name}. That is the number of individual reports worth opening on this capability."
- **Lean.** "{kDis} of {n} people lean towards disconnection, {kBal} are balanced, and {kDep} lean towards dependence. The larger response your group needs is {response}." Response: "more real, bounded practice" when disconnection leads; "guardrails and deliberate unaided practice" when dependence leads; "both, run for different people" when they are within one person of each other.
- **Mobility.** "{k} of {n} people appear close to their next developmental stage under current scoring rules. Movement depends on {conditions}."

**Workforce-shape narrative (first that applies, in order).**

- Two camps (two non-adjacent stages each hold 30% or more): "Your workforce has two camps, at stage {a} ({kA} people) and stage {b} ({kB} people). They need different things, and the chapters that follow treat them separately where the numbers allow."
- Concentrated (one stage holds half or more): "Your workforce is concentrated at stage {s}, {name}: {k} of {n}. One shared programme is realistic for this core, with separate attention for the {above} people ahead of it and the {below} people behind it."
- Spread (no stage holds 30% or more): "Your people are spread across {count} stages, so a single programme would fit few of them. The cohort and bottleneck chapters show where the shared needs are."
- Otherwise: "Most of your people are at stage {s}, {name} ({k} of {n}), with the rest reaching from stage {low} to stage {high}."

Then, independently: leading edge (anyone two or more stages above the centre): "{k} people sit two or more stages ahead of the centre. They can coach, and their practice is worth protecting." Trailing edge: "{k} people sit two or more stages behind the centre and will need a first task with a colleague alongside before any shared programme reaches them."

**Executive story template (chapter 1).** Generated from stage centre, lean, polarised count, top bottleneck, and healthy adoption. Illustrative output for the sample, never hard-coded: "Your workforce has moved beyond basic AI awareness. Most of your people already operate in functional AI territory, so the challenge is no longer adoption. The next opportunity is turning functional use into thoughtful integration while protecting checking, decision ownership, independent capability, and skill development. Because several capabilities are polarised, a single generic AI course is unlikely to be sufficient."

### 6.4 Worked example for snapshot tests

From the sample cohort of 8 (index): median 58.9, Q1 56.0, Q3 63.5, range 50.1 to 73.0. Expected rendering: "The middle person in your organisation scores 58.9 out of 100, which places them at stage 5, AI Functional. The middle half of your people sit between 56.0 and 63.5, a spread of 7.5 points, so your people are similar on this and one approach can serve the core. Your people reach from 50.1 to 73.0."

### 6.5 What the copy never does

It never calls a difference significant. It never compares the organisation to other organisations. It never estimates money, time, or productivity. It never names a person. It never overclaims causality (calibration and said-against-chosen in particular). It never uses dashes or all-caps emphasis.

---

## 7. The reading guide (the page that lets a non-specialist read everything else)

One page (two at most in print), placed as chapter 2, with every term also available as a hover definition in HTML and printed visibly in the PDF. Draft copy:

**What a score is.** Every score runs from 0 to 100 and describes practice on the day people answered: how they were working with AI, not how competent they are, and not their standing at work.

**The bands.** Draw the band ruler once here and print it under every scored chart. 65 and above is a strength (teal). 40 to 64.9 is developing (amber). Below 40 is watch (brick). 45 and below is the vulnerability line, drawn as a dashed maroon rule across the ruler. These are four classifications, not three: a reading of 42 is developing and also vulnerable.

**The route.** Ten stages, from 1 (AI Detached) to 10 (Future-ready / Generative). A stage is a neighbourhood, not a coordinate. Stages 5 and above carry gates: minimum readings on Decision Ownership, Checking Before You Act, Independent Capability, The Line You Hold, and What You Keep, so that fluency alone cannot carry a person past a weakness that matters.

**The median: the middle person.** Line your people up from the lowest score to the highest. The median is the score of the person standing in the middle: half your people score at or above it, half at or below. It is not the average, and that is deliberate: one unusually high or low person moves an average a long way and moves the median hardly at all. With an even number of people, the median sits halfway between the two in the middle. Illustrate with a row of nine example dots (illustrative, not this group's data), the middle one ringed and labelled "the median".

**The middle half.** From the person a quarter of the way up the line to the person three quarters of the way up. Narrow means your people are similar and one programme can serve the core. Wide means one programme will not fit them all.

**The range.** The lowest and highest score in the room. It shows how far the group reaches, not where most of it sits, and it identifies nobody.

**Workforce consistency.** The report's translation of spread (section 5.6).

**Polarised.** The group holds both a strength and a vulnerability on the same capability. That is at least two employee populations, and a single shared session serves neither well.

**Preliminary.** A reading that rests on fewer answers than usual. Read lightly; expect it to firm up on a retake.

**Gates.** A stage asks for minimum readings before it opens. A gate is what holds a fluent person at a stage until a weakness that matters is addressed.

**Which way the group leans.** There are two ways to be off the path. Towards dependence: the work would be hard to reproduce without the tool; the response is guardrails and deliberate unaided practice. Towards disconnection: little real practice behind the person's view of AI; the response is more real practice, not more caution. The index treats dependence as the costlier of the two, deliberately.

**Lower is healthier.** Two composites (how much depends on the tool; how much practice is missing) run the other way. Wherever they appear, the chart says so in bold and the visual direction is reversed so that a longer bar never looks better.

**Why counts lead.** With a small group, a count is more honest than a percentage. Percentages appear beside counts, never instead of them.

**What this report will not do.** It does not name, rank, appraise, or select anyone. Segments appear only at seven or more people, and a cut is withheld when it would leave fewer than seven on the other side, because a cut that leaves three people identifies them.

---

## 8. Chapter architecture

Use logical pagination; chapters take the pages they need, and no content block splits across a page. Each chapter belongs to one level of the hierarchy in 2.2 and answers one question a business owner would ask. If a section does not answer such a question, it does not belong. Every significant chart carries the four explanatory blocks (6.2). Every chapter opens with the strip from 2.5 (question, one-line answer, key figure, mini visual), closes with the one-line summary box, and carries the "where this comes from" line. The visual minimums per chapter are listed in 9.9; treat them as floors, not targets.

### Cover

"Neogogy Human Advantage Assessment. Organisational AI Readiness and Human Advantage Report." Prepared for {organisation}; respondents N; assessment window; personas present with counts; attempts rule in one line; exclusions if any; powered by ICAN and Neogogy; the partnership strip with the current LifeX logo. One line under the title: "Chapter 1 gives the answer in a page. Chapter 2 explains any term you meet later." One line in small type stating the endpoint: capability strengthened through intelligent use of AI, not maximum use.

### Chapter 1. The executive answer (level 6, read in 60 seconds)

The scorecard: eight to twelve cards, each a large figure, a short label, and one sentence of meaning.

1. Workforce position: centre stage and median index, with the stage's business meaning.
2. Healthy adoption: k of N and pct, with the four criteria in small type.
3. Future readiness: median, band, one sentence.
4. Judgment: median, band, one sentence.
5. Independent capability: median, band, one sentence.
6. Better thinking, not only faster: median, band, one sentence.
7. Which way the workforce leans: three counts and the response that leads.
8. Near-term mobility: k of N close to their next stage.
9. Most common bottleneck: dimension and count.
10. Greatest existing strength: dimension and strong count.
11. Most important development need: dimension or practice and reach.
12. Workforce consistency: high, moderate, or low, with the polarised count.
13. Calibration: k of N who see their state about right.

Then the executive story (generated, 6.3), the exposure line (counts at or below 45 on the three governance dimensions with their exposure labels), and the closing box: **If you do only three things next, do these.** Three actions drawn from the priority matrix (chapter 17), each with reach and the metric expected to move. When segments are withheld because the group is small, the story points to chapters 12 and 15 rather than to the segment page.

### Chapter 2. How to read the numbers (support)

The reading guide (section 7), with the band ruler, the example median illustration, the range-component legend from 9.3, and a small route diagram.

### Chapter 3. Your workforce on the AI readiness journey (level 1)

**Visual 3a. The journey.** The flagship continuum. All ten stages, horizontal or as the ascending route from the individual report. For every stage: number, name, one-line description (canonical copy), count, pct, a density mark (one anonymous dot per person stacked at the camp, or a bar at large N), its relation to the median (below, at, above), the count estimated movable to the next stage under existing rules, and the major gate preventing movement where one applies. The median marker sits at its exact index position, not at the middle of a stage. Q1 and Q3 markers where statistically appropriate. In HTML the route draws itself and the marker travels from 0 to the median; static in PDF.

**Visual 3b. The middle person on the ruler.** The standard range component (9.3) for the index, with stage boundaries marked along it.

**Table 3c. The ten stages and what each means for a business.** All ten rows, always; rows present highlighted with counts. Columns: stage; what it looks like (canonical); what it means for your business; what people here need next; the gate that opens the next stage (section 13.1).

**Copy.** The workforce-shape narrative, the median sentence, the reach sentence, the workforce-consistency translation, and "what the next stage requires" for the centre stage.

### Chapter 4. Which way your workforce leans (levels 1 and 4)

**Visual 4a.** Diverging bar: towards disconnection on the left, balanced in the centre, towards dependence on the right, counts and pct, with the response named under each side.

**Visual 4b.** The two readings behind it, as reversed range components with "lower is healthier" in bold: underexposure and the dependency index.

**Copy.** The lean sentence; the note that a person using little AI by choice with capability intact is counted as deliberately selective, not as underexposed; and why the two conditions need opposite responses. This chapter decides which programme runs first.

### Chapter 5. AI readiness against human protection (levels 2 and 3, flagship)

**Visual 5a.** The two-by-two from 5.6: capability and readiness across, protection up. Counts and pct in each cell, each cell titled and subtitled with its organisational response (13.7). Density behind the cells only at N of 10 or more and only if privacy code permits.

**Copy.** "The objective is not maximum AI use. The objective is increasing capability while preserving human judgment, agency, and independent capability." Then the reading of where the workforce sits, cell by cell, and the response that leads.

### Chapter 6. The ten human advantage dimensions (levels 2 and 3)

**Visual 6a. The workforce heatmap.** Ten rows (executive names, canonical in small type), grouped by cluster: judgment and protection (Decision Ownership, Checking Before You Act, The Line You Hold); capability that lasts (Independent Capability, What You Keep, Craft That Still Grows); fluency and growth (Practical AI Fluency, Better Thinking Not Only Faster, Deliberate Practice, Your Own Voice). Columns: median; strong pct; developing pct; watch pct; vulnerable pct; spread (middle-half width); polarised; priority (from the priority score). Visual cells, colour with labels. A CEO glances at this page and sees where the organisation is strong, where most people are developing, where vulnerabilities exist, where the workforce is divided, and what deserves intervention first. Optional: a ten-spoke radar of the median with the 45 and 65 reference rings, only if it adds to the heatmap; the heatmap is primary.

**Visual 6b. One card per dimension** (two per print page, ordered worst first within cluster). Each card: executive name and canonical name; cluster; the range component; the band split as a stacked bar (strong, developing, watch counts) with the vulnerability count called out beside it; a polarised badge with the two-populations sentence when flagged; a preliminary note when a notable share is preliminary; the change from the prior wave when comparable; the four explanatory blocks (what this measures; what your workforce is telling you; why this matters to the business, from 13.2; what management should do, from the practice library); a "who to read" line giving the count of individual reports at or below 45.

**Copy.** Each cluster opens with two sentences on why these dimensions belong together for an employer.

### Chapter 7. Six questions every AI-enabled organisation should ask (levels 2 and 3)

One block per composite, each titled with the question, each using the range component (not a gauge), with "lower is healthier" in bold and reversed direction for the last two:

1. Are our people ready for what is coming? (future readiness)
2. Is AI making our people think better, or only work faster? (augmentation)
3. Can our people judge AI output safely? (judgment)
4. Is AI-assisted work becoming human capability? (capability transfer)
5. How dependent is our workforce becoming? (dependency index, lower is healthier)
6. Are people getting enough meaningful AI practice? (underexposure, lower is healthier)

Under each: median, middle half, band counts, the plain answer for the band (13.3), the business implication, and the management action.

### Chapter 8. AI use against actual capability (level 4)

**Visual 8a.** Quadrant: capable and using it; capable but using little; using heavily, capability thin; early on both. Count, pct, definition, organisational meaning, and management response in each cell. The deliberately-selective count printed beside "capable but using little" as a separate finding.

**Visual 8b.** Reported use distribution.

**Copy.** The heavy-use, thin-capability cell gets the sentence: "This is not an adoption problem. These people are already using AI. The organisational problem is that capability and safeguards have not caught up with usage."

### Chapter 9. Are AI skills developing faster than AI judgment? (level 3)

**Visual 9a.** Quadrant: fluent and protected; fluent and unprotected; fluent, unprotected, and watch (highlighted as the group to act on first); not yet fluent. Counts and pct.

**Copy.** A high-use, high-fluency workforce with weak checking or judgment can look advanced while carrying hidden exposure. Fluency without judgment is the combination this instrument exists to catch. Judgment work, not tool training, for the unprotected cells.

### Chapter 10. What your workforce is already doing well (level 2)

The report must not read as a deficit report. Aggregate: dimensions with the highest strong pct; help patterns most frequently fired; practices already working (progress indicators met where recorded); pct with strong judgment; pct with strong responsible use; pct with strong independent capability; pct in healthy adoption; pct capable and using AI effectively. For every strength, four lines: **signal, why it matters, what to preserve, how to scale it.** Strengths are what the rest is built on and the thing most likely to be assumed rather than maintained.

### Chapter 11. Risks and vulnerabilities to address (level 3)

Aggregate: counts at or below the vulnerability line per dimension; watch patterns; fluent but unprotected; dependence concerns; thin checking; low decision ownership; skill erosion; low transfer; underexposure; gates held; calibration problems; any other canonical risk signal. Rank organisational interventions, never employees, using the canonical priority levels (immediate, important, developmental) plus monitor.

**Visual 11a. Three exposure meters.** For The Line You Hold, Checking Before You Act, and Decision Ownership: a bar of the group with the segment at or below 45 highlighted and counted, labelled in business terms (confidential information, disclosure, keeping a person in the loop; unverified claims reaching client work, documents, or decisions; decisions that belong to a person being made by a tool, and accountability for them).

**Table 11b. The exposure register.** Rows: confidential information; unverified claims; delegated decisions; dependence; skill erosion. Columns: dimension; count at or below the line; the practice that addresses it; number of individual reports to open. No costs, no estimates. Do not catastrophise.

### Chapter 12. Your workforce is not one group (level 4)

**Visual 12a. How your workforce currently relates to AI.** The nine profiles as a three-by-three grid, all nine always shown, present ones with count and pct, absent ones muted. Each card: concise definition (canonical), organisational opportunity, organisational risk, developmental emphasis, first conversation (13.4). State plainly: profiles describe current patterns of AI practice, not fixed employee types.

**Visual 12b. Polarisation.** The dimensions flagged polarised, each with the two-populations sentence and, where privacy permits, the safe aggregate segment that explains the split. Management implication: segment development rather than averaging the workforce.

**Visual 12c. Developmental cohorts.** From 5.6: for each cohort, eligible count, pct, defining signals, primary developmental need, recommended practices, expected next-stage movement, recommended pathway (chapter 19). Cohorts below threshold merged or withheld, and the report says which.

**Visual 12d. Segments.** Every legitimate, privacy-safe field that exists (persona, reported use, and any organisation fields found in the audit): a mini dashboard per shown segment (people, centre stage, median, lean, top vulnerability, widest-reaching practice). For each withheld cut: the plain reason and how many more respondents that cut needs before it can appear.

**Copy.** Whether one-size-fits-all AI training would work here, and why.

### Chapter 13. What employees say against what they do (level 3)

**Visual 13a. Stated practice against situational behaviour.** A mirrored bar per dimension: aligned; healthier in situations than in self-description; weaker in situations than in self-description; with magnitude where the data carries it. The dimensions with the largest group discrepancies highlighted.

**Copy.** "This does not mean respondents are dishonest. It shows where stated beliefs and practical responses diverge. Culture is expressed in behaviour, not only intention." Left side: standards people hold and do not credit themselves for; name and recognise them. Right side: practices people describe and do not keep under pressure; training here must use situations and practice, because self-report is already generous.

### Chapter 14. Does the workforce know where it stands? (level 3)

**Visual 14a.** Feel against measure: feels healthier than measured; about right; feels less healthy. **Visual 14b.** Prediction: exact; within one band; further off.

**Copy.** An overestimation cluster may indicate hidden exposure because confidence is outpacing practice, and such a group will not seek training on its own. An underestimation cluster may indicate capability that employees or managers do not recognise. A well-calibrated group usually allows more self-directed development. Do not overclaim causality.

### Chapter 15. What is preventing your workforce from moving forward? (level 5)

**Visual 15a. The bottleneck.** A bar per dimension: how many people have it as the constraint that most limits their next step. Under it: a bottleneck is the dimension doing most to hold a person's position, which is not always their lowest number. The tallest bar is where a training budget goes first.

**Visual 15b. The gate funnel.** Stage potential at the top, then each gate in the order the code applies them (fluency, verification, agency, independent capability, responsible use, transfer, or whatever the canonical order is), then the next stage. For each gate: dimension, count held, pct, current median, required threshold, gap, count close to clearing, recommended practice, organisational response.

### Chapter 16. How much of the workforce can move next? (levels 5 and 6)

**Visual 16a. Stage by stage.** For every stage present: current headcount, immediately movable, gate constrained, development required, likely next stage, the blocker, the next-stage requirement, the development intervention (from next-stage actions). Movement arrows from current to next stage, animated in HTML.

**Copy.** The near-term mobility sentence. Conditions stated. No promise.

### Chapter 17. Where should we invest first? (level 6)

**Visual 17a. The priority matrix.** Reach across, importance up, bubble size from the priority score (5.6). Four regions: act now, target, scale, monitor. Each bubble is a practice or intervention, never a person.

**Copy.** The three actions carried to chapter 1, with reach and the metric expected to move.

### Chapter 18. The development portfolio (level 6)

Every practice given to anyone in the group, aggregated and grouped by theme (fluency, judgment, agency, verification, independence, transfer, amplification, skill preservation, responsible use, creativity, adaptability). For each practice: people affected and pct; urgency (canonical priority); dimension addressed; stages it can unlock; expected behaviour change; progress indicator; watch-for warning. State once: nothing here is new advice written for a group; every practice was given to people inside this group by their own report. This chapter is the L&D curriculum brief.

### Chapter 19. Training architecture (level 6)

Map the portfolio and the cohorts onto six tiers, so the employer knows what kind of programme to build: foundational (safe and effective AI use); practitioner (real workflow fluency); critical (verification, judgment, decision ownership); human advantage (transfer, skill preservation, agency); strategic (cognitive amplification, workflow redesign); adaptive (continuous experimentation and renewal). For each tier: the cohorts it serves, headcount, the practices it carries, the gates it opens. Keep it programme-agnostic; a LifeX Enterprise Academy pathway can be attached later as a module.

### Chapter 20. The 90-day workforce development plan (level 6)

**Visual 20a.** Three bands. Days 1 to 30: the highest-frequency immediate needs, low-friction behaviour changes, foundational practices, one comparison task per person. Days 31 to 60: deliberate practice, workflow experiments, verification routines, human and AI role allocation, skill preservation. Days 61 to 90: deeper transfer, workflow redesign, the most-held gate, retake, measurement of movement.

Each action carries: priority; affected pct; recommended action; why; owner (blank field); target date (blank field); leading indicator; the assessment metric expected to move. Say plainly that the counts are what the assessment supplies and the rest is the organisation's to set. Close with: movement on this continuum comes from changed habits rather than changed intentions, and shows up first in situational answers.

### Chapter 21. What to measure next (support)

Keep the existing list and present it as the next measurement layer, module by module, with one sentence each on what it would add: AI value (task time, quality, rework, throughput); human capability retention (assisted against unaided matched tasks, delayed recall, repeatability, transfer); governance (verification coverage, disclosure, sign-off, incidents); economic value (licences, training, time saved, rework cost, incident cost, net task value); organisational conditions (training exposure, manager support, safety around experimentation, AI access, policy clarity); intervention effectiveness (baseline, intervention, retake, stage and dimension movement, practice adoption). Nothing estimated. Architect extension points for these modules; introduce no fake values.

### Chapter 22. Retake and movement, or "This is your baseline" (level 6)

Per section 5.8.

### Appendix

Method; the four versions and the comparability rule; the band table drawn as four classifications; directionality and the display transform for Independent Capability; the two names that are not the same thing (Dependency Risk the dimension, dependency index the composite); the lean rule; the readiness-against-protection cell definitions; the cohort rule; the priority score; healthy adoption; the attempts rule; sample and privacy limits; the spread measure with thresholds; glossary; the two disclaimers verbatim; "Want to learn more: lifex.ph". Technical detail lives here, not in the executive chapters.

---

## 9. The visual system

### 9.1 Feel

A premium strategy-consulting report combined with a modern people-analytics dashboard: large data visualisation, clear visual hierarchy, whitespace, cards, progress bars, distributions, range plots, heatmaps, matrices, stage maps, funnels, cohort visuals, movement arrows, callout boxes, annotated graphs. Avoid pages of raw numbers, tiny typography, decorative charts, stock imagery, gauges, radar as a default, and any chart that needs specialist knowledge to read. Ink-light in print: hairline rules, whitespace, colour as accent, minimal solid fills.

### 9.2 Semantic palette

Reuse the platform's design tokens. Chrome (headings, rules, footers) stays in the LifeX identity (burgundy and deep red, cream, gold, white, black). Reading semantics are separate from chrome so that a burgundy heading is never read as a warning:

- brick or deep red: vulnerability or immediate risk (distinct in value from the chrome burgundy, and always with an icon or label)
- warm amber: developing, needs attention
- gold: gates, transition, movement
- teal: healthy, strong
- deep blue-green: mature capability
- neutral grey or taupe: context, ranges, background

WCAG AA contrast on cream; colour-blind safe; every meaning also carried by a label, pattern, or icon. Consistent across every report the platform produces.

### 9.3 The range component (reusable, used for index, dimensions, composites)

```
watch            developing                      strength
0 ------------ 40 ---------------------------- 65 ------------ 100
                    45 (vulnerability line, dashed)

          |-------------- full observed range --------------|
                  [========== middle 50% ==========]
                                 ●
                              median
```

Threshold lines always drawn; the vulnerability line drawn separately from the band boundaries so that the four classifications are never conflated. For reversed metrics the axis is drawn from healthy on the left to concern on the right with "lower is healthier" in bold beside the chart, or the metric is displayed through its positive counterpart with the transform named; whichever is chosen is used consistently, and canonical values are never altered. In HTML the range appears first, then the middle half, then the median marker.

### 9.4 Chart types by chapter

| Chapter | Components |
|---|---|
| 1 | Scorecard cards; story panel; exposure line; three-things box |
| 2 | Band ruler; example median dots; range-component legend; mini route |
| 3 | Journey continuum with density and markers; range component with stage boundaries; ten-stage table |
| 4 | Diverging bar; two reversed range components |
| 5 | Two-by-two with counts (density behind at large N) |
| 6 | Heatmap; per-dimension cards (range component, stacked band bar, badges); optional radar |
| 7 | Six range components with question titles |
| 8 | Quadrant; use bar |
| 9 | Quadrant with highlighted cell |
| 10 | Strength cards |
| 11 | Exposure meters; register table; ranked intervention list |
| 12 | Profile grid; polarisation list; cohort cards; segment mini dashboards or withheld notices |
| 13 | Mirrored bar per dimension |
| 14 | Two diverging bars |
| 15 | Bottleneck bar; gate funnel |
| 16 | Stage-by-stage table with movement arrows |
| 17 | Bubble priority matrix |
| 18 | Grouped practice cards with reach bars |
| 19 | Tier ladder with cohort mapping |
| 20 | Three-band timeline with action rows |
| 21 | Module list |
| 22 | Wave comparison (paired range components, movement arrows) or baseline panel |

### 9.5 Labelling

Chart titles are plain sentences that state the finding ("Most of your people are at stage 5"), not variable names. Axes labelled in words. Counts printed on bars. Legends only for multi-series charts. Every chart has alt text stating the finding in one sentence. No more than one decimal anywhere in the body; none on counts.

### 9.6 Animation (HTML only)

Restrained, 400 to 900 milliseconds, meaning-bearing, never delaying access to information, honouring `prefers-reduced-motion` by rendering the final state immediately: the continuum marker travels from 0 to the median; bars grow; person dots settle into stage positions; range then middle half then median; quadrant counts scale in; heatmap cells reveal progressively; movement arrows draw from current to next stage. Hover definitions for every reading-guide term. A count-and-percent toggle. Stage rows and dimension cards expand. A print control. No hover values on person dots. No external network calls at render time (fonts and assets bundled).

### 9.7 PDF

Static; no animation artefacts; no hidden UI controls; no scrollbars; nothing that needs a tooltip (anything shown only on hover in HTML is printed visibly). No clipped charts; no chart split across pages; no orphan headings; no empty or half-empty pages (re-flow to pair a short block with the next rather than push it); consistent margins; full page width; page numbers; running footer "{organisation} · Neogogy Human Advantage Assessment · page x of y"; vector graphics; print-safe colours; readable at 100%. Support the platform's current page size and make Letter and A4 both render cleanly.

### 9.8 Accessibility

Contrast at AA for text and band colours. Alt text as above. DOM reading order matches visual order. Colour never carries meaning alone.

### 9.9 Visual minimums per chapter (floors, not targets)

| Chapter | Minimum visual elements |
|---|---|
| Cover and visual contents | Logo strip; chapter thumbnails with reading times |
| 1 Executive answer | Twelve scorecard cards with icons and band pills; exposure line with three mini meters; three-things box |
| 2 How to read | Band ruler; median illustration; range-component legend; mini route; icon key for the ten dimensions |
| 3 Journey | Continuum with density and markers; range component; ten-stage table with stage badges and count bars |
| 4 Lean | Diverging bar; two reversed range components; a two-panel "what each side needs" illustration |
| 5 Readiness against protection | Quadrant with counts and response labels; one callout per cell |
| 6 Ten dimensions | Heatmap; ten cards each with range component, stacked band bar, icon, and badges |
| 7 Six questions | Six range components with band pills |
| 8 Use against capability | Quadrant; use bar |
| 9 Fluency against protection | Quadrant with highlighted cell |
| 10 Strengths | One card per strength with icon and a "scale it" arrow |
| 11 Risks | Three exposure meters; register table with in-cell bars; ranked intervention list with priority pills |
| 12 Not one group | Nine-profile grid; polarisation list with two-population bars; cohort cards with headcount bars; segment mini dashboards or withheld notices |
| 13 Say against do | Mirrored bar per dimension with the largest gaps annotated |
| 14 Calibration | Two diverging bars |
| 15 Bottlenecks | Bottleneck bar; gate funnel with gap markers |
| 16 Mobility | Stage-by-stage table with movement arrows and headcount bars |
| 17 Priorities | Bubble matrix with four labelled regions |
| 18 Portfolio | Practice cards grouped by theme with reach bars and priority pills |
| 19 Training architecture | Tier ladder with cohort mapping and headcounts |
| 20 90-day plan | Three-band timeline; action rows with priority pills and metric-to-move tags |
| 21 What to measure next | Module cards, visibly marked "not collected yet" |
| 22 Retake or baseline | Paired range components with movement arrows, or the baseline panel with a "what next wave shows" illustration |

### 9.10 Callouts and annotations

Callouts are short (under twelve words), placed on or beside the chart with a leader line to the element they describe, drawn in the neutral ink colour with the band colour only on the marker. Use them for: the median ("the middle person"), the largest cell or bar, the vulnerability count, the gate that holds the most people, and any figure carried to chapter 1. One callout per finding; never more than four per chart.

### 9.11 Placement of explanations

The four explanatory blocks sit beneath their chart in the same column, with a hairline rule above them and the fixed labels in bold. The chart and its blocks are one layout unit that never splits across pages in PDF and never separates on scroll in HTML. When a chart is wide, the blocks run in two columns beneath it rather than on a following page.

---

## 10. Engineering requirements and tests

- **One adapter, one aggregate object** (5.3), documented in `03-model.md`; suppression inside the adapter; no data logic in templates.
- **One dictionary** (5.2) consumed by every component; no local terminology.
- **Copy from the library** keyed by ID, so a change to the individual report's wording flows here; new entries from section 13 added under named keys, never hard-coded in templates.
- **Components** as in 9.4, each taking plain data and a mode flag (interactive or print), rendering inline SVG so the print pipeline needs no browser-only libraries; reuse the platform's charting library only if it prints reliably, and say so in the plan.
- **Feature flag** `organisationReport.v2` (or the platform's convention), off by default; the admin view offers both during transition.
- **Localisation-ready**; every string in the string table.
- **Performance** comfortable at 500 respondents and acceptable at 5,000; the design cohort is 50.
- **Extension points** for the future measurement modules (chapter 21), with no placeholder values.

**Test suite (phase 3, before UI).** Median and quartiles correct (odd and even N); percentages correct and rounded; stage counts sum to N; band counts sum to N per dimension; the four classifications applied independently (42 is developing and vulnerable; 38 is watch and vulnerable; 50 is developing only); reversed metrics handled correctly with boundary cases at 0, 39.9, 40, 44.9, 45, 64.9, 65, 100; Independent Capability and dependency index directionality; healthy adoption and blocker distribution; polarised detection; lean counts against the platform's rule; readiness-against-protection cell assignment; use-against-capability and fluency-against-protection cells; profile counts; help and watch pattern counts; calibration and prediction bands; said-against-chosen counts and magnitudes; bottleneck and gate aggregation; movable and mobility; practice reach and portfolio grouping; cohort assignment (exactly one primary cohort per person; merged or withheld below threshold); priority score; workforce-shape narrative selection; every sentence template with the worked example (6.4); segment threshold, sensitive-cut threshold, remainder rule; suppressed groups absent from the aggregate object, DOM, exports, API, PDF text and metadata; historical comparison only across matching versions; attempts rule; Business Owner exclusion where applicable; no em-dash or en-dash in any rendered output; no per-person row in any output; a rendering test asserting no block split and no empty page.

---

## 11. QA cohorts (phase 9) and visual QA (phase 10)

Render both modes for N of 1, 6, 7, 8, 10, 29, 30, 100, and 1,000 or more (synthetic where needed, with fixed seeds). Also construct synthetic cohorts with: universally strong scores; universally weak scores; extreme polarisation on several dimensions; high use with low protection; low use with high capability; high dependence; high underexposure; no fired patterns; many fired patterns; every stage represented; all readings preliminary on one dimension; said-against-chosen absent; mixed personas including Business Owner; a version mismatch across respondents; a prior comparable wave with improvement; a prior wave with decline; a prior wave with mismatched versions.

Then render the complete Life College sample and inspect every page as an image. Run the flip test from 2.5 and record the result. Look for pages without a visual, charts without callouts, explanations separated from their chart, clipping, tiny labels, awkward page breaks, excessive whitespace, confusing chart direction, charts without interpretation, bad contrast, misalignment, repeated text, excessive decimals, unexplained statistics, dashes, all-caps, and privacy leaks. Record findings and fixes in `02-verification.md`.

---

## 12. Acceptance checklist

Record each item with a page reference and a screenshot.

1. Every chapter in section 8 present, in order; deviations approved in the plan.
2. Every significant chart carries the four explanatory blocks with the fixed labels; no orphaned statistic.
3. The band ruler with the separate vulnerability line appears under every scored chart; the four classifications are never conflated.
4. Executive names used everywhere in the body; canonical names in small type on cards and in the appendix; Independent Capability the only display name for the reliance construct; no report component defines its own terminology.
5. Reversed metrics marked "lower is healthier" in bold with reversed visual direction; no canonical value altered.
6. No em-dash or en-dash in rendered HTML, PDF text layer, labels, or alt text (grep the outputs); no all-caps emphasis.
7. Counts accompany every percentage; no false precision; density responds to N per 5.7.
8. No individual score readable from any chart below 10 respondents; no hover values on dots at any N; nothing suppressed present in DOM, exports, API, or PDF metadata.
9. Segments withheld correctly at N of 8, shown correctly at 35 and 120; remainder rule holds; withheld notices state how many more respondents are needed.
10. No confidence intervals or correlations below 30.
11. Every "not collected yet" state renders plainly with no estimates; chapter 21 introduces no values.
12. The journey shows all ten stages with counts, pct, median marker at its exact index, movable counts, and gates.
13. The heatmap page lets a reader see strengths, developing areas, vulnerabilities, divisions, and first priority at a glance.
14. The readiness-against-protection map, the use-against-capability quadrant, and the fluency-against-protection quadrant reconcile to per-person data by hand on the 8-person cohort.
15. Lean, healthy-adoption blockers, cohorts, bottlenecks, gates, mobility, said-against-chosen, calibration, and priorities reconcile by hand on the 8-person cohort.
16. All nine profiles shown, absent ones muted; the "patterns, not types" statement present.
17. The strengths chapter is present and non-empty whenever any strength exists.
18. The worked example (6.4) renders exactly; the executive story is generated, not hard-coded.
19. PDF: no block split; no empty or half-empty pages; full width; page numbers and running footer; Letter and A4 clean; vector; nothing tooltip-dependent.
20. HTML: animations within 400 to 900 ms; reduced-motion respected; hover definitions; count-and-percent toggle; print control; no external calls.
21. Alt text on every chart, stating the finding; contrast at AA.
22. Disclaimers verbatim.
23. Current LifeX logo in every placement, including the partnership strip; tagline not repeated as separate text.
24. Feature flag off by default; old report still renders with the flag off.
25. Version-mismatch cohort produces the warning and no comparison; fewer-than-3 cohort produces the notice, not a report; baseline state renders when no prior wave exists.
26. `00-audit.md`, `01-plan.md`, `02-verification.md`, `03-model.md`, and `data-dictionary.md` exist and are current.
27. No page in chapters 1 to 22 without a visual element; visual area at least a third of every executive page and about half on average (measure on the rendered PDF).
28. Every chapter opens with the strip (question, answer, key figure, mini visual), closes with the one-line box, and carries the "where this comes from" line.
29. Every chart carries at least one callout pointing at its finding, and no more than four.
30. Every chart's four explanatory blocks sit beneath it on the same page and in the same column.
31. The visual table of contents is present with reading times and thumbnails.
32. The visual minimums in 9.9 are met for every chapter.
33. The flip test (2.5, item 12) is passed on the Life College sample and recorded in `02-verification.md` with the reader's one-paragraph account.

---

## 13. Copy library additions (drafts to reconcile with canonical copy)

Where the platform holds canonical wording (stage descriptions, dimension "what it measures", profile descriptions, patterns), the canonical wording wins and these drafts supply only the business layer. Keep every entry short. Never hard-code any of it in a template.

### 13.1 The ten stages: what each means for a business

| Stage | What it looks like | What it means for your business | What people here need next |
|---|---|---|---|
| 1. AI Detached | No meaningful use of AI in the work. | Nothing is being exposed through tools, and nothing is being formed either. If the role is moving towards assisted work, this person is not yet on the route. | A safe, bounded first task with a colleague alongside. |
| 2. AI Aware | Knows the tools exist and holds views about them; use is rare or second-hand. | Views about AI are being formed without practice behind them, which can shape team opinion in either direction. | One real task, taken end to end. |
| 3. AI Curious | Tries things occasionally; no routine. | Interest is present; output quality varies from task to task. | A few recurring tasks with a stated standard to judge results against. |
| 4. AI Exploring | Regular experimentation; use is broad but evaluation and boundaries are thin. | Use has grown faster than checking. This is the stage where an unverified claim or an unconsidered upload is likeliest to reach a client, a document, or a decision. | Verification and boundary habits taught alongside continued practice, not instead of it. |
| 5. AI Functional | AI reliably completes real tasks; judgment and independence are developing. | Dependable for routine assisted work. Consequential outputs still want a second look. | Unaided comparisons, and clear rules about where AI is and is not used. |
| 6. AI Integrating | AI is part of the regular workflow, and what is learned with it can be reconstructed without it. | Can be trusted with assisted work of consequence, and can show others how. | Deliberate allocation of roles between human and AI, and opportunities to teach. |
| 7. AI Strategic | Decides what stays human and what goes to AI, and can say why. | Can design how a team uses AI. A candidate for leading AI practice internally. | Whole-workflow redesign, and proof that insight transfers to settings with no AI present. |
| 8. AI Augmented | Whole workflows redesigned around human and AI roles; output and capability rise together. | A multiplier. Can set the organisation's standards for assisted work. | Scope to redesign further, and a review cycle so the practice keeps renewing. |
| 9. AI Adaptive | Practice renews itself as the tools change; habits are reviewed on a cycle. | Resilient to tool churn. This person's routine will not be stranded when a tool changes. | Room to run experiments and share what they learn. |
| 10. Future-ready / Generative | Mature, self-renewing practice that produces new methods and passes them on. | The reference point for the organisation. | To be asked to teach. |

Stages 6 to 10 are drafted from the stage names and next-stage actions in the reports; reconcile with the canonical stage copy before use.

### 13.2 The ten dimensions: business meaning and band copy

| Executive name (canonical) | Why this matters to the business | Band copy: strength / developing / watch |
|---|---|---|
| Decision Ownership (Human Agency) | Who makes the final call. When this is low across a group, decisions that belong to your people are being made by tools; the output can look fine while the capacity to defend it stops developing. Accountability for client work and institutional documents sits here. | Decisions stay with the person and can be defended / The tool sometimes decides, and people cannot always say why they accepted its suggestion / Decisions are routinely delegated; treat accountability as an open question |
| Checking Before You Act (Verification and Judgment) | Whether claims get checked before they are acted on. The costly errors are the plausible ones, and a group that checks only when something feels off misses exactly those. | Claims are confirmed somewhere the tool did not supply / Checking happens when something feels off / Unverified claims are reaching real work |
| The Line You Hold (Responsible Use) | Boundaries people actually keep: what never goes into a tool, what is disclosed, where a person is chosen over a system. The capability with the closest tie to legal and reputational exposure. | Boundaries can be stated and are kept / Boundaries exist but bend under time pressure / Treat confidential information and disclosure as an open exposure |
| Independent Capability (100 minus Dependency Risk) | What remains on the week the tool is unavailable, changes, or is withdrawn. Continuity, skill retention, and succession depend on it. | Work survives without the tool / Some outputs would be hard to reproduce unaided / A large part of output depends on the tool |
| What You Keep (Learning Transfer) | Whether assisted work becomes capability people carry. This decides whether training investment compounds or has to be repeated. | Methods can be run without the tool or notes / The shape of a method is retained but the tool is needed to run it / Assisted work is not becoming owned capability |
| Craft That Still Grows (Skill Growth) | Whether underlying skills are still developing under AI support or quietly being handed over. Bench strength over years, not weeks. | Skills are growing alongside the tool / Some skills are being handed over without a decision / Skills are weakening and nobody has named which ones |
| Practical AI Fluency (AI Fluency) | Shaping a request, supplying context, breaking a task down, iterating on a weak answer. The difference between AI that saves time and AI that generates rework, and among the more trainable gaps in the set. | Use is skilled and adaptive / Use is narrow and repeated / Little real use; the skills gap is plain and closable |
| Better Thinking, Not Only Faster (Cognitive Amplification) | Whether AI widens thinking or only speeds up production. This decides whether AI is improving your decisions or accelerating the same ones. | AI changes what people think, not only how fast / Some sessions widen thinking; most only speed output / AI is a faster route to unchanged thinking |
| Deliberate Practice (Adaptive Growth) | Whether habits are reviewed as tools change or the first workflow that worked has simply persisted. Resilience to tool churn lives here. | Habits are on a review cycle / Adaptation happens when a problem becomes obvious / Routines are unexamined and a step behind the tools |
| Your Own Voice (Creative Leverage) | Whether people's own ideas lead and the tool extends them, or the tool's first suggestion becomes the shape of the work. Over time, whether your work still sounds like your organisation. | Ideas lead and the tool stretches them / The tool sometimes supplies the shape / The tool's first suggestion is becoming the work |

### 13.3 The six questions: plain answers by band

For the first four, bands run strength (65 or above), developing (40 to 64.9), watch (below 40). For the last two, lower is healthier: use the composite cut-points in the scoring code; if none exist, mirror the band table and say so in the appendix.

- **Are our people ready for what is coming?** Strength: skilled with the tools and the skills travel; the task is keeping them current. Developing: skills are forming but rest on limited practice; steady real practice moves this. Watch: little real practice yet; the risk runs towards being outpaced, not towards misuse.
- **Is AI making our people think better, or only work faster?** Strength: AI is changing what people think, not only how quickly they produce. Developing: some sessions widen thinking; most only speed output. Watch: AI is a faster way to produce the same thinking; the three thinking-partner prompts are the lever.
- **Can our people judge AI output safely?** Strength: claims get checked, decisions stay owned, boundaries hold. Developing: checking happens when something feels off, which misses the plausible errors. Watch: unverified claims and delegated decisions are likely reaching real work.
- **Is AI-assisted work becoming human capability?** Strength: what people do with AI is becoming something they can do without it. Developing: the shape of methods is retained; the tool or notes are still needed to run them. Watch: assisted work is not becoming owned capability, and training will not compound until it does.
- **How dependent is our workforce becoming?** (lower is healthier) Healthy: most of what your people produce would survive a week without the tool. Developing: some outputs would be hard to reproduce unaided; keep one recurring task tool-free. Concern: a large part of output depends on the tool; continuity and skill retention are at risk.
- **Are people getting enough meaningful AI practice?** (lower is healthier) Healthy: people have real practice behind their views. Developing: practice is uneven across the group. Concern: little hands-on practice; the response is deliberate practice, not more caution.

### 13.4 The nine profiles: opportunity, risk, emphasis, first conversation

Pull all nine names and descriptions from the library and complete the five not drafted here in the same shape.

- **The Hesitant Starter.** Early, uncertain, largely unformed habits. Opportunity: no bad habits to unlearn. Risk: being outpaced. Emphasis: practical fluency. First conversation: one small, real task with a colleague alongside; not a policy briefing.
- **The Curious Explorer.** Trying things, no routine, boundaries thin. Opportunity: energy to channel. Risk: errors and uploads passing unchecked. Emphasis: checking and boundaries alongside continued practice. First conversation: recurring tasks with a stated standard; do not read enthusiasm as judgment.
- **The Forming Practitioner.** Real tasks done reliably; judgment and independence still developing. Opportunity: dependable assisted output already. Risk: consequential outputs unreviewed. Emphasis: unaided comparisons and role allocation. First conversation: which decisions in this task are yours to make.
- **The Uncritical Consumer.** Heavy use, thin checking, ownership slipping. Opportunity: fluency already present. Risk: plausible errors and delegated decisions reaching real work. Emphasis: the two-source rule and the one-line reason for every accepted suggestion. First conversation: checking, before any more tool access.

### 13.5 Patterns: organisational responses

Enumerate every help and watch pattern in the library. For each: components that produce it, one-sentence description, one-sentence organisational response. Three are visible in the reports:

- **Future-readiness vulnerability.** Low use, low fluency, little experimentation together. Response: bounded, real practice on the person's own recurring tasks; nothing here says AI is harming them.
- **Creativity without ownership.** Creative range expanding while ownership weakens. Response: own concept first, then the tool; a deliberate change to every accepted suggestion.
- **Overconfidence risk.** Feels healthier than measured while checking is thin. Response: verify one claim expected to be correct each week, so checking is not reserved for doubts.

### 13.6 Cohorts and training tiers: draft descriptions

- **Foundations.** Needs practical fluency and safe exposure. Tier: foundational.
- **Fluency development.** Using AI, capabilities still inconsistent. Tier: practitioner.
- **Judgment and verification.** Already using AI, needs stronger critical evaluation and boundaries. Tier: critical.
- **Agency and independence.** Strong output may be hiding dependence or delegated decisions. Tier: human advantage.
- **Transfer and skill preservation.** Assisted work is not yet becoming owned capability; skills at risk of hand-over. Tier: human advantage.
- **Amplification and strategic use.** Needs to move from faster production to better reasoning and role allocation. Tier: strategic.
- **Advanced human-AI integration.** Ready for workflow redesign and teaching. Tiers: strategic and adaptive.

### 13.7 The readiness-against-protection cells

- **Scale and lead** (high capability, high protection). The strongest foundation for sophisticated AI-enabled work. Response: scale effective practices; use as peer exemplars; expose to advanced workflows; keep capability-retention safeguards.
- **Powerful but exposed** (high capability, low protection). Productive AI users whose checking, ownership, boundaries, or independence are not keeping pace. Response: not more tool training; judgment, verification, ownership, responsible use, and dependence protection first.
- **Protected but under-activated** (low capability, high protection). Healthy human foundations with thin practical fluency or exposure. Response: bounded practical experience on real work; do not read restraint as resistance.
- **Build the foundation** (low capability, low protection). Needs both skill and safeguards. Response: foundational training, structured practice, guardrails taught alongside fluency.

---

## 14. Final standard

Do not make the current report prettier. Transform it from "here are aggregated assessment scores" into an executive intelligence report that shows the current state of a workforce's relationship with AI, the human capabilities being strengthened or endangered, the different populations inside the workforce, the barriers preventing advancement, and the most efficient development path forward. A business owner who finishes it should feel: "I understand my workforce in a way I could not see before, and I know what to do next." That is the outcome.
