# Deliverables A and B: Current-System Audit and Assessment Critique

Source of truth for the v1 audit: the v0.1.2 specification document ("How the Assessment Works"), which was computed against the real scoring engine. This audit accepts its Part IV findings as verified and adds a measurement-theoretic reading of them.

## A. How v0.1.2 works

Four stacked layers. Layer 1 collects a claim, a reverse item, and a scenario per dimension (31 scored inputs). Layer 2 averages them into ten dimension scores on a 13-value lattice, then into two axes (resilience, readiness) and a 2x2 persona at threshold 58/58. Layer 3 multiplies readiness by 0.55 or 0.72 for low reported usage. Layer 4 derives an illusion gap (B1 minus measured band) and a per-dimension consistency gap, rendered as prose only.

What is genuinely good in v1 and preserved in v2:

1. The central thesis: erosion and preparation dissociate, and the dangerous respondent is high-capability, low-protection. v2 keeps this as its north star and detects it through the dependency and erosion patterns and the Dependent Operator archetype.
2. The three-input triangulation per dimension. v2 keeps the claim/reverse/scenario structure and finally makes it load-bearing.
3. The insight that avoidance is not safety. v2 keeps it, reimplemented without the lockout.
4. The isomorphic engine (same computation client and server) and full raw-answer retention, which together make retroactive rescoring cheap. v2 preserves both properties.

## B. Critique: the seven load-bearing failures, and what v2 does about each

1. Abstention lockout (v1 §4.1). One self-reported usage answer removed half the outcome space; perfect answers at usage 1 could never reach Guide. In measurement terms, a validity modifier was implemented as a construct modifier. v2: usage never multiplies a score. Low use caps confidence on experiential constructs to "preliminary" and raises the underexposure composite unless the low-use branch plus judgment scores establish intentional selectivity. Regression test: perfect answers at usage 1 now reach stage 8+.

2. Knife-edge classification (v1 §4.2). Thirteen lattice values with the threshold on a lattice point made one Likert click flip "you have solved this" into "the capacity is thinning". v2: continuous weighted scoring (one click moves the developmental index by well under two points, verified by test), plus an explicit borderline band of three index points around every stage boundary.

3. The residual Wanderer (v1 §4.3). 62.8 percent of random respondents landed in the least diagnostic bucket and were told they had specific deficits ("unclear boundaries") that neutral answers never evidenced. v2: nine pattern-derived archetypes; the largest share under random answering is under 30 percent (printed by the test suite); and a fully neutral respondent receives zero fabricated vulnerabilities, an explicit "forming, not failing" narrative, and dimension-level guidance instead.

4. Penalty-generated self-delusion accusations (v1 §4.4). Damping lowered the measured band, which manufactured illusion-gap accusations for light users. v2: the desirability gap is computed against the undamped developmental index (there is no damping), and B2 now yields a separate calibration gap, which is the construct B2 was collected for.

5. Discarded triangulation (v1 §4.5). Claim, reverse, and behavior were averaged, destroying the disagreement they existed to surface. v2: scenarios carry 1.6x weight; a flagged claim-behavior gap discounts the claim by half, shifts the dimension toward behavioral evidence, lowers that dimension's confidence, and is reported. The inflated respondent now scores measurably below the consistent one (tested).

6. Persona-only advice (v1 §4.6). Four static advice sets for the whole instrument. v2: recommendations are assembled per respondent from detected risk signals plus the bottleneck construct, in the roadmap format of spec §41 (capability, behavior change, practice, evidence of progress, risk to monitor). Two same-persona respondents with different weaknesses receive different advice (tested).

7. The smaller items of v1 §4.7, all closed: one band ladder; every constant named and centralized in config.ts; gating applies to advanced stages symmetrically rather than critical flags existing only on one axis; strengths and vulnerabilities are shown only when genuinely present rather than always three and three; missing answers degrade confidence rather than silently scoring 50; B2 is used; decorative fields (star, liveEstimate) are dropped rather than carried.

## C. What v2 deliberately does not claim

The v1 spec's §56 humility requirements are kept verbatim in spirit: no clinical language, no validated-psychometrics claims, indices labeled as assessment indices, and hedged evidence language ("your responses are consistent with") throughout the narrative engine. Two items per construct plus one scenario remains below the conventional subscale floor; that is stated in LIMITATIONS-AND-VALIDATION.md rather than hidden, and the item architecture is built for expansion once pilot data exists.
