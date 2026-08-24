# The Neogogy Formation Compass — How the Assessment Works

**Version:** v0.1.2 · branch `feature/assessment-complexity` · this document supersedes the earlier spec.

**What this is:** a complete account of how the assessment reasons about a person — the design logic behind it, the exact mechanics, and a persona-by-persona breakdown of what each respondent actually receives. Every number in Parts II–IV was computed against the real scoring engine, not estimated.

**Who it is for:** hand this to Claude as full context on the current instrument. It is self-contained — no repository access required.

**Why it exists:** to make the depth, complexity and helpfulness of the assessment improvable with full knowledge of what is already there, what is load-bearing, and what only looks load-bearing.

---

# PART I — How the logic was built

## 1.1 The core thesis

Most AI-and-learning assessments measure a single quantity: *how much / how well do you use AI?* The Formation Compass is built on the claim that this is the wrong shape, because it collapses two things that move independently:

- Whether AI is **eroding** the person (their judgment, memory, attention, authorship)
- Whether AI is **preparing** the person (their fluency, transfer, adaptability)

The instrument's central bet is that these dissociate — that the most dangerous respondent is not the one scoring low on everything, but the one scoring *high on capability and low on protection* and therefore feeling successful while thinning out. Every layer of the design exists to make that specific dissociation visible.

Everything follows from this: the two axes, the 2×2, the four personas, the abstention penalty, and the illusion gap are all machinery for catching a person who would pass a one-dimensional test.

## 1.2 The four-layer derivation chain

The assessment is built as four stacked layers. Each answers a different question and each was added to catch a failure mode the layer below it cannot see.

```
Layer 4   GAPS          "Is the person's self-knowledge accurate?"
                        illusion gap · consistency gap
                                  ▲
Layer 3   ADJUSTMENT    "Is this score honestly earned?"
                        abstention damping
                                  ▲
Layer 2   AGGREGATION   "What is the shape of this person?"
                        dimension → axis → persona
                                  ▲
Layer 1   ITEMS         "What does the person report?"
                        claim · reverse · behaviour
```

### Layer 1 — the three-input triangulation

The most deliberate design choice in the instrument. Every dimension asks the same thing three different ways:

| Input | Form | What it is meant to catch |
|---|---|---|
| **Claim** (`_1`) | positively-worded, self-rating | The person's stated self-image |
| **Reverse** (`_2`) | negatively-worded, inverted at scoring | Acquiescence bias / straight-lining |
| **Behaviour** (`_s`) | situational scenario, "a real moment, not the ideal" | What actually happens under pressure |

The intent is triangulation: a person can inflate a self-rating, but doing so consistently across a positive claim, a negatively-worded trap, and a concrete situation is harder. The reverse item is the straight-lining detector; the scenario is the reality check. The claim-versus-behaviour difference is then harvested at Layer 4 as the consistency gap.

**This is the strongest idea in the instrument**, and Part IV shows it is also the most under-exploited — the three inputs are averaged together into one number, which discards exactly the disagreement they were designed to surface.

### Layer 2 — aggregation into a shape

Ten dimensions, five per axis, chosen so each axis is a balanced construct:

| Resilience (protected from harm) | Readiness (prepared for the future) |
|---|---|
| 1. Learning Agency ⚑ | 6. AI Fluency |
| 2. Attention Discipline | 7. Transfer To Real Tasks |
| 3. Critical Judgment ⚑ | 8. Creative Leverage |
| 4. Memory Formation | 9. Human Collaboration |
| 5. Integrity And Ownership ⚑ | 10. Adaptive Growth |

⚑ = **critical dimension**: can raise a standalone alarm regardless of the overall score. All three sit on the resilience axis — an asymmetry that encodes a value judgment (erosion is a graver failure than unpreparedness), though this is nowhere stated to the respondent.

The two axis scores are then crossed into a 2×2 to yield a persona. The persona, not the number, is the headline deliverable.

### Layer 3 — the anti-gaming adjustment

The design anticipates an obvious exploit: **you can score as "protected" by simply not using AI.** A person who never touches AI answers "never lets AI decide," "never accepts AI claims uncritically," and so on, and walks away with high resilience and a clean bill of health.

