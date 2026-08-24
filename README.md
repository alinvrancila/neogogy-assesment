# Neogogy Formation Compass

A reflective assessment of a person's relationship with AI, across ten dimensions, placed on a ten
stage developmental continuum.

Next.js 14 (App Router), TypeScript, Tailwind. Storage is DynamoDB when configured and local JSON
files under `data/` otherwise. Email is Amazon SES, off unless `EMAIL_ENABLED=true`.

## Running it

    npm install
    npm run dev          # http://localhost:3000
    npm run build && npm run start

Copy `.env.example` and set at least `STATS_TOKEN` and `ADMIN_PASSWORD`. Leave `LEADS_TABLE`,
`EVENTS_TABLE` and `USERS_TABLE` unset to use the local JSON fallback.

## Checks

    npm run typecheck        # tsc --noEmit
    npm run test:compass     # the 29 check validation suite
    npx tsx tests/compass/branches.ts   # adaptive branch coverage
    npm run lint

## Layout

| Path | What lives there |
|---|---|
| `src/engine/` | The scoring engine. Isomorphic and pure, no I/O, so it runs identically on client and server and can rescore stored records as a batch job. |
| `src/items/` | The four persona item banks plus the shared usage, baseline, outcome and adaptive branch items. |
| `src/components/compass/` | Assessment flow, results experience, visuals. These render; they never score. |
| `src/lib/reportPdfV2.tsx` | The PDF. Layout only: every respondent-facing sentence comes from the narrative engine. |
| `tests/compass/` | Validation suite, branch checks, deterministic report dump, PDF fixture generator. |
| `docs/compass/` | Architecture, audit, migration, limitations and validation plan, integration notes. |

## Documentation

Start at [`docs/compass/`](docs/compass/):

- `ARCHITECTURE.md`, constructs, items, scoring, continuum, archetypes, recommendations
- `AUDIT.md`, what the previous version got wrong and what changed
- `MIGRATION.md`, dropping the engine in and rescoring stored records
- `LIMITATIONS-AND-VALIDATION.md`, what this instrument does not claim, and the validation plan
- `INTEGRATION-NOTES.md`, every judgment call made while shipping v2

## Rescoring stored records

    npm run rescore:legacy              # dry run, prints a v1 to v2 distribution table
    npm run rescore:legacy -- --write   # persists, sends no email

Complete raw answers are stored with every submission, which is what makes a scoring change a batch
job rather than a re-survey. Rescored records keep their v1 fields untouched and are tagged
`rescoredFrom`.

## A note on what this is

Results are assessment indices derived from self-reported answers. They are built to support
reflection. They are not validated psychometric measurements, and the limitations document says so
in detail rather than burying it.
