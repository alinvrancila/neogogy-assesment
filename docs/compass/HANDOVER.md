# Handover, 6 September 2026

State of the launch work after the September product audit. Written so any
session, this one or a new one, can pick up without re-deriving.

## Start here, in a fresh session

Read this file, then `git log --oneline -25`. The next piece of work is **B3,
report URLs**, specified below. Everything needed to do it is in this document
and in the tests.

## Where to look first

- `tests/compass/audit.ts` ties each fix to its numbered audit finding.
- `tests/compass/placement.ts` holds the scoring guarantees across all seven sets.
- `git log` carries the reasoning; commit messages are the design record.
- `npm run test:audit` and `test:placement` are the two suites that fail loudest
  if a launch-blocking behaviour regresses.

## Done, verified, live

| Audit item | What changed |
|---|---|
| P0-1 / #1 | Retake history matches on persona as well as email |
| P0-2 / #2 | `/privacy` and `/terms` published, linked from form and homepage |
| P0-3 / #3 | Stage descriptions have dependence and disconnection variants; the report names the lean |
| P0-4 / #4 | First step derived from the constraint, 20 entries in `src/engine/firstStep.ts` |
| P0-6 / #7 | Counts and durations derived from the item bank |
| P0-7 / #6 | Capability map and bars read one direction; labels fit |
| P1-2 / #8a | Question 34 rewritten onto a duration scale |
| #9 | Contradiction disclosed, `divergence` section |
| B2 | Asymmetry stated in the honest-limits section |
| C1 | Resolution caveat; borderline copy is directional |
| C4 | Minister: both risk directions, five-point symmetric scales, stage 1 renamed, Stott cited primarily |
| A2 | Evidence floor at 60 percent, plus a two-item minimum per dimension |

Two engine changes also shipped, both proved byte-identical on the regression
snapshot for complete submissions: the index counts only dimensions with
evidence, and gates cannot be satisfied by an unevidenced dimension.

## Not done, in the order I would do them

1. **B3, report URLs.** Approved and specified. The privacy notice already
   describes the mechanism, so the notice is currently ahead of the product.
   Needs: token on the record, a report route, "email me my link" (sends only to
   the address on file), "get a new link" (invalidates the old), noindex, strict
   referrer policy, token stripped from analytics and logs. Link lifetime equals
   retention: 24 months from last completed assessment.
2. **E, the naming sweep.** Decided: one product name, per-persona versions
   become editions, `HAS` stays internal and off the site. Touches report
   mastheads, share text, metadata. Do it in one pass, not twice.
3. **D1**, a "For schools and organisations" page with an interest form.
4. **C3**, replace shared items 32 to 34 with persona-specific ones, keeping
   length; run a coverage check so no dimension drops below its item minimum.
5. **C2**, abstention options. Content comes to the client for review first,
   with a per-option score table. Rule: score by item context, dimension-aware,
   never by surrounding answers, never as neutral.
6. **Minister question count.** Decision says align to about 35 screens, from 42.
   That is seven items out of the strongest set; bring the seven for review
   rather than cutting them unilaterally.

## Traps and corrections

- **Three audit findings did not survive checking.** Minister stage descriptions
  were already bespoke; the Minister edition does have both calibration
  questions; stage 9 is reachable, its index band is just eight points wide so a
  random sweep misses it. Do not "fix" these.
- **The audit predates the evidence fix.** Its section 10 profile table was
  measured before sparse submissions were refused, so re-run it before relying
  on those numbers.
- **Deploy polling.** Several times I polled production for a string that only
  appears on a client-rendered screen and concluded the deploy had failed. Check
  a server-rendered string, or drive a browser.
- **`npm run build` while `next dev` is running** replaces `.next` and breaks the
  dev server. Restart it after a build.
- **Scratchpad tooling is fragile.** `canvas` no longer compiles; use
  `@napi-rs/canvas` with the `Factory` shim in `raster.mjs`.
- **The regression snapshot is the safety net** for any engine change:
  `npx tsx tests/compass/dump.ts` before and after, and diff.

## The backup document

`npm run export:backup` writes the whole instrument to a Word file on the
Desktop: the architecture and this handover, every question in every edition as
a respondent sees it with its scale and its scoring values, and the full source
of the engine and the item banks. It is generated from the code, so it cannot
drift from what runs. Re-run it after any change to the items or the engine.

## Open questions for the client

- Confirm the three processors named in the privacy notice, and that each has a
  processing agreement.
- Version 2 target date for the two-axis continuum (B1).
- Completion count that triggers the stage boundary review (C1).
