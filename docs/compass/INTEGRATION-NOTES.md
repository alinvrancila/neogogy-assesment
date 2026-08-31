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

## Post-release: expanded results, charts and improvement plan

**Continuum now shows the whole ladder.** The results page renders a half-page vertical ladder with
all ten stages named, the current stage highlighted and described, the next stage marked, the gate
requirements for the relevant stages shown, and the earned stage flagged separately when gating has
capped the placement. Stages below are dimmed rather than hidden, so a respondent can see the shape
of the whole path.

**Report grew from about 3,600 to about 31,000 characters.** Every section was unpacked. Each of the
ten dimensions now carries what it measures, why it matters, the reading for that respondent's band,
a divergence note where a consistency gap fired, a confidence note where evidence is thin, a research
line, and three concrete practices. The bottleneck explains why it is the constraint rather than
simply the lowest score. The continuum section names every stage, describes what this one looks like
and the trap that comes with it, and explains the gates. Help, harm, strengths and self-knowledge
each gained real explanation of what the section is doing and how to read an empty result.

**Two new sections.** An improvement plan on three horizons (this week, 30 days, 90 days) assembled
from the bottleneck, the fired recommendations, the next lowest dimension and the next stage
requirements; and an evidence section stating the instrument's central claim, the studies it cites,
and two honest limits.

**Evidence policy.** Only three studies are cited by name, because only those three are vetted in
this repository: HEPI / Kortext 2025, Bastani et al. PNAS 2025, and Kestin et al. Scientific Reports
2025. Everywhere else the report points at a field of research (retrieval practice and transfer,
cognitive load, design fixation, metacognition, fluency effects in judgment) rather than inventing a
paper, an author or a number. `src/engine/content.ts` holds this and states the policy in its header.

**New charts, one colour vocabulary.** Teal for strong at 65 and above, amber for developing from 40
to 64, crimson for watch below 40, used identically by every chart with a visible key. Added:
dimension bars sorted by score with confidence labels, a six card composites panel, and a numbered
plan timeline. The radar is kept alongside the bars. Dependency Risk is displayed as a risk value
while its colour follows the underlying healthy reading, so a colour never means two things.

**PDF kept honest.** The two new sections render there too. Sections became long enough that making
each one atomic stranded pages, so section headings now stay attached to the start of their prose
while the prose flows. Re-measured across five fixtures: reports run 11 to 13 pages with zero
interior pages below 60 percent fill and no dashes.

## Ascent result redesign

**Scope.** The results page was rebuilt around a climbing route motif. No scoring, threshold, gate or
interpretation logic was touched. The only change under `src/engine/` is one display label: stage 10
read "Future-Ready / Generative" and the brief specified "Future-ready / Generative". That is copy,
not logic, and no test asserted the old casing.

**Continuous placement.** `ascent/route.ts` holds the geometry as pure maths with no React and no
scoring. The contract is that fraction along the route equals index divided by 100, measured on true
arc length, so an index of 37.8 sits at 37.8 percent of the route rather than snapping to the middle
of the stage that contains it. Tested directly: 37.8 and 37.9 resolve to different points, 37.8 sits
before the centre of its own stage band, placement is monotonic across the range at half point steps,
and out of range values clamp inside the viewbox.

**Fields that do not exist were omitted, not invented.** The reference designs show an experiment
count, a "on this path since" date, a practice history and a primary focus. None of those are
collected by this assessment. `RouteLogCard` shows only real fields (stage, substage, index, reported
usage category, overall confidence, and how many dimensions reached high confidence) and states
plainly that history and experiment counts become available on a second sitting, rather than
rendering a plausible looking number.

**Dependency risk.** Shown as a risk with the words "Lower is healthier" and the underlying
independent capability printed beside it. Its micro-state follows the healthy reading rather than the
risk number, which is asserted in the suite so a high risk can never render as a strong dimension.

**Meaning is never carried by colour alone.** Every foothold row prints its status as words
(Strength, Developing, Needs attention) next to the dot, every gate prints Open or Not yet open, and
the map legend labels each mark.

**Three defects found by looking at renders rather than by tests.** The map was first squeezed into
the prose column, which scaled 11px labels down to roughly 5px; the ascent block now breaks out to
the full page width. Stage labels anchored to the terrain collided wherever the route steepened, and
stage 1 clipped at the left edge; labels now sit in two fixed bands with leader lines and clamped x.
The summit beacon collided with the stage 10 label, and the two gates that bind at stage 6 drew on
top of each other; both now offset.

