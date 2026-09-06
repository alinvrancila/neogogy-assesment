# Handover, 6 September 2026

State of the launch work after the September product audit. Written so any
session, this one or a new one, can pick up without re-deriving.

## Start here, in a fresh session

Read this file, then `git log --oneline -25`. B3 is built. The next piece of
work is **E, the naming sweep**, specified below. Everything needed to do it is
in this document and in the tests.

## Where to look first

- `tests/compass/audit.ts` ties each fix to its numbered audit finding.
- `tests/compass/placement.ts` holds the scoring guarantees across all seven sets.
- `git log` carries the reasoning; commit messages are the design record.
- `npm run test:audit` and `test:placement` are the two suites that fail loudest
  if a launch-blocking behaviour regresses. `test:link` is the third: it holds
  the report link closed and exercises storage for real, in a temporary working
  directory, so it never touches `data/`.

## Done, verified, live

| Audit item | What changed |
|---|---|
| P0-1 / #1 | Retake history is scoped to one assessment, not just one email |
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
| B3 | Report URLs. Token on the record, `/r/<token>`, both controls, noindex, no referrer, token kept out of exports, events, admin payloads and the nginx log |
| P0-1, again | The scoping above matched on the wrong field and returned nothing at all. Now fixed and asserted behaviourally. See the traps |

Two engine changes also shipped, both proved byte-identical on the regression
snapshot for complete submissions: the index counts only dimensions with
evidence, and gates cannot be satisfied by an unevidenced dimension.

## Not done, in the order I would do them

1. **E, the naming sweep.** Decided: one product name, per-persona versions
   become editions, `HAS` stays internal and off the site. Touches report
   mastheads, share text, metadata. Do it in one pass, not twice.
2. **D1**, a "For schools and organisations" page with an interest form.
3. **C3**, replace shared items 32 to 34 with persona-specific ones, keeping
   length; run a coverage check so no dimension drops below its item minimum.
4. **C2**, abstention options. Content comes to the client for review first,
   with a per-option score table. Rule: score by item context, dimension-aware,
   never by surrounding answers, never as neutral.
5. **Minister question count.** Decision says align to about 35 screens, from 42.
   That is seven items out of the strongest set; bring the seven for review
   rather than cutting them unilaterally.

## What B3 turned out to be

The notice is the specification: `src/content/legal.ts`, section "Your report
link", was published before the product existed, so every sentence in it is now
checked by `tests/compass/link.ts` against what the code does.

- The token is 32 random bytes, base64url, stored in full on the record. It is
  stored raw rather than hashed because "email me my link" has to resend the
  *same* link, and a hash cannot be turned back into one. That is the reason the
  token is stripped everywhere else: out of the admin JSON payloads, out of the
  CSV export, out of events, out of error lines, and out of the nginx access log
  via a `map` and a `log_format`. The database is the only place it lives.
- Lifetime is not its own policy. `isLive()` reads the person's *last* completed
  assessment, not the record's own date, so a later sitting carries the earlier
  link with it exactly as the notice says.
- Rotation is just a new token on the record. There is no revocation list,
  because nothing will ever match the replaced value again.
- `/r/<token>` is `force-dynamic`, noindex and no-referrer in both metadata and
  response headers, and answers an unknown token identically to an expired one,
  so it cannot be used to learn which addresses were ever real.
- The link is shown on the results screen too, not only in the email. With
  `EMAIL_ENABLED=false`, which is where the deployment still is, the email is
  the only delivery path and the feature would otherwise ship dark.
- Still missing for full retention parity: a scheduled job that actually deletes
  records at 24 months. The link now expires on time; the data does not.
- One decision, one place. `accessByToken` in `src/lib/reportLinkAccess.ts` is
  the only thing that decides whether a link is open: it checks the shape,
  matches the token, dates retention from the person's last sitting, and counts
  a miss against the caller's address. The page and both control routes all go
  through it. An earlier draft had the page carrying its own copy, and a test
  that deleted the expiry check from it stayed green.
