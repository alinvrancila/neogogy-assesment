# Migration: dropping v2 into the v0.1.2 codebase

This package was built without live repository access, against the v0.1.2 specification (which documents the implementing files, data shapes, and stored records exactly). The mapping below is therefore precise on the engine side and directional on the UI side; run it with Claude Code inside the repo on branch `feature/assessment-complexity`.

## Keep / change / remove / replace map

| v1 file | Action | v2 counterpart |
|---|---|---|
| `src/data/compass.ts` | Replace | `src/items/*` (persona banks + shared) and `src/engine/config.ts` (all constants). Persona content is no longer pronoun substitution over one item set. |
| `src/lib/engine.ts` | Replace | `src/engine/*` with `compute()` in `src/engine/index.ts`. Still isomorphic, still pure. |
| `src/components/compass/CompassApp.tsx` | Change | Flow gains two adaptive branches: `LOW_USE_REASON` when usage <= 2, `HIGH_USE_PROBES` when usage >= 4. `applicableItems(persona, usage)` returns the exact screen list after the usage question. Keep auto-advance, keyboard input, and back navigation; keep the reverse-item caution note. Drop the ★ decoration and the unrendered `liveEstimate`. |
| `src/components/compass/Results.tsx` | Change | Render from `CompassResult`. Decision needed from you, Alin, not from code: the fully implemented results screen is currently unreachable behind the email gate; either unlock it after email submit or keep report-by-email only, but remove the dead path. |
| `src/components/compass/Visuals.tsx` | Change | Quadrant map is replaced by the 10-stage continuum visual (current position, next stage, advanced target), the radar stays (10 dimensions), and the climb-path line generalizes to "current stage to next stage" for everyone including the top stage, where it becomes the maintenance loop. |
| `src/lib/reportPdf.tsx` | Change | Page plan: cover; continuum position; dimension signature; help and harm; bottleneck and next stage; roadmap; closing. `generateReport()` provides all copy so the PDF layer holds no narrative logic. |
| `src/app/api/submit/route.ts` | Change | Call v2 `compute()`. Persist the same envelope plus `engineVersion: 2` and the full `CompassResult`. Keep storing raw answers; that policy is what makes rescoring possible. |

## Retroactive rescoring of historical submissions

`src/engine/legacyAdapter.ts` exposes `rescoreLegacy(record)` for every stored v0.1.2 record (raw answers, usageVal, B1, B2 are all retained per spec §6.2). Mapping: v1 agency, judgment, integrity, fluency, creation, adaptability map 1:1; v1 attention maps to independent capability; v1 memory to transfer; v1 transfer to skill growth; v1 collaboration folds into responsible use. Amplification and skill-growth-specific evidence did not exist in v1, so rescored legacy records carry preliminary or insufficient confidence on those dimensions by design; do not backfill certainty. Suggested batch job: iterate the leads table, `rescoreLegacy`, store the v2 result alongside the v1 persona, and offer past respondents an updated report as a re-engagement touch.

## Run

    npm install
    npx tsc --noEmit          # type check
    npx tsx tests/synthetic.ts # full validation suite (29 checks)
    npx tsx tests/demo.ts      # sample rendered report