**Responsive.** Below 860px the map keeps its label sizes and scrolls horizontally rather than
shrinking ten names into illegibility, verified at 390px wide: the map scrolls, the body does not,
and the lower modules stack as Foothold, Route log, Next climb in that order. Keyboard focus on stage
and gate items was verified in a real browser. All motion is disabled under prefers-reduced-motion,
and there is no score counting or celebratory effect anywhere.

**New tests.** `npm run test:ascent`, 12 checks covering continuous placement, monotonicity, clamping,
the ten stage labels, current and next stage rendering across every persona and usage level, the
stage 10 case where no next ledge exists, dependency risk directionality, and that every practice
gate maps to a real construct and a real stage threshold.

## Retake benchmarking and the terrain pass

**Repeat attempts are matched on email.** `src/lib/history.ts` finds prior engineVersion 2 records
for the same address (trimmed, lowercased), compares the current result against the most recent one,
and returns index movement, stage movement, days elapsed, attempt number and per dimension deltas.
The lookup runs before the new record is saved, so it can never compare a result against itself.

**Reversed scales are handled explicitly.** Dependency Risk is compared as a risk, so a fall counts
as an improvement and a rise does not. Both directions are asserted in the suite, along with the case
where nothing moved (no dimension may claim improvement) and the case where a stored record has no
result (no comparison rather than a broken one).

**What the respondent sees.** A "Since your last ascent" section stating whether they climbed, held
or moved down, the index and stage movement, and two columns for where they gained and where they
slipped. On the map, the previous position renders as a dashed ghost marker labelled with the earlier
index and joined to the current marker by a dashed connector carrying the change. A "Come back and
climb it again" panel explains that returning with the same email is what makes the comparison
possible, and suggests eight to twelve weeks as a useful gap. Language stays in the movement register:
a decline says "you have moved down the route", never that anything failed.

**A privacy point worth deciding on.** Matching on email alone means anyone who enters an address can
see the movement summary for prior attempts under that address. The exposure is limited to indices,
stages and dimension deltas rather than the full prior report, but it is real. This was built as
asked; if these results are ever sensitive, the fix is to verify ownership of the address (a link
sent to the inbox before the comparison is revealed) rather than to weaken the feature. Flagged rather
than silently mitigated because it changes the flow.

**Storage note.** `priorAttempts` uses `listLeads`, which is a full scan on DynamoDB. Fine at current
volume; if lead counts grow this wants an email index rather than a scan.

**Terrain pass.** The smooth ridge polygons were replaced with generated jagged ranges: three layers,
deterministic pseudo-random so server and client render identically, with rock gradients, snow caps
on the high peaks, a compass rose, a vignette and an feTurbulence paper grain over the panel. The
nearest range now follows the route itself, so the climber reads as walking a ridge crest instead of
having a peak drawn in front of them, which was the main thing making the earlier version look like a
filled area chart.

## Painted treatment, unified page, matching PDF

**The illustration is generated, not sourced.** `scripts/art/backdrop.svg.mjs` builds a painterly
mountain scene in SVG (four ranges with deterministic jagged silhouettes, aerial haze bands,
displacement-mapped painterly edges, dry-brush streaks, watercolour granulation and a vignette).
`npm run art:backdrop` rasterises it once with headless Chrome to `public/ascent-backdrop.jpg`.
Nothing was licensed, downloaded or fabricated from an external source, and the asset is
reproducible from the script.

**It is decorative and carries no data.** The backdrop sits at the bottom of the layer stack. Every
stage label, camp, gate, route point, marker and score is drawn live on top of it, so a change in the
data always changes the drawing. A light gradient scrim sits between the illustration and the label
band. The scrim was first drawn last, which washed out the labels it was meant to protect; it now
renders before any live element.

**Labels on terrain get a halo.** Basecamp, the previous-attempt marker and the movement chip sit
over dark painted rock, so they carry a paint-order stroke in the page colour. Without it they were
grey on brown and unreadable.

**One continuous design.** The whole results page now uses the ascent ground and card system:
sections became parchment cards with oxblood headings, and the charts moved onto the ascent palette
(teal, gold, coral). The radar left its navy slab for the same parchment card as everything else, so
the map, the charts and the prose read as one document rather than three.

**The PDF matches.** Same painted backdrop on the cover and the closing page, same palette, same
title, the index disc and the continuum strip rendered as vectors over the illustration. The cover
footer sits on a light plate because it overlaps the painted area and was previously dark on dark.