The abstention damping exists to close this. If reported usage is ≤ 2 ("Almost never" or "A few times a month"), readiness is multiplied by 0.55 or 0.72 respectively. The stated logic: *"avoiding AI is not the same as being safe"* — non-use protects resilience but leaves readiness unearned rather than genuinely high.

This is a real and defensible idea. Part IV shows the implementation is far more severe than the framing admits.

### Layer 4 — the gap layer

Two measures that score the person's *self-knowledge* rather than their behaviour:

- **The illusion gap** — B1 (how healthy this feels, asked before any questions) minus the measured band. Positive means it felt better than it measured. This operationalizes the instrument's most-cited research claim: better output makes us feel more capable while we quietly become less so.
- **The consistency gap** — the claim item minus the scenario answer, per dimension. Flagged at ≥ 2. Where intention and habit diverge.

Both are then rendered in the "blind spots, named" section, which is guaranteed non-empty: if nothing fires, a fallback block warns against complacency. **The instrument is designed never to tell anyone they are fine.**

## 1.3 What the design deliberately gave up

Three simplifications were taken on purpose, and each is now a ceiling on depth:

1. **Role is presentational only.** Four roles produce pronoun substitution over one identical item set — same questions, same thresholds, same personas, no role-specific norming. A parent assessing a child and a leader assessing a team are measured by one yardstick.
2. **Modality is decorative.** The free-text focus never enters any computation; it is echoed back so the report feels bespoke.
3. **Everything is equally weighted.** Every input is 1/3 of its dimension, every dimension 1/5 of its axis, every axis 1/2 of the overall. No item earns more weight by being more diagnostic.

---

# PART II — The scoring pipeline, exactly

All computation lives in `compute(answers, baseline, usageVal)` and runs identically on client and server.

## 2.1 Stage 1 — item to score

```
itemScore = reverse ? (6 - raw) : raw          // raw ∈ 1..5
```

Scenarios are **never** reversed; they are already directional (5 = healthiest).

## 2.2 Stage 2 — dimension score

Sum the 2 items and the 1 scenario, then:

```
avg = sum / 3                          // defaults to 3 if nothing answered
pct = round(((avg - 1) / 4) * 100)     // 1..5 → 0..100
```

Because there are exactly three inputs of five points each, **a dimension score can only take 13 distinct values.** This lattice governs everything downstream:

| sum | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **pct** | 0 | 8 | 17 | 25 | 33 | 42 | **50** | **58** | 67 | 75 | 83 | 92 | 100 |

Note that **58 — the persona threshold — is exactly a lattice point** (sum = 10), and the neutral answer (all 3s, sum = 9) lands on exactly 50. The two most consequential values in the instrument sit one notch apart, and one notch is one Likert click on one of three inputs.

## 2.3 Stage 3 — axis scores

```
resilience = round(mean of dimensions 1-5)
readiness  = round(mean of dimensions 6-10)
```

## 2.4 Stage 4 — abstention damping

```
if usageVal ≤ 2:
    abstainer = true
    readiness = round(readiness × (usageVal == 1 ? 0.55 : 0.72))
```

Resilience is untouched. This happens **before** `overall` is computed, so it propagates.

## 2.5 Stage 5 — overall and persona

```
overall = round((resilience + readiness) / 2)

hiR = resilience ≥ 58
hiD = readiness  ≥ 58
```

|  | readiness ≥ 58 | readiness < 58 |
|---|---|---|
| **resilience ≥ 58** | **Guide** | **Anchor** |
| **resilience < 58** | **Sprinter** | **Wanderer** |

## 2.6 Stage 6 — derived signals

```
critical flag    : dimension.critical && pct < 40
consistency gap  : claim − scenario ≥ 2
measuredBand     : overall ≥80→5, ≥62→4, ≥44→3, ≥26→2, else 1
illusion         : B1 − measuredBand
strengths        : top 3 dimensions by pct
risks            : bottom 3 dimensions by pct
```

Display bands (every bar, ring, radar fill) use a **different** ladder: 80 / 60 / 40 → Flourishing / Forming / Emerging / Eroding.

---

# PART III — The four personas in depth

This is the heart of what a respondent receives. The persona determines the headline, the portrait, the strengths, the blind spots, and — critically — **all of the advice**.

