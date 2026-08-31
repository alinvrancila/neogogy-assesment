# Deliverables C through L: System Architecture

Everything below is implemented in `src/` and exercised by `tests/synthetic.ts`.

## C. Construct map (10 measured dimensions)

All scored 0 to 100, healthy is high internally. Weights are the developmental-index weights and live in `config.ts`.

| Construct | Weight | Measures | Notes |
|---|---|---|---|
| Human Agency | 0.14 | Authorship, final judgment, decision ownership | Gate dimension |
| Verification & Judgment | 0.13 | Checking, source discipline, calibrated trust | Gate dimension |
| Independent Capability | 0.12 | Unaided performance retained | Reported inverted as Dependency Risk; gate dimension |
| AI Fluency | 0.12 | Prompting, iteration, decomposition, tool adaptation | Gates stage 5+ (an "AI Functional" person must be functional) |
| Learning Transfer | 0.11 | Assisted work becomes durable human capability | Gates stage 8+ |
| Cognitive Amplification | 0.09 | AI improves the thinking itself | New in v2 (v1 never measured it) |
| Skill Growth | 0.09 | Foundational skills grow under AI support | New in v2 |
| Adaptive Growth | 0.08 | Habits audited and updated as tools change | |
| Responsible Use | 0.07 | Privacy, disclosure, honesty, relational balance | Gate dimension; absorbs v1 Integrity and Collaboration |
| Creative Leverage | 0.05 | Original ideation, voice, anti-homogenization | |

Composites (config-defined formulas, in `scoring.ts`): future readiness, augmentation, judgment, capability transfer, dependency index, underexposure. Composites never hide dimensions; both are always reported.

## D. Persona matrix

Four personas (student, teacher, parent, administrator), each assessed about themselves. Constructs are shared; every scenario, and nearly every claim and reverse item, is persona-authored around that persona's real life: exam rooms and group projects for students, observed lessons and student data for teachers, screen-time and family boundaries for parents, dashboards, vendors, and personnel files for administrators. Verified by test: no teacher prompt appears in the student bank.

## E and F. Question architecture and bank

