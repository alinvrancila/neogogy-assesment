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

## Phase 4, visuals

**What replaced what.** The v1 quadrant map and climb path are gone. In their place: a horizontal
ten stage continuum strip with the marker placed by the continuous index, the substage label, a
rendered borderline zone straddling the boundary when the engine reports one, and a gate marker that
shows both the earned index and the capped stage with the engine's own one line reason. The ten
dimension radar remains, fed from `dimensions`, with dependencySafety plotted as Dependency Risk
from `reportedScore` and a caption saying that lower is healthier on that one spoke. The climb path
became a current to next stage panel driven by `nextTarget`, which renders as a maintenance loop at
stage 10 rather than pointing at a stage that does not exist.

**Brand.** Deep Navy #1B2A4A ground, Electric Teal #00D4AA as the only accent, hairline rules at low
opacity, no heavy fills (the radar polygon sits at 16 percent), existing app typography throughout.

**Bug the fixtures page caught.** The first fixture builder answered every item with its highest
option to represent a healthy respondent. That is wrong: reverse items are inverted at scoring, so
the healthiest answer on a reverse item is the lowest option. The naive builder produced an
"all highest" profile at stage 7 rather than stage 9 or 10. The builder is now direction aware
(`healthiest` and `unhealthiest` helpers keyed on item type). This bug existed only in the fixture
page, never in the engine or the flow, but it is worth recording because anyone hand building a test
submission will hit it.

**Fixtures verified.** All lowest lands at stage 1, index 0.5, five vulnerabilities and no strengths.
All highest lands at stage 10, index 99.8, no vulnerabilities and five strengths, with the next stage
panel showing the maintenance loop. The gated profile earns index 87.5, which would reach stage 9,
and is held at stage 5 because verification sits at 4.9 against a floor of 45; both the earned
position and the reason render on the strip. The borderline profile sits 2.7 points from stage 4 and
draws its zone. The insufficient profile reports insufficient confidence.

**Inspection.** The dev only page at `/dev/fixtures` returns 404 in production. Rendered in dev and
checked structurally: ten SVGs, the gate marker and its reason appearing exactly once, the borderline
zone once, the maintenance loop once, and the Dependency Risk spoke on every radar. A human pass over
the rendered page is still worth doing before release, since structural checks confirm semantics
rather than visual quality.

## Phase 5, PDF

**Layout only.** `src/lib/reportPdfV2.tsx` renders `generateReportSections()`. It contains no prose
about a respondent: every sentence comes from the narrative engine, so the screen and the PDF cannot
drift apart.

**Forced page assignments were the wrong structure.** The first build gave each group of sections its
own `<Page>`. Measuring the output showed pages 5 and 6 sitting at 15 to 31 percent fill across every
fixture, because a short section pair had a whole page to itself and long roadmaps spilled onto a
nearly empty page. The light pages are now a single `<Page wrap>` that react-pdf paginates, so
pagination follows content length. Interior pages went from 15 to 31 percent up to 78 to 98 percent.

**No block splits, and no stranded headings.** Content blocks carry `wrap={false}`, so a block moves
whole rather than splitting. Section headings are welded to their graphic in a `wrap={false}` wrapper
while the prose after them is allowed to flow, which is what removed the half empty page 2 without
ever splitting a figure from its title. The roadmap heading uses `minPresenceAhead` so it cannot be
stranded at the foot of a page away from its first card.

**Measurement, not eyeballing.** `pdfjs-dist` extracts per page text and the lowest text baseline on
each page, which gives a fill percentage. Across five fixtures there are now zero interior pages
below 60 percent fill and zero em-dash or en-dash characters in the rendered text. The only partly
filled page in any report is the last page of the flowed content, which is inherent to pagination.