## 3.0 What is persona-conditional, and what is not

Before the individual profiles, the honest scope of persona logic. Searching every persona-conditional branch in the codebase yields exactly four behavioural differences:

| Location | Difference |
|---|---|
| `engine.ts:175` | Sprinter alone gets a 5th blind-spot block, *"You can pass and still be exposed"* |
| `reportPdf.tsx:359` | Guide's next-step label is *"turn outward"*; everyone else gets *"toward The Guide"* |
| `reportPdf.tsx:362` | Guide gets a "you are already at the goal" paragraph; everyone else is told which axis to raise |
| `Visuals.tsx:87`, `reportPdf.tsx:238` | The climb-path line is drawn from the respondent to The Guide, suppressed when they *are* the Guide |

**Everything else is static text keyed by persona.** No scoring, no threshold, no question, and no dimension treatment varies by persona. The persona is a lookup key into four prewritten payloads.

Each payload contains: name, emoji, accent colour, quadrant label, tagline, portrait, "what this looks like," a research citation, strengths, blind spots, "The Pull," moves, next step, and a closing line.

| Persona | Strengths | Blind spots | Moves |
|---|---|---|---|
| Guide | 3 | **2** | 3 |
| Anchor | 3 | 3 | 3 |
| Sprinter | 3 | 3 | 3 |
| Wanderer | 3 | 3 | 3 |

The Guide is the only persona given fewer blind spots than strengths.

---

## 3.1 The Guide — high resilience / high readiness

**Entry:** `resilience ≥ 58 AND readiness ≥ 58`
**Accent:** `#2F6F62` (deep green)
**Base rate under random answering:** **4.3%** — the rarest outcome by a wide margin.
**Reachability:** requires averaging ≥ 3.33/5 across *all thirty inputs*, with no axis dipping below the line. **Unreachable at usage ≤ 1** (see §4.1).

> *Tagline:* You are using AI with skill while keeping judgment, effort, and ownership intact.
> *Portrait:* Both protected and prepared: able to use AI well without becoming dependent on it.
> *The Pull:* "The danger is not collapse, but comfort: letting a good pattern go unexamined as tools change."

- **Strengths:** Strong independent judgment · Healthy AI fluency · Clear ownership of learning
- **Blind spots:** Complacency after strong results · Assuming others have the same habits
- **Moves:** Teach one AI habit to someone else · Schedule unaided practice after AI-supported work · Review your prompts and outputs for hidden assumptions
- **Research:** "High-support, high-agency environments produce stronger learning than either avoidance or automation."

**What the engine does differently:** the only persona whose narrative is not "climb toward The Guide." Receives *"You are already at the goal… turn outward and help others climb."* The climb-path line is suppressed.

**The diagnostic claim:** you have solved the problem the instrument poses; your remaining risk is complacency.

**Where it is thin.** The Guide is the persona most likely to be *reached by a knife-edge* (§4.2) and least likely to be told anything specific. Advice shifts from personal formation to teaching others — but the instrument has no idea whether this person can teach, and a respondent who cleared 58/58 by a single point receives the same "you are already at the goal" language as one scoring 95/95. Two blind spots, both generic, for the profile that most needs to know *which* of its ten dimensions is closest to slipping. A Guide at 58 and a Guide at 95 are told the same thing.

---

## 3.2 The Anchor — high resilience / low readiness

**Entry:** `resilience ≥ 58 AND readiness < 58`
**Accent:** `#85714E` (bronze)
**Base rate under random answering:** 16.4% — and **20.8% among abstainers**, where it becomes one of only two reachable outcomes.

> *Tagline:* You are protected from many AI harms, but you may be underprepared for AI-shaped work.
> *Portrait:* Keeps independence and judgment, yet risks mistaking avoidance for readiness.
> *The Pull:* "The pull is toward staying safe by staying still."

- **Strengths:** Independent effort · Lower dependency risk · Stable judgment
- **Blind spots:** Low practical fluency · Slow adaptation · **False safety from non-use**
- **Moves:** Practice one bounded AI workflow each week · Use AI for feedback, then revise independently · Compare AI output against your own first draft
- **Research:** "Avoidance can preserve current strengths while delaying fluency needed in future contexts."

**What the engine does differently:** nothing beyond the standard "raise your weaker axis" direction text, which will name Readiness.