**File size mattered.** The first backdrop was a 2.8 MB PNG, which pushed every emailed report to
about 2.9 MB. The scene is photographic and needs no transparency, so it is now an 85 KB JPEG at
quality 82, and reports are back to roughly 185 KB.

**Verified.** Typecheck, lint, 29 of 29 engine, 17 of 17 ascent, branch checks and the production
build all pass. PDFs re-measured across five fixtures: 11 to 13 pages, zero interior pages below 60
percent fill, no dashes.

## Clarity and flow pass on the results page

**The real problem was structure, not wording.** Dumping the page in reading order showed two
parallel structures talking over each other. Position was stated twice (the ascent map and then a
continuum section), the next stage twice, advice three times (next climb card, roadmap, improvement
plan), the retake invitation twice, and the reader was handed two separate identities: a stage and,
further down, an archetype presented as a second verdict.

**One arc now.** The ascent block owns "where am I" and "what is next". The narrative sections that
repeated those are no longer rendered on screen (the PDF still carries them, since a document can be
more complete than a screen). What remains runs as a single argument: what your answers say, why you
are at this stage, the ten dimensions behind that, what is helping and what may be hurting, what you
do well and what needs attention, how your own sense compares, what to do in order, the practices in
detail, and finally what this rests on. A short connective sentence introduces each major move, so
the reader is told why they are being shown the next thing.

**The second identity is gone.** The archetype is now folded into the opening section as "the
pattern your answers match most closely, not a label for who you are", rather than appearing as a
rival headline to the stage.

**A false ending was removed.** The retake invitation sat in the middle of the page, reading as a
closing call to action while the report continued below it. It now closes the page. The next-climb
card says explicitly that the full plan is further down, so the two are read as a first step and a
complete plan rather than as competing advice.