- The rate limit is on misses only, so refreshing your own report costs nothing.
  A throttled caller gets its own page, because telling a shared office network
  that a link is dead would be a lie.
- Deployment items, all written up in `DEPLOY.md` under "Report links":
  `deploy/nginx.conf` is installed by the deploy workflow itself, so it needs no
  hand copying, but nothing in it is real until the next push to `main`. And
  `neogogy-leads` has no index on `reportToken`, so
  every report view is a filtered `Scan`. The miss limit is what holds that down
  until there is a GSI. The access log is rewritten by a `map` and a
  `log_format`; the error log cannot be rewritten at all, because nginx appends
  the raw request line to an upstream failure, so `/r/` now terminates in its own
  `location` with `error_log /dev/null crit;`. A restart during a deploy would
  otherwise write live tokens into the one file that gets pasted into a support
  thread.
- While fixing the rate limit it turned out that `X-Forwarded-For` was being
  appended to rather than replaced, and `clientIp` reads the first entry, so
  every IP address in the database was whatever the visitor said it was. nginx
  now sends `$remote_addr`. This also makes the stored addresses, and the
  geolocation drawn from them, mean what the inventory says they mean.

## Traps and corrections

- **A test can pass on the text of a fix while the fix does nothing.** P0-1 was
  listed here as done, verified and live. It was not. `priorAttempts` filtered
  `l.persona === persona`, but on a `LeadRecord` `persona` holds the *archetype*
  ("strategic_integrator"), while the caller passes the *assessment*
  ("administrator"). The filter matched nothing, ever, so `buildComparison`
  always returned null and no returning respondent was ever shown their
  movement. Both `audit.ts` and `placement.ts` were checking for the string
  `l.persona === persona` in the source, so both stayed green for the whole time
  it was broken. Fixed via `assessmentOf()`, which reads the assessment off the
  result; both suites now assert the behaviour instead. Read `role`, or better
  `assessmentOf`, never `persona`, when you mean which assessment a record is.
- **The admin CSV export is broken on the existing data, and was before B3.**
  `src/lib/leadCsv.ts:136` reads `r?.riskRegister.length`: the optional chain
  guards the result but not the field, and 29 of the 30 stored records predate
  `riskRegister` and have no such key. `GET /api/admin/leads?format=csv` returns
  500 on the real dataset. The fix is `r?.riskRegister?.length ?? ''` and the
  same for the five `r ? r.riskRegister...` lines under it, but it was left
  alone because it is not B3 and because backfilling the records may be the
  better answer. It is worth doing before launch either way.
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
- **`npm run build` while `next dev` is running** used to replace `.next` and
  break the dev server. `next.config.mjs` now reads `NEXT_DIST_DIR`, so
  `NEXT_DIST_DIR=.next-verify npm run build` verifies a change without touching
  what is running. Note that a build rewrites `tsconfig.json` to add its dist
  directory to `include`; check `git diff tsconfig.json` afterwards.
- **The build typechecks `tests/` too**, so a loose type in a suite fails the
  build even though `test:*` runs it happily.
- **`next dev` does not reliably reload `next.config.mjs`.** A dev server that
  had been up for hours was serving report pages with no `Referrer-Policy` and no
  `X-Robots-Tag` while the config was correct and its test was green. Verify
  headers against `next start`, not against a long lived dev server:
  `NEXT_DIST_DIR=.next-verify npm run build && NEXT_DIST_DIR=.next-verify npx next start -p 3212`.
- **Grep tests are worth what you paid for them.** Every source-text assertion in
  the B3 work was mutation tested: change the code the assertion is about, and
  check the suite goes red. Several did not, and were rewritten to exercise the
  thing instead. `tests/compass/link.ts` now drives the real route handlers, the
  real storage, the resolved `headers()` and the resolved robots rules. Do the
  same for anything added next: write the assertion, then break the code and
  watch it fail, or you have written a comment.
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