**The diagnostic claim:** your protection is real, but it may be purchased by avoidance rather than skill.

**Where it is thin — and this is the instrument's most consequential ambiguity.** The Anchor bucket silently contains two completely different people:

1. Someone who **uses AI regularly** and is genuinely unskilled with it — low readiness, honestly measured.
2. Someone who **barely uses AI at all** and was *pushed here by the damping* from a readiness score that may have been perfectly healthy.

These are opposite conditions requiring opposite advice, and the instrument cannot distinguish them in its output. Both receive "practice one bounded AI workflow each week." The `abstainer` flag exists and does append a separate blind-spot block, but **the persona text itself, the strengths, the blind spots and all three moves are identical** for both. A person with raw readiness of 100 and usage of 1 is called an Anchor and told they have "low practical fluency" — a claim their own answers contradict.

---

## 3.3 The Sprinter — low resilience / high readiness

**Entry:** `resilience < 58 AND readiness ≥ 58`
**Accent:** `#9E1D20` (crimson — the alarm colour)
**Base rate under random answering:** 16.5%. **Unreachable at usage ≤ 1.**

> *Tagline:* You can move quickly with AI, but the underlying capacity may be thinning.
> *Portrait:* Capable and fast, yet risks outsourcing the very effort that forms understanding.
> *The Pull:* "The pull is speed: because the work gets easier, it feels healthier than it is."

- **Strengths:** Practical AI skill · High experimentation · Fast production
- **Blind spots:** Dependency risk · Shallow transfer · Overconfidence from polished output
- **Moves:** Do a no-AI recall pass after each AI session · Verify one important AI claim before using it · Write your own explanation before asking for improvement
- **Research:** "Unrestricted AI support can raise immediate performance while weakening later unaided performance."

**What the engine does differently:** the **only persona with a dedicated extra blind-spot block**, appended unconditionally:

> *"You can pass and still be exposed."* — High readiness can mask low resilience. You look future-ready, and you are, but the capacity underneath is thinning. The test you should fear is not the one with AI; it is the one without it.

**The diagnostic claim:** this is the persona the entire instrument was built to catch. It is the dissociation from §1.1 made visible — the person a one-dimensional test would score as a success.

**Where it is thin.** The Sprinter is the instrument's thesis, and it gets the most attention (four blind spots, the crimson accent, a bespoke warning) — but the three moves are still generic. A Sprinter whose weakness is Memory Formation and one whose weakness is Integrity And Ownership are radically different cases: the first is a study-habits problem, the second is closer to an honesty problem. Both are told to "do a no-AI recall pass." The engine computes `risks[0]` — the single weakest dimension — and the PDF displays it, but **no advice is conditioned on it.**

---

## 3.4 The Wanderer — low resilience / low readiness

**Entry:** `resilience < 58 AND readiness < 58`
**Accent:** `#7a6b5c` (grey-brown)
**Base rate under random answering:** **62.8%** — and **79.2% among abstainers.** This is the default outcome of the instrument.

> *Tagline:* AI is not yet forming strong habits, but your profile has the most room to grow.
> *Portrait:* Still finding a stable way to learn with AI.
> *The Pull:* "The pull is drift: using AI when pressure rises without a plan for learning."

- **Strengths:** Room for rapid improvement · Openness to new routines · A clear starting point
- **Blind spots:** Unclear boundaries · Low fluency · Weak unaided practice
- **Moves:** Choose one task where AI is allowed and one where it is not · Ask AI for questions before answers · End each session by writing what you can now do alone
- **Research:** "Learners benefit from explicit routines, feedback, and reflection when new tools enter learning."
- **Closing line:** "This is a beginning profile, not a fixed identity."

**What the engine does differently:** nothing. Standard weaker-axis direction text.

**Where it is thin — the largest single problem in the persona model.** The Wanderer is not a diagnosis; it is a residual. It catches everyone who did not clear 58 on either axis, which under neutral answering is **everybody**: a respondent who answers 3 ("Not sure" / "Sometimes" / "Moderately") to all thirty questions scores exactly 50/50 and is told they are a Wanderer with "unclear boundaries" and "weak unaided practice."