**Plain language throughout.** Section titles became questions a reader would actually ask ("Why you
are at this stage and not the next one", "How your sense of it compares with your answers"). The
developmental index is glossed the first time it appears. The substage is written out ("you are
moving toward the next stage") instead of the word "transitioning". The six composites are now
phrased as the questions they answer, with an explicit note that on two of them lower is better. The
consistency gap, confidence levels and calibration are all described in ordinary words. A sweep
across the whole report for a jargon list now returns only glossed-on-first-use terms, a false
positive on "reconstruct", and field names inside research citations.

**The books were added.** The two Neogogy titles from ican.ph/books appear in the evidence section
under "Where the framework itself comes from", deliberately separated from the three research
studies. They are the source texts for the model this assessment implements, written by its author,
and presenting them as independent evidence for it would overstate the case.

**Test improved rather than weakened.** Renaming sections broke the report smoke test, which matched
old title strings. It now asserts section keys, that every section has a title and content, and that
each title appears in the composed report, so a heading can be rewritten for clarity but a section
cannot silently disappear.

**PDF re-measured** after the content changes: graphics trimmed slightly so the continuum block fits
beside the profile section, giving zero interior pages below 60 percent fill again.

## Landing and setup pages rebuilt for v2

**The landing page now shows the thing it is selling.** It leads with the painted route as a wide
band, then lays out all ten stages with their names and one-line descriptions, so nobody starts the
assessment without knowing what the route is or where they might land. Below that, a "what you get"
section shows the dimension bars and the radar.

**The preview is a real result, labelled as an example.** `page.tsx` computes it server-side from one
fixed set of illustrative answers using the same engine that scores respondents, and it is tagged
"Example profile, not your result" on the card. Nothing on the landing page is an invented number,
and no scoring happens on the client.

**Layout bug worth recording.** `.nfc #hero` was `display: flex` from v1, when the hero was a single
centred block. The new landing page is a stacked document, so its sections were laying out as flex
columns side by side, with the headline breaking one word per line. `#hero` is now a normal block.

**The setup page tells people what they are choosing.** Each of the four roles is a card carrying who
it is for, what the questions are about, and three concrete examples drawn from the actual item bank
for that persona (essays and exams for students, lesson planning and student data for teachers,
homework and screen time for parents, board work and personnel decisions for leaders). Selecting one
confirms the choice in words underneath. Four cards sit as a balanced two by two rather than a row of
three with one stranded.

**A "before you start" panel makes the case for honesty.** It states plainly that answers are not
shared with any teacher, employer or school, that there is no pass mark, that the situational
questions carry more weight than the self-descriptions, that reverse-worded questions are marked,
that the "not enough experience to say" option is excluded rather than counted as neutral, and that
returning with the same email shows movement over time, which only works if both readings were
honest. That last point ties the honesty argument to the retake feature rather than just asserting it.

## Legibility, alignment and responsive pass

**The map was carrying four labels in one spot.** With the current position, the next stage and a
previous attempt all falling close together, "YOU ARE HERE", "NEXT LEDGE", the movement figure and
the previous index stacked on top of each other and on the terrain. Three of the four are gone from
the map:

- The next-ledge chip was removed. The camp for the next stage is already ringed in teal and its name
  is already teal in the label band, so the chip was repeating what the map showed.
- The movement figure was removed. The comparison card states it in full, larger, a few centimetres
  below.
- The previous-attempt label now only appears when it has room (eight index points of separation),
  and the connector only when there are four. Below that, the ghost ring alone marks the spot.

The one remaining callout now carries the number, so the map states position once: "YOU ARE HERE ·
67.6". It is clamped so it cannot run off the panel when the climber sits near either end, with a
short leader back to the marker.

**The illustration is the setting, not the content.** A light wash over the painted backdrop, and a
pale halo under the route, put the live layer first to the eye. Before this the teal route competed
with dark painted rock.

**Home page alignment.** The hero had its own horizontal padding while every section below used the
page container, so the headline started at a different left edge from everything under it. The hero
copy now sits in the same container, and all left edges line up down the page.

**Responsive.** Checked at 390, 820 and 1280 with a script that reports document overflow and names
any element extending past the viewport. All three are clean on both the landing page and the result.
Fixed along the way: the index caption could not shrink and ran off the right edge on a phone; the
ascent header's 460px flex-basis became 460px of dead height once the header stacked; the brand bar
had no room for its wordmark beside the logo under 560px; and a v1 rule stacked the hero buttons full
width from 820px down, which made two full-width bars on a tablet where side by side fits fine.

**Also verified on a phone:** reduced motion disables animation, keyboard focus reaches stages and
gates, the lower modules stack in the specified order, and the map scrolls horizontally rather than
shrinking ten stage names into illegibility.

**Process note, twice now.** Running `npm run build` while `next dev` is serving replaces `.next`
underneath it and the dev server starts returning 500s with MODULE_NOT_FOUND. It looked like the map
component had broken. Restart the dev server after any build, or the probe results are meaningless.

---

# The Business Owner persona

## What the code looked like before this change

Recorded before touching anything, because the persona had to fit the existing
shape rather than the shape being bent around it.

- **Persona union** is declared once in `src/engine/types.ts` and enumerated by
  hand in ten other places: the item registry (`scoring.ts`), the API validators
  (`api/submit`, `api/report`), the assessment UI (`CompassApp`), the dev
  fixture pages, `lib/leadResult.ts`, `items/shared.ts` (context lines),
  `engine/legacyAdapter.ts`, `engine/narrative.ts` and the admin filters.
- **Item banks** are one file per persona under `src/items/`, built through
  three factories in `items/shared.ts` (`claim`, `reverse`, `scenario`). Shared
  items (usage, two baselines, three outcome items, the low-use reason and two
  high-use probes) are appended to every persona by `applicableItems`.
- **Construct names and copy** were read straight from `CONSTRUCTS` in
  `engine/config.ts` and `CONSTRUCT_CONTENT` in `engine/content.ts` by the
  narrative, the results page, the PDF and the admin. Nothing was per-persona.
- **Archetypes, patterns and recommendations** are flat arrays and one library
  object, all persona-blind.
- **Scoring** weights by item type (scenario 1.6, outcome 1.2, claim and reverse
  1.0), fires a risk signal when a healthy value lands at 2 or below, and caps
  confidence rather than penalising scores at low usage.

## Judgment calls

**The three generic outcome items are withheld from this persona.** They ask
about beginning difficult tasks, explaining ideas, and persisting on hard
problems: all about a person's learning. The business bank carries its own ten
impact items instead, one per dimension, so `applicableItems("business", u)`
returns forty items plus branches rather than forty-three. Every other persona
is untouched.

**Display, not data.** Construct ids, weights, gates, and the index calculation
are identical for business. Only the words change, through one per-persona
display map. This keeps a business result comparable with the rest of the
instrument and means a single scoring change cannot drift between personas.

**Reported inversion stays where it was.** `dependencySafety` remains the
healthy reading internally and is reported inverted, as Continuity Risk rather
than Dependency Risk. The engine did not need to know.

## More judgment calls, recorded as they were made

**Business stage names.** The brief asked for business stage names without
listing them. The ten map one to one onto the existing stages and keep their
meanings: AI Absent, AI Aware, AI Trialling, AI Adopting, AI Operational, AI
Integrated, AI Deliberate, AI Advantaged, AI Adaptive, AI Compounding. They
describe the business rather than a learner, which is the point of the persona.

**Impact items score on their own scale.** The brief specifies four substantive
anchors plus a way out. Scored on the five point mapping, the best available
answer would have been worth 75 rather than 100, quietly penalising every
business on every impact item. `to100` now normalises by the item's own top
value. Nothing else changes: every existing item runs on a five point scale, and
the regression dump is byte-identical.

**One option can raise more than one signal.** The brief assigns two tags to some
scenario options. Items previously carried a single tag, so `ItemOption` gained
an optional `signals` array. Both mechanisms fire together.

**The Deliberate Adopter fixture clears the stage 5 fluency gate.** Built with
fluency at a low level, this owner is held at stage 4 by the gate, not by the
index, however strong the judgment readings are. That is the gate doing exactly
what it was designed to do, so the fixture uses a working fluency level. An
owner who says "we know where these tools fit and they do not fit here yet" is
claiming competence, not distance.

**Business context lives in `meta`, not in new columns.** The lead record has no
company or organisation field. `modality` exists and is unused, but it is
surfaced in the admin and the export under its own name, so putting a company
name there would mislabel it. `meta` is the record's existing free-form metadata
field, so the four optional fields live at `meta.business` as a small object. No
schema column was added.

**Scenario options are shuffled per respondent.** Display order is seeded from
the session id and the item id, so the same person always sees the same order and
two people see different ones. Scoring reads the option value, so order cannot
affect a result. Only scenarios shuffle: a scale or a branch keeps its written
order, where sequence carries meaning.

**Known cosmetic limitation.** A long flowing report can end its text pages with
a short spill, a few lines on an otherwise empty page, before the register and
plan pages begin. This is a property of flowing pagination rather than of the
business persona (the existing personas do it too), and fixing it properly needs
orphan control that react-pdf does not offer.

## Two levels inside one assessment

The persona was assessing two subjects at once without saying so. Three
dimensions ask about the owner, seven about the business, and a reader with no
way to tell them apart reads the whole thing as a personal verdict.

**The split.** Owner: Owner Decision Ownership, Business AI Fluency, Strategic
Amplification. These read how the owner decides, how they think, and how well
they fit tools to work. Business: Verification Before Consequence, Operational
Continuity, Institutional Knowledge Capture, Team Capability Growth, Business
Adaptability, Governance, Data and Trust, and Market Differentiation. These read
how the business runs when the owner is not in the room.

Fluency sits on the owner side deliberately. It measures whether this person can
name a process, a number, and an owner before automating, which is an operator's
competence applied to the business rather than a property of the business.

**Where it is said.** On the persona card, on the context screen, on a chip
above every question, as two labelled blocks with their own averages on the
results page and in the PDF, and on the PDF cover, where both averages appear
before an owner has read anything else.

**The cover changed with it.** The business report no longer opens on the dusk
photograph. Deep navy, one teal rule, the score set large, the two level
averages beside each other, and a lot of white space, because this document gets
forwarded to an accountant or a board and has to look like a business paper.

---

# The Minister/Preacher persona

## The quotation constraint, and how it was resolved

The brief says every quotation must be verified against source documents placed
in `docs/compass/sources/pastor/`. They were not present when the persona was
first built, so it quoted only the passages supplied in the brief itself and
named every other source without quoting it.

**The documents are now in place**, and every quotation has been checked against
them. `npm run test:quotes` does that check on every run: item pointers,
dimension content, archetype narratives, and the closing Scripture. Two pointers
did not survive it and were replaced with the documents' own words: an Aristotle
line and a line from Good Will Hunting, both from an epigraph list that is not
among the files. Several other pointers were widened from naming a source to
quoting it, now that the words could be seen.

Scripture provenance is written down in `sources/pastor/scripture-nlt.txt`: which
verses came from the brief, which are quoted inside the documents, and which
references are cited without quoting because their wording could not be checked
against anything held here. The closing verse for each archetype now comes from
one of the first two groups.

One quotation is trimmed rather than altered. Spencer sets a clause between em
dashes, which this persona's copy rules do not use, so the quoted run stops
before the dash and the rest is described. Altering the punctuation inside
quotation marks would have been the wrong fix.

So the persona quotes only the passages supplied verbatim in the brief itself,
attributed exactly as the brief attributes them. Every other pointer names a
title, a section, and what it offers, without quoting words I could not check.
Scripture is quoted only where the brief supplied the New Living Translation
wording; elsewhere the reference is cited with a short description of what it
speaks to.

That constraint is deliberate rather than a shortfall to be tidied later. This
report tells a preacher never to preach a quotation they have not seen in its
source. It cannot hold itself to a lower standard than it asks of its reader.

`docs/compass/sources/pastor/README.md` lists the documents and names the two
files to widen once they are in place: `src/items/pastor.ts` (the `deeper`
pointers) and `src/engine/display.ts` (`PASTOR_CONTENT`).

## Judgment calls

**Pastor stage names.** Not specified. The ten map onto the existing stages and
describe a preacher's practice: Set Apart, Watching, Trying, Practising, Working,
Integrated, Discerning, Anchored, Renewing, Rooted and Fruitful.

**A formed position is never answered with "use it more".** The brief asks that a
settled conviction reach the same stages as any other position. It also lists,
for the Deliberate Minimalist, that no exposure-first advice appear. The engine
previously led with the bottleneck's recommendation, which for a low-fluency
profile is the exposure entry. It is now suppressed when a pastor is
intentionally selective. Scoped to this persona so nothing else moves.

**The three generic outcome items are withheld,** as they are for the business
persona: they ask about a person's learning, and the ten formation items ask
about a ministry.

**The reflection prompts arrive with the submission and leave with it.** They are
answered after the last scored item, they feed only the Dependence Check, and
because this persona stores nothing at all they are never written anywhere.

**Anonymity is enforced in three places, not one.** The browser scores and
renders without a network call. The PDF route computes and returns a file and
imports nothing from the storage layer. The submit route refuses this persona
outright. The test suite asserts the refusal, asserts the stored records are
byte-identical afterwards, and asserts the PDF route's source contains no
storage call at all.

## The anonymity decision, reversed

The persona was built anonymous, at the brief's instruction and for a reason
written down at the time: a minister answering honestly about prayer and
dependence is exposed in a way no other respondent is.

The owner has since decided the check should follow the same path as every other
persona, with an email gate and a record in the admin. That is their call, and it
is implemented in full: the gate, the stored record, the emailed PDF, and the
fields in the admin.

Two things were kept from the original design, because they cost nothing and
answer the concern that produced it. The admin carries a standing note asking
staff to treat these records with more care than the rest. And what a preacher
can post carries no finding at all: the prepared posts say the check was taken
and, where the answers support it, that the practice met the standard, with no
score, stage, archetype, or dimension. The suite asserts that on a strong reading
and on a weak one.

**On the word certification.** The request was for something that reads as a
certification of AI safety. What is implemented says the practice met a standard
for responsible use, on the date it was taken, and says plainly on the page that
this reads self-reported habits rather than certifying that any use of AI is
safe. A claim the instrument cannot support would be worth less to the pastor
making it than the one it can.

## The dimensions stay shared, the reading is ministerial

The persona originally renamed all ten dimensions (Authorship Before God,
Faithfulness to the Text, and so on). That read as ten new dimensions rather than
the same ten seen through a vocation, so the names have gone back to the ones
every other assessment uses.

What was ministerial is still ministerial. Each dimension now carries a one line
lens under its name (`PASTOR_LENS` in `display.ts`), and everything downstream of
the name (what it measures, the reading at each band, why it matters, the
practices, the healthy marker, the patterns, the archetypes, the roadmap, the
reflections) is written for preaching. The dimension block says so in as many
words, so nobody reads a shared name as a generic reading.

If the renamed dimensions are wanted back, restoring `constructNames` in
`PERSONA_DISPLAY.pastor` is the single change; the accessor already falls back
when it is absent.

## The cover

The minister cover had no motif: type on a plain ground. It now opens on an
arched chapel window with morning light through it, drawn procedurally by
`scripts/art/pastor-cover.svg.mjs` and rasterised by `npm run art:minister`. No
photograph and no people, so the report belongs to whoever is holding it, and the
motif is ministerial without being denominational.

The bands the type sits on are part of the artwork rather than panels laid over
it, because react-pdf cannot draw a gradient on a view and a flat panel leaves a
hard edge across the page.