Per persona: 10 constructs x (claim + reverse + scenario) = 30 items, all with behaviorally anchored options on scenarios (no shared response ladder; v1's single "engagement depth" ladder is gone). Shared across personas: 1 usage item, 2 unscored baselines (B1 desirability, B2 prediction), 3 outcome-change items with a "not enough experience" option, and adaptive branches: a low-use reason item at usage 2 or below, and two high-use probes (an outage-recall dependency scenario and an unchecked-acceptance frequency item) at usage 4 or above. Total per respondent: 36 to 38 scored screens plus baselines.

Item metadata (`types.ts` Item): id, persona, type, primary construct, secondary effects, prompt, options or scale, weight, risk signal, recommendation tags, consistency pair id, adaptive trigger, version. One answer can affect multiple constructs two ways: declared `secondary` weights, and per-option `effects` nudges on scenarios (for example, submitting an AI draft nearly as-is nudges Responsible Use down as well as scoring Agency low).

## G. Scoring model

1. Normalize each answer to healthy-is-high 1..5 (reverse items inverted; outcome value 0 excluded as N/A).
2. Weight: scenarios 1.6, outcomes 1.2, claims and reverses 1.0. A flagged consistency gap (claim minus scenario at least 2) halves that claim's weight.
3. Dimension score: weighted mean of all contributions mapped to 0..100; continuous.
4. Per-dimension confidence from evidence count, gap flags, and (for experiential constructs) usage level. Missing evidence lowers confidence; it never silently scores 50 as if measured.
5. No usage multiplier anywhere.

## H. Continuum

Continuous developmental index (weighted dimension mean) mapped to 10 stages: Detached, Aware, Curious, Exploring, Functional, Integrating, Strategic, Augmented, Adaptive, Future-Ready/Generative, each with early/established/transitioning substages and named transition requirements. Gating (§36): stages 5 and up require minimum floors on safety-critical dimensions (agency, verification, independent capability, responsible use, and transfer at the top; fluency floors from stage 5). A gated result reports both the earned index and the reason for the cap, and the gate becomes the bottleneck. Within three index points of a boundary, the placement is explicitly reported as a zone, not a verdict.

Maturity, not volume: an intentional selective low user with strong judgment reaches high stages; an uncritical daily user is gated out of them. Both directions are tested.

## I. Archetypes

Nine, pattern-derived, ordered, first match wins: Strategic Integrator, Grounded Selectivist, Augmented Thinker, Capable Traditionalist, Dependent Operator, Uncritical Consumer, Curious Explorer, Hesitant Starter, Forming Practitioner. The default (Forming Practitioner) explicitly tells the respondent that their dimension-level findings matter more than the label, rather than assigning them fabricated deficits.

## J. Results engine

`narrative.ts` renders the full report: executive profile with fingerprint, continuum position with borderline and gating notes, dimension signature with per-dimension confidence and gap notes, help and harm sections built from detected patterns with hedged language, honest strengths and vulnerabilities (empty when empty), self-knowledge (desirability plus B2 calibration), bottleneck, next stage with transition requirements, roadmap, and one self-experiment. Every conclusion traces to scores, patterns, or signals the respondent generated.

## K. Recommendation engine

Signal tag to recommendation mapping in `recommendations.ts` (13 entries plus a maintenance entry), each in the §41 shape. Assembly order: bottleneck recommendation first (skipped for saturated profiles), then risk signals by severity, capped at five, with a guaranteed exposure recommendation for underexposed low users and guaranteed maintenance-plus-mentorship for clean high profiles. No respondent is ever told they are simply fine with nothing to do, and no healthy respondent is handed manufactured alarm.

## L. Cross-dimensional pattern logic

Ten rules in `patterns.ts` implementing spec §19 (sophisticated augmentation, dependency, intentional selectivity, underexposure vulnerability, efficiency without learning, overconfidence, cautious-underleveraged, creativity without ownership, genuine amplification, erosion under success), each with a test predicate, hedged narrative, and evidence list.

---

## The Business Owner persona

Added as the fifth persona. It shares the engine completely: same construct ids,
same weights, same gates, same developmental index, same confidence and
calibration mechanics. What differs is the language, the item bank, and two
outputs no other persona produces.

**Items.** `src/items/business.ts` holds forty items, ten dimensions by four:
a claim, a true reverse, a scenario with five behaviourally anchored options, and
a business impact item carrying a value 0 "not enough experience to say" option
that is excluded from scoring. The three generic outcome items are withheld from
this persona, because they ask about a person's learning; the ten impact items
replace them. Shared items (usage, both baselines, the low-use reason, and the
two high-use probes) have business wordings selected by `SHARED_FOR(persona)` in
`scoring.ts`, keeping the same ids so a stored answer means the same thing.

**Display.** `src/engine/display.ts` holds `PERSONA_DISPLAY`, a per-persona map
of construct names and principles, construct content, stage names, stage detail,
archetype names and narratives, composite names, fingerprint labels, and a
disclaimer addition. Accessors (`constructName`, `constructContent`,
`stageName`, `reportedConstructName`, `compositeName`, `indexName`,
`archetypeDisplay`) fall back to the shared strings, which is why the four
original personas are byte-identical after the change. Every consumer, the
narrative, the results page, the PDF and the admin, reads through these
accessors rather than from `CONSTRUCTS` directly.

**Scoring changes, both persona-neutral.** `to100` now normalises by the item's
own top value, so a four anchor impact item scores out of its own scale rather
than out of five. `ItemOption` gained an optional `signals` array, so one
scenario option can expose more than one thing at once.

**Signals.** Twelve business tags in addition to the existing thirteen:
decision_abdication, customer_facing_unverified, single_point_of_failure,
vendor_lockin, shadow_ai_blindspot, data_leakage_risk, disclosure_gap,
pilot_without_metric, team_deskilling, brand_homogenization,
knowledge_not_captured, wrong_process_automation.

**Patterns.** The ten existing rules apply unchanged. Five business-only rules
are gated by a `personas` field on the rule: fragile_automation,
shadow_ai_blindspot, trust_exposure, pilot_theater (harm) and
advantaged_operator (help).

**Recommendations.** A parallel `BUSINESS_LIBRARY` covers every signal tag plus
maintain, selected when the persona is business. Same five field shape; the
practices are written to be schedulable by an owner without a compliance
department.

**Risk Register** (`src/engine/business.ts`). Derived from fired signals and harm
patterns: one entry per distinct exposure, each with an impact category
(financial, legal, reputational, operational, strategic), a hedged description,
the reading behind it, and the linked recommendation where one was chosen.
Ordered by severity then category. Empty for every other persona.

**Ninety day plan.** Sequences the chosen recommendations into three blocks, with
anything linked to a legal or financial exposure placed in days 1 to 30
regardless of its priority label. Each action carries its evidence-of-progress
line as a checkpoint. Empty for every other persona.

**Both new fields are on `CompassResult`** (`riskRegister`, `ninetyDayPlan`) and
are empty arrays for the other four personas, so no consumer has to branch to
read them.

---

## The Minister/Preacher persona

The sixth persona, and the first that is anonymous by construction.

**Items.** `src/items/pastor.ts`: forty items, ten dimensions by four, each
carrying `why` (what the question listens for) and `deeper` (one pointer to a
source or a passage). The `Item` type gained both fields plus `dependenceTags`;
other personas leave them empty. Shared items have preaching wordings, and two
unscored reflection prompts are asked after the last scored item.

**Dependence tags.** Recorded per answer, from the item and from the chosen
option, and never scored. `dependenceTags()` collects them; the test suite proves
scores are identical with and without them.

**Selectivity.** For this persona a settled conviction against AI in preaching
(low-use reason 3) counts alongside a considered decision (reason 1), and a
preacher with a formed position is never given exposure-first advice.

**Signals and patterns.** Twelve new tags. Five pastor-only patterns:
outsourced_pulpit, unverified_authority, presence_displacement, thinning_voice,
and the help pattern fed_shepherd.

**Dependence Check** (`src/engine/pastor.ts`). Three readings, built from the
dependence tags and the two reflection prompts, with a narrative for each and a
practice and a resource for the two that call for one. It is a mirror, not a
measure: it never touches stage, archetype, or score, and `CompassResult` carries
it as `dependenceCheck`.

**Formation Roadmap.** This week, this month, this season, each action carrying
its checkpoint and one resource pointer. Carried as `formationRoadmap`.

**Anonymity.** The browser computes the result and renders it. The PDF route
computes and returns a file and touches no storage. The submit route refuses this
persona outright rather than storing it. The admin carries a written note
explaining why, so the design is not improved away later.