The bucket therefore contains, indistinguishably:
- genuine novices with chaotic AI habits
- careful, uncertain respondents who chose the middle option throughout
- people who are moderately healthy on every dimension but exceptional on none
- abstainers dragged down by damping

Its three strengths are not achievements but consolations ("room for rapid improvement," "a clear starting point"), and its `feed` line has to reassure the respondent that this is "not a fixed identity." **The most common outcome of the assessment is its least diagnostic one.** For an instrument meant to be helpful, roughly two-thirds of respondents currently land in the bucket that tells them the least about themselves.

---

# PART IV — Verified structural findings

Every figure below was computed against the real scoring math. These are the load-bearing problems.

## 4.1 Abstainers are locked out of two personas entirely

Maximum attainable readiness after damping:

| Reported usage | Multiplier | Max readiness | Can reach 58? |
|---|---|---|---|
| 1 — Almost never | ×0.55 | **55** | **Never** |
| 2 — A few times a month | ×0.72 | 72 | Only if raw ≥ 80 |
| 3–5 — Weekly or more | ×1.00 | 100 | At raw ≥ 58 |

A respondent answering "Almost never" to the usage question **cannot be classified as a Guide or a Sprinter under any combination of the other thirty answers.** Perfect 5s across every readiness item yield 55 — three points short. Confirmed by simulation: 0.00% Guide and 0.00% Sprinter across one million random abstainer respondents.

At usage = 2, the respondent must reach raw readiness of 80 (the Flourishing band) to clear a bar everyone else clears at 58.

**One question of thirty-one silently removes half the outcome space.** This is far beyond what the design intent — "avoiding AI is not the same as being safe" — actually calls for. The damping does not adjust the score; it forecloses the classification.

## 4.2 The persona boundary is a single Likert click

Take a respondent whose every dimension sits at sum = 10 (pct 58): resilience 58, readiness 58 → **Guide**.

Move one item on one dimension down a single notch (Agency 10 → 9):

```
Agency 58 → 50 · resilience 58 → 56 → below threshold
Result: Guide → Sprinter
```

**One click on one of thirty inputs moves the respondent from "you have solved this" to "the capacity underneath is thinning."** The lattice guarantees this: with only 13 possible dimension values and threshold 58 sitting exactly on a lattice point, boundary cases are maximally unstable. No smoothing, confidence interval, or "borderline" state exists.

## 4.3 The instrument defaults to Wanderer

| Reported usage | Guide | Anchor | Sprinter | Wanderer |
|---|---|---|---|---|
| 1 (abstainer) | 0.00% | 20.77% | 0.00% | **79.23%** |
| 3 (weekly) | 4.30% | 16.44% | 16.46% | **62.80%** |
| 5 (daily) | 4.27% | 16.44% | 16.47% | **62.82%** |

*One million simulated respondents per row, each of the 30 inputs drawn uniformly from 1–5.*

The 2×2 is not remotely balanced. The Wanderer quadrant absorbs roughly five-eighths of the space at normal usage and four-fifths among abstainers, while the Guide — the goal state the entire report orients toward — occupies about 4%. Note also that usage 3 and 5 are identical: **above the damping cliff, the usage question has no effect whatsoever.** It is a binary switch disguised as a five-point scale.

## 4.4 Abstention compounds into an accusation of self-delusion

Because damping runs before `overall`, it lowers `measuredBand`, which raises the illusion gap. Identical answers (all 3s), varying only usage and B1:

| Usage | readiness | overall | measuredBand | B1=3 | B1=4 | B1=5 |
|---|---|---|---|---|---|---|
| 1 | 28 | 39 | 2 | aligned | **accused** | **accused** |
| 2 | 36 | 43 | 2 | aligned | **accused** | **accused** |
| 3 | 50 | 50 | 3 | aligned | aligned | **accused** |

"Accused" = the illusion gap reaches +2 and the report returns *"A productivity-illusion gap… better output makes us feel more capable while we quietly become less so. Trust the measurement here, not the feeling."*

A light AI user with mildly positive expectations is told they are suffering a **productivity illusion from AI use they reported barely having.** The accusation is generated by the penalty, not by evidence of over-confidence. The same answers at weekly usage produce no such claim.

## 4.5 Triangulation is built and then discarded

