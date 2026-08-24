# Formation Compass 2.0, integration notes

A running record of every judgment call made while shipping v2. Required by Part E.

## Phase 0, decisions taken before code

**Accelerator location.** Part D says the package would be at the repo root. It was actually at
`~/Downloads/neogogy-v2/` (and `neogogy-compass-v2.zip`, identical contents). Treated as the Part D
package and adopted rather than reimplemented. Verified before trusting it: installed its
dependencies standalone, ran `npx tsx tests/synthetic.ts`, confirmed 29 passed, 0 failed.

**Phase 3 results gate.** Asked as required. First answer was on-screen results with email capture
offered for the PDF. The instruction was then revised to: respondents receive results only after
providing their email, keeping the existing admin panel, lead record and user information fields
exactly as they are. Implemented reading: the email gate stays and is mandatory; once the gate is
submitted the full results render on screen in the Part B10 order and the PDF is emailed. The
ungated path is removed. Lead capture, admin panel and all stored user fields are untouched.

## Phase 1, engine adoption

**Layout.** `src/engine/` and `src/items/` moved into the app source tree unchanged. Engine modules
use relative imports internally (`./config`, `../items/student`), which resolve correctly from
`src/`, so no path alias rewriting was needed inside the engine. The app alias `@/* -> ./src/*` is
untouched.

**Test relocation.** `tests/` became `tests/compass/`. Import specifiers rewritten from
`../src/engine/*` to `../../src/engine/*` to match the new depth.

**Portability bug found and fixed.** `tests/demo.ts` line 1 imported from the absolute authoring
path `/home/claude/neogogy-v2/src/engine/index`, which fails on any other machine and was the only
typecheck error in the package as delivered. Rewritten to a relative import. This was the single
defect found in the accelerator.

**TypeScript version.** The package declares `typescript ^7.0.2`; this app runs 5.9.3. The engine
typechecks clean under 5.9.3 with the app's stricter `tsconfig.json`, so no source changes were
required and the app's version was kept.

**v1 retirement, staged.** `src/lib/engine.ts` became `src/lib/engineV1.ts` and
`src/data/compass.ts` became `src/data/compassV1.ts`, both via `git mv` to preserve history, each
carrying a deprecation header. Every existing importer was repointed at the renamed files so the app
continues to build during the transition. Nothing new imports them. They are deleted in Phase 8.

**Scripts added.** `typecheck` (`tsc --noEmit`) and `test:compass`
(`tsx tests/compass/synthetic.ts`). `tsx` added as a devDependency.

**Verification.** `npx tsc --noEmit` exits 0 across the whole app including the new engine, items and
tests. `npm run test:compass` reports 29 passed, 0 failed.

## Phase 2, assessment flow

**Spec conflict resolved: micro-state threshold.** Part B3 defines micro-states as strong at 65 and
above, developing from 40 to 64.9, watch below 40. The accelerator's `config.ts` shipped
`microWatch: 45`, which appears to have been conflated with `vulnerabilityCeiling: 45`. Under the
Part 0 rule that this prompt wins on assessment behavior, the constant was changed to 40. No test
depended on the old value; the suite still reports 29 passed, 0 failed. Scores from 40 to 44.9 are
now labeled developing rather than watch, which is the respondent-visible effect.

**B2 rendering.** `BASELINE_ITEMS` declares B2 with `scale: "agreement"`, but the engine consumes
b2 as a predicted band compared against the measured band ladder (80, 62, 44, 26). Rendering it on
an agreement scale would have asked the respondent to agree or disagree with a prediction. B2 is
therefore rendered with five band labels ("Near the start of the continuum" through "Near the far
end"). This is a presentation choice only; no engine change was made, and the stored value is still
1 to 5.

**Screen order.** Persona selection, B1 and B2 sit together on the setup screen, since B1 is worded
"before any questions" and neither is scored. The usage item is then the first scored screen, and
everything after it comes from `applicableItems(persona, usage)` in the order that function returns.
No item list is hardcoded anywhere in the components.

**Stale answer pruning.** Changing the usage answer changes which adaptive branches apply. If a
respondent answered at usage 5, went back, and changed usage to 1, the high-use probe answers would
still be in state and would violate the "every key is an applicable item id" rule. `chooseUsage`
therefore prunes answers to the new applicable set, and `finish` prunes again before assembling the
Submission. The dev-only assertion logs any stray id.

**Rendering split.** Claims and reverses use the compact scale row from `SCALE_LABELS`. Scenarios,
branches and outcomes use full-width anchored option cards. The outcome value 0 option ("Not enough
experience to say") is a full card of equal weight, distinguished only by a dashed border, never a
skip link. Star decorations and the live estimate are gone, and no component performs scoring.

**Verification.** `tests/compass/branches.ts` added: it asserts, for all four personas at all five
usage levels, that the low-use branch appears only at usage 2 or below, the high-use probes only at
usage 4 or above, that screen counts are exactly 33, 34 or 35 items plus the usage screen, that no
item id repeats, and that no two persona banks share any prompt text. All checks pass. Production
build succeeds and the hero renders v2 copy with no v1 archetype names anywhere in the page.

**Known gap at this phase.** The screen-list half of the Phase 2 gate is verified exhaustively and
deterministically. The interactive half (clicking a full run as each persona at usage 1, 3 and 5)
needs a browser and is carried out in the Phase 8 battery, not here.

## Phase 3, gated results experience

**Decision applied.** Results are shown only after the respondent provides their details. The gate
comes first, the server scores the submission, and the full result then renders on screen in Part
B10 order. The ungated path was never built. Lead capture keeps the exact v1 field set (first name,
last name, email, mobile phone, how they heard, consent), so the admin panel and the stored user
information are unchanged.

**generateReportSections().** `narrative.ts` was restructured so section prose lives in one place
and both the screen and the PDF render the same words in their own layouts. `generateReport()` now
composes those sections into the markdown document.

**The refactor is provably prose-preserving.** `tests/compass/dump.ts` generates reports for 60
deterministic profiles (four personas, three usage levels, five answer shapes). The dump was
produced from the pre-refactor `narrative.ts` and from the refactored one, and the two are
byte-identical. The first attempt differed by exactly one blank line per report, because the roadmap
section already ends with a blank and the composer added a second before section 11; the composer now
collapses that. The 29-check suite, which asserts the report contains no em-dash or en-dash
characters, stays green.

**Scoring location.** The results screen renders a `CompassResult` returned by `POST /api/submit`.
The client never calls `compute`, so no component scores anything even though the engine is
isomorphic and could.

**Submit route validation.** The route validates against the engine's own item model rather than a
hand-maintained schema: unknown persona, usage outside 1 to 5, unknown item ids, item ids belonging
to a different persona, values outside the item's own option set, and baselines outside 1 to 5 are
all rejected with 400. Verified by request: all six rejection cases return 400 and a valid
submission returns 200 with a full result. Cross-persona injection (posting a teacher item id under
a student assessment) is rejected, which matters because the item id is what selects the construct.

**Lead record.** `LeadRecord` gained `engineVersion`, `result`, `stage`, `stageName`, `archetypeId`,
`archetypeName`, `confidence` and `rescoredFrom`. `resilience` and `readiness` became optional
because v2 has no axes; v2 records omit them. Complete raw answers are still stored, which is what
keeps future rescoring a batch job rather than a re-survey. Admin panel branching on
`engineVersion` and the CSV column changes are Phase 6.

**Confidence display.** Preliminary and insufficient confidence render as a prominent banner above
the sections with the engine's own confidence notes listed, never as a footnote.
