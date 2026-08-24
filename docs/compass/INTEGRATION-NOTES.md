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