The three-input design (§1.2) exists to surface disagreement between what a person claims and what they do. The scoring then **averages all three into a single number**, which destroys exactly that signal:

| Respondent | Claim | Reverse | Behaviour | sum | pct |
|---|---|---|---|---|---|
| A — consistent | 3 | 3 | 3 | 9 | 50 |
| B — claims high, behaves low | 5 | 3 | 1 | 9 | **50** |

B is the person the instrument was designed to catch, and B is scored identically to A. The consistency gap does fire for B (5 − 1 = 4 ≥ 2) and produces one prose paragraph — but it affects **no score, no axis, no persona, and no advice**. The instrument's best idea currently has zero weight in its output.

## 4.6 Advice does not know what it is advising about

The engine computes `strengths` (top 3 dimensions) and `risks` (bottom 3) and the PDF displays `risks[0]`. But the three "next moves" are looked up by persona alone. **There are exactly four distinct sets of moves in the entire instrument**, one per persona.

The only dimension-level personalization is `microInsights`, a per-dimension `strong`/`watch` pair rendered in the PDF dimension rows, selected by a single binary test (`pct ≥ 60`). So the complete personalization surface is: 4 advice sets × 10 binary micro-insights — from an instrument that collects 31 responses and computes 10 dimension scores, 2 axes, 4 derived signals and a full rank ordering.

## 4.7 Smaller structural issues

- **Two disagreeing band ladders.** Display uses 80/60/40; the illusion `measuredBand` uses 80/62/44/26. Nothing reconciles them.
- **Undefended magic numbers.** `58`, `40`, `0.55`, `0.72`, `2`, and both band ladders are hard-coded with no derivation, no data, and no configuration surface.
- **No readiness dimension can ever raise a critical flag.** All three critical dimensions are on the resilience axis.
- **A critical flag requires near-total failure** — sum ≤ 7 of 15, i.e. averaging below 2.33/5 on all three inputs — so it fires only in extreme cases and cannot warn of a dimension that is merely bad.
- **`strengths` and `risks` are always 3 and 3**, so a respondent scoring 90+ everywhere is still shown three "risks."
- **Missing answers silently default a dimension to 50**, indistinguishable from a genuine neutral response.
- **No timing, no straight-lining detection, no response-set correction** — despite the reverse items being placed to enable exactly that.
- **B2 is collected, stored, and never read.** *"I predict my final result will land in the healthy range"* is the natural input for a **calibration** measure (predicted vs actual) distinct from B1's *desirability* measure. The data exists on every historical record.
- **`star: true` on four items is decorative** — it renders a ★ and does nothing. A weighting hook already threaded through the data model.
- **`liveEstimate` is computed and passed into the quiz component but never rendered.**
- **Two items per dimension is below the conventional floor** for a stable subscale, and no reliability, validity, or norming work exists.

---

# PART V — Where the depth is, if you want it

Ordered by leverage against the instrument's own goals. These follow directly from Part IV; none requires new questions unless stated.

**1. Give the consistency gap weight (§4.5).** The triangulation is already collected and currently free. Let claim–behaviour divergence modify the dimension score, or carry a confidence penalty, rather than producing one paragraph. This is the highest-value change available and needs no new items — and because raw answers are retained on every record (§6.2), it can be applied retroactively to every respondent to date.

**2. Condition advice on dimensions, not personas (§4.6).** `risks[0]` is already computed. Moving from 4 advice sets to dimension-targeted guidance is the single biggest improvement in usefulness per unit of work, and it directly addresses the thinness identified in all four persona profiles.

**3. Split the Anchor (§3.2).** The `abstainer` flag already exists. An abstainer with high raw readiness and a heavy user with low readiness are opposite cases wearing one label and receiving one set of moves. This is arguably a fifth persona.

**4. Make abstention a modifier, not a lockout (§4.1).** The design intent is honest; the 0.55 implementation removes half the outcome space on one unverified self-report. Consider damping that cannot cross a classification boundary, or surfacing raw-and-adjusted readiness as two visible numbers.

**5. Break up the Wanderer (§3.3, §4.3).** Two-thirds of respondents land in the least diagnostic bucket. Splitting it — by usage, by consistency, by which axis is nearer the line, or by the middle-response rate — would give the majority of respondents something specific.