**Visual inspection caught a real defect.** Rendering the cover to an image showed the gated profile
with its marker sitting near the right hand end of the strip while the text read "Stage 5 of 10".
Numerically correct (the index is 87.5) but misleading at a glance. The strip now shades the stage
band actually occupied, draws the index marker hollow when gating means it overstates the placement,
labels all ten stages, and carries a line reading "Index 87.5 would reach stage 9. Held at stage 5,
see section 2." This is exactly the sort of thing the page-fill numbers could not have caught.

**Fixtures rendered and inspected:** all-highest, all-lowest, gated, insufficient confidence, and a
mixed parent profile. That covers the two the phase requires plus three more.

## Phase 6, API, persistence, admin and email

**Submit route completed.** It now renders the v2 PDF and emails it, then returns the result for the
on-screen render. A failure in the PDF or email path is caught and logged: the respondent still sees
their result, which is the same principle already applied to storage failures.

**Email copy.** Rewritten in archetype and stage language, hedged ("your answers are consistent
with"), with the assessment-indices disclaimer in the body and no dashes. `sendReportEmail` gained an
optional `subject` so callers set it rather than hardcoding a v1 phrase.

**Legacy records made renderable without the v1 engine.** The obvious design would have kept the v1
PDF around to render v1 leads, but that would have blocked the Phase 8 deletion forever. Instead
`src/lib/leadResult.ts` resolves any stored lead to a v2 result: engineVersion 2 records return their
stored result, and everything older goes through `rescoreLegacy`. The admin single report and bulk
report now both use it, so no route imports the v1 engine and rescored PDFs are marked `_rescored` in
bulk filenames.

**Public report route rebuilt** on the v2 engine with the same item-model validation as submit.

**Admin panel and CSV branch on engineVersion.** The CSV carries both column sets: v2 rows fill
`stage`, `stageName`, `index`, `confidence` and `rescoredFrom` and leave `resilience`, `readiness`
and `overall` empty, while v1 rows do the reverse. The panel shows the archetype with its stage
underneath for v2 records, labels the index as developmental or v1 formation so the two are never
read as the same number, and appends the confidence when it is not high.

**Verified against a real legacy record.** A v1 shaped lead with no `engineVersion` field at all was
injected into storage, since that is what genuine v1 rows look like. The admin PDF endpoint returns
200 and a valid PDF for it by rescoring, the v2 lead also returns 200, and the CSV shows
`engineVersion=1` with a v1 overall and empty stage next to `engineVersion=2` rows with a stage and
index and empty v1 columns.

## Phase 7, legacy rescoring

**Script.** `scripts/rescore-legacy.ts`, run with `npm run rescore:legacy` (dry run) or
`npm run rescore:legacy -- --write`. Dry run prints a v1 persona against v2 archetype and stage
crosswalk, a stage histogram, a confidence histogram, and a count of records whose amplification
confidence is preliminary or insufficient. It sends no email in either mode.

**v1 data is preserved.** The rescored record keeps `persona`, `personaName`, `resilience`,
`readiness` and `overall` exactly as they were and adds the v2 view beside them, tagged
`rescoredFrom: "0.1.2"`. Nothing is overwritten.

**Bug found: rescoring duplicated every record.** Writing 200 rescored records turned 203 stored
records into 403. `saveLead` uses DynamoDB `PutCommand`, which upserts by key, but the local JSON
fallback called `appendLocal`, which appends unconditionally. Any code path that re-saves an existing
record therefore produced a duplicate id locally while behaving correctly on DynamoDB. The local path
now upserts by id, matching Put semantics. Re-verified: 54 records in, 54 out, zero duplicate ids,
and a second `--write` run correctly reports nothing to do.

**Bug found: the Hesitant Starter archetype ignored everything except usage.** Its predicate was
`u.usage <= 2`, so any light user landed there regardless of competence. A rescored record with
fluency 100, agency 100, verification 98.5 and usage 2 was being called "Early, uncertain, and
largely unformed AI habits". That contradicts Part B7, which defines the archetype as low usage AND
low fluency AND not intentional, and it contradicts Part A's first principle directly: usage volume
is not maturity. Every other archetype in the file has a compound predicate; this was the only one
testing a single variable. Corrected to
`u.usage <= 2 && fluency < 45 && !intentionalSelectiveUse`, with 45 chosen to match the existing
`vulnerabilityCeiling`. The suite stays at 29 of 29, and that record now falls through to Forming
Practitioner, whose narrative defers to the dimension level findings and assigns no deficits, which
is the honest outcome for a competent light user.

**Spec inconsistency, recorded not silently resolved.** Phase 7 gives the mapping "v1 transfer to
skillGrowth" and then states that "amplification and skillGrowth evidence did not exist in v1, so
rescored records carry preliminary or insufficient confidence there". Those two clauses disagree: if
v1 transfer maps onto skillGrowth then skillGrowth does have evidence. The adapter implements the
explicit mapping, so rescored records show amplification at insufficient confidence (it has no v1
source at all, as intended) while skillGrowth can reach high confidence from the mapped v1 transfer
evidence. The alternative reading would be to cap skillGrowth confidence because the evidence is a
proxy. This is left as delivered because the mapping is stated explicitly and the validation suite
asserts the behavior, but it is worth a decision before a production rescore runs.

## Phase 8, cleanup and release

**v1 deleted.** `src/lib/engineV1.ts`, `src/data/compassV1.ts` and `src/lib/reportPdf.tsx` are gone,
and `src/data/` with them. Nothing imported them by this point: the Phase 6 `leadResult` helper had
already removed the last dependency by rescoring legacy records instead of rendering them with the
v1 engine. They remain recoverable from git history.

**Admin label map removed.** The panel carried a hardcoded v1 persona name map. Since v1 records
store `personaName` directly and v2 records store `archetypeName`, the map was a redundant fallback
and the only reason v1 archetype names still appeared in `src/`. Replaced with a formatter that
derives a readable label from any stored id, which works for both engine versions.

**Two grep hits remain, both false positives.** The Phase 8 check greps for `0.55|0.72|Wanderer|Sprinter`.
What survives is `rgba(242,232,220,0.55)`, a color alpha in the Open Graph image, and
`0.55 * d("transfer")` in `scoring.ts`, which is the capabilityTransfer coefficient that Part B4
specifies. Neither is the v1 abstention damping constant, and changing the second would violate the
spec it came from.

**Bug found by the release battery: the roadmap could exceed its cap.** Part B8 caps recommendations
at 5 and separately guarantees that underexposed respondents always receive the exposure entry. The
implementation applied the cap and then appended the exposure entry past it, so every underexposed
respondent received 6 cards. The signal loop now reserves a slot when the profile is underexposed.
Checked across 100 persona and usage and answer-shape combinations: maximum 5, zero over cap, and
zero underexposed profiles missing the exposure entry.

**Full battery, all green.** Typecheck clean. 29 of 29. Branch checks pass. Lint clean. No em-dash or
en-dash characters anywhere in `src/`. Production build compiles. All twelve persona and usage
combinations submit through the live API and return coherent results. The public PDF endpoint, the
admin single report and the admin bulk report all return valid PDFs, including for a legacy record
with no `engineVersion` field.

**What still needs a human.** Two things in this build were verified structurally rather than by eye,
and both are worth ten minutes before release: clicking a full assessment run in a browser as each
persona (the screen list itself is verified exhaustively by `tests/compass/branches.ts`, but the
interaction was not clicked), and looking at the rendered `/dev/fixtures` page and a generated PDF
for visual quality rather than structural correctness. The one visual pass that was done, rendering
the gated cover to an image, immediately found a real defect, which is the argument for doing the
rest.

## Post-release fix: the missing .nfc wrapper

**Symptom reported.** The landing page rendered as unstyled text, and on the setup screen no role
could be selected; only the Back button appeared to work.

**Cause.** Every selector in `src/app/compass.css` is scoped under `.nfc`, which exists so the design
system never leaks into the Tailwind based `/admin` route. The v1 `CompassApp` returned a single
`<div className="nfc">` wrapping all screens. When Phase 2 restructured the component into early
returns per screen, that wrapper was dropped. The stylesheet was still built and served in full, but
matched nothing, so the entire design system silently failed.

That also explains the selection symptom, which was never a broken click handler: choosing a role did
set state, but `.role.sel` had no styling to apply, so there was no visible feedback, and the enabled
Begin button looked identical to the disabled one.

**Fix.** Every screen is now returned through a `shell()` helper that wraps it in `.nfc`, with a
comment recording why. The v1 hero layout was also restored: brand bar with the ICAN logo, the two
column hero with the report preview, the three research statistics, and the report gallery, all
carrying v2 content and copy. `IcanLogo` and `ReportPreview` were brought back into `Visuals.tsx`,
the preview rewritten to show a developmental index and stage rather than v1 axes.

**Why the automated battery missed it.** Every check was structural: typecheck, the validation suite,
branch coverage, page fill, HTTP status, chunk integrity. None of them can see that a stylesheet
matches no elements, because nothing about that is a type error, a failed assertion or a bad status
code. This is precisely the gap flagged at the end of Phase 8 as needing a human in a browser, and it
was the first thing a human in a browser found.

**Second issue fixed at the same time.** A stale `sessionStorage` draft could restore a respondent
onto the gate or results screen. Both depend on a submission and a result held only in memory, so a
reload landed on a form whose button genuinely did nothing. Only `setup` and `quiz` are resumable
now, and a gate with no submission returns to the start rather than rendering an inert form.

**Also corrected.** A production build was run while `next start` was serving the previous build, and
two server processes were left competing on port 3000. Next.js serves chunks by content hash, so the
browser held a page requesting filenames that no longer existed. Rebuild under a running server, or
leave duplicate servers up, and the page renders while every script behind it 404s.

## Post-release: item clarity pass

**Reported.** "AI walked you through a tough problem yesterday. Today a cousin of that problem
appears in class." A respondent has to decode "a cousin of that problem" before they can answer, and
the question is not about their reading of metaphor.

**Audit.** All 140 prompts and roughly 200 scenario option labels across the four persona banks and
the shared items were dumped and read, then swept programmatically against a list of metaphors,
idioms and vague referents.

**43 rewrites.** Each removes a figure of speech or an unclear referent and says the thing plainly.
The flagged item now reads: "Yesterday AI helped you work through a hard problem step by step. Today
in class you are given a different problem that uses the same method." Others included "AI
explanations evaporate on me", "so the skill stays warm", "until it clicks", "I could grind through
it", "generic beats nothing tonight", "what each scenario breaks two years out", "Adoption is the
metric; we adopted", "purely transactional", "from zero", "I would be exposed", and "I trust it into
my classroom", which was also ungrammatical.

**Kept deliberately.** "Misses the point", "a blank page" and "exposed a real weakness" are ordinary
English rather than figures of speech, and rewriting them would make the items stiffer without making
them clearer.

**Context lines added.** `Item` gained an optional `context` field, rendered under the prompt in a
quieter style. 15 items per persona now carry one. They clarify what is being asked and never argue
for an answer: the transfer scenarios say the question is about whether the method stayed with you
rather than whether you recall the answer; the independence scenarios ask for what would realistically
happen rather than what you would hope; the outcome items explain that the last option means you
cannot tell yet and is excluded from scoring rather than counted as neutral; the usage item states
that any tool counts and that the answer is never scored up or down; the responsible use scenarios
say plainly that nothing is reported to anyone.

**Verification.** Typecheck clean, 29 of 29, branch checks pass, no dashes in any item file, and the
production build compiles. Item ids and construct mappings are untouched, so stored answers and every
scored result remain comparable across the change.