**6. Add boundary handling (§4.2).** With 13 lattice values and a threshold on a lattice point, one Likert click flips the verdict. A borderline band ("you are close to The Guide on both axes") would be more honest and more useful than a hard flip.

**7. Use B2 (§4.7).** Calibration versus desirability is a genuinely different construct from the current illusion gap, and the data is already in every stored record.

**8. Deepen the scenarios.** All ten currently share the same five response options, varying only the stem — so they measure one "engagement depth" construct ten times rather than ten distinct behaviours. Per-dimension behavioural options would sharpen both the dimension scores and the consistency gap that depends on them. *(This is the one item here that requires authoring new content.)*

**9. Turn the magic numbers into a config surface.** Thresholds, damping, and both band ladders belong in one place where they can be tuned and, eventually, calibrated against real data.

**10. Reconcile the two band ladders (§4.7).** Display and illusion disagree by 2–4 points at every boundary for no stated reason.

---

# PART VI — Reference

## 6.1 Complete item inventory

31 scored questions: 1 usage + 10 × (2 items + 1 scenario). Plus 10 unscored dimension intros = 41 screens.

**Usage question** (asked first, scored only via §2.4):
*"How often is AI currently used in {usageSubject}?"* — 1 Almost never · 2 A few times a month · 3 Weekly · 4 Several times a week · 5 Daily or almost daily

**Response scales** (all 1–5):

| Type | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| agreement | Strongly disagree | Disagree | Not sure | Agree | Strongly agree |
| frequency | Never | Rarely | Sometimes | Often | Almost always |
| confidence | Not confident | Slightly | Moderately | Very | Completely |

**The shared scenario ladder** — identical across all ten dimensions, only the stem varies:

| v | Option |
|---|---|
| 1 | {learner} would let AI do most of the work and move on. |
| 2 | {learner} would use AI for a quick answer, then lightly check it. |
| 3 | {learner} would compare AI help with independent thinking. |
| 4 | {learner} would ask AI for feedback while keeping ownership. |
| 5 | {learner} would use AI to deepen understanding and test judgment. |

**The ten dimensions** — ★ star (display only) · **R** reverse-coded · ⚑ critical:

| # | Dimension | Axis | Principle | Items |
|---|---|---|---|---|
| 1 | Learning Agency ⚑ | res | The learner remains the author of the work. | ★`agency_1` can explain the answer without leaning on AI *(agreement)* · **R** `agency_2` lets AI decide what the final answer should be *(frequency)* · `agency_s` "A hard task is due soon." |
| 2 | Attention Discipline | res | Depth needs protected attention. | `attention_1` can stay with a difficult idea before asking AI *(frequency)* · **R** `attention_2` AI pulls into faster but shallower work *(agreement)* · `attention_s` "A confusing concept appears." |
| 3 | Critical Judgment ⚑ | res | Trust is earned, not outsourced. | ★`judgment_1` checks AI claims against evidence *(frequency)* · **R** `judgment_2` if AI sounds confident, usually accepts it *(agreement)* · `judgment_s` "AI gives a polished answer with no source." |
| 4 | Memory Formation | res | The mind must still carry what matters. | `memory_1` practices recalling ideas without AI nearby *(frequency)* · **R** `memory_2` mostly recognizes good answers instead of producing them *(agreement)* · `memory_s` "A test or performance moment is coming." |
| 5 | Integrity And Ownership ⚑ | res | Assistance must remain honest. | `integrity_1` can say exactly what AI did and what remained human *(confidence)* · **R** `integrity_2` hides AI help when rules are unclear *(frequency)* · `integrity_s` "AI helps improve an assignment." |
| 6 | AI Fluency | rea | Skillful use is learned, not assumed. | ★`fluency_1` can shape prompts to get useful support *(confidence)* · **R** `fluency_2` uses AI the same simple way every time *(frequency)* · `fluency_s` "The first AI answer is weak." |
| 7 | Transfer To Real Tasks | rea | Learning must travel beyond the chat window. | `transfer_1` can use what AI helped with in a new situation *(confidence)* · **R** `transfer_2` once AI is removed, cannot continue *(agreement)* · `transfer_s` "The same idea appears in a different task." |
| 8 | Creative Leverage | rea | AI should widen imagination, not narrow it. | `creation_1` generates several directions before choosing *(frequency)* · **R** `creation_2` usually accepts the first AI idea *(frequency)* · `creation_s` "A creative task begins from a blank page." |
| 9 | Human Collaboration | rea | Technology should strengthen human exchange. | `collaboration_1` uses AI to prepare for better human conversation *(frequency)* · **R** `collaboration_2` AI replaces need to ask people for feedback *(agreement)* · `collaboration_s` "Feedback is needed." |
| 10 | Adaptive Growth | rea | The learner keeps learning as tools change. | ★`adaptability_1` reflects on whether AI habits help or harm *(frequency)* · **R** `adaptability_2` keeps using AI the same way even when it stops helping *(frequency)* · `adaptability_s` "A familiar AI workflow starts producing weaker results." |

In every dimension the `_1` item is the **claim item** used for the consistency gap.

## 6.2 Flow, delivery and data

```
hero → setup (role, modality, B1, B2) → quiz (41 screens) → results (BLURRED behind email gate) → thanks
```

- Answers auto-advance (220 ms items / 240 ms scenarios); keys `1`–`5`, `←`, `→` supported; back navigation permitted throughout.
- Reverse items show a visible warning: *"⚠ A high answer here is a caution sign, we account for that."*
- **The full profile is computed and rendered, then visually blurred**, with an email capture form overlaid. On submit the respondent goes to the thanks screen — **results are never shown on screen.** The unlocked rendering path and PDF download button are fully implemented but currently unreachable.
- The report is a **7-page PDF**: cover (dark) → four personas + the climb → persona deep dive → dimensions → blind spots + illusion → next moves → closing (dark). Delivered by email (SES; disabled unless `EMAIL_ENABLED=true`).
- **Stored per submission:** identity (name, email, phone, heardFrom, consent), role, modality, persona, resilience, readiness, overall, per-dimension pct map, **the complete raw `answers` object**, baseline (B1 *and* B2), usageVal, createdAt. DynamoDB when `LEADS_TABLE`/`EVENTS_TABLE` are set, otherwise local JSON in `./data`.
- Events: `assessment_start`, `role_selected`, `assessment_complete`, `email_submit`, `report_download`.

**Because raw answers and both baselines are retained, any re-scoring model can be applied retroactively to every historical submission.** No respondent needs re-testing for changes to Layers 2–4. This is the single most important operational fact for a redesign: scoring changes are cheap, item changes are not.

## 6.3 Constants, in one place

| Constant | Value | Used for |
|---|---|---|
| Persona thresholds | 58 / 58 | resilience & readiness cutoffs |
| Critical flag | pct < 40 | Agency, Judgment, Integrity only |
| Consistency gap | claim − scenario ≥ 2 | honesty check |
| Abstention trigger | usageVal ≤ 2 | damp ×0.55 (u=1) or ×0.72 (u=2), readiness only |
| Display bands | 80 / 60 / 40 | Flourishing / Forming / Emerging / Eroding |
| Measured bands | 80 / 62 / 44 / 26 | illusion gap only |
| Illusion thresholds | ≥ +2 / ≤ −1 | over-confident / self-critical |
| Micro-insight switch | pct ≥ 60 | strong vs watch text |
| Dimension lattice | 13 values | 0, 8, 17, 25, 33, 42, 50, 58, 67, 75, 83, 92, 100 |

## 6.4 Implementing files

| File | Contains |
|---|---|
| `src/data/compass.ts` | all content — dimensions, items, scenarios, personas, scales, micro-insights |
| `src/lib/engine.ts` | the entire scoring engine and `vulnList` (isomorphic) |
| `src/components/compass/CompassApp.tsx` | flow, screens, step sequence |
| `src/components/compass/Results.tsx` | on-screen result composition and the email gate |
| `src/components/compass/Visuals.tsx` | gauge, radar, quadrant map, dimension bars |
| `src/lib/reportPdf.tsx` | the 7-page PDF |
| `src/app/api/submit/route.ts` | scoring on submit, persistence, email delivery |

---

*The Neogogy Formation Compass · created by Alin Vrancila, Ph.D. · International Center for Applied Neogogy (ICAN) · v0.1.2, release 2026-07-06*
