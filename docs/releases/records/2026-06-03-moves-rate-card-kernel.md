# 2026-06-03-moves-rate-card-kernel — Moves Rate-Card Ingestion Kernel

## Release ID

`2026-06-03-moves-rate-card-kernel`

## Status

`candidate`

## Plain-English Summary

Adds the first controlled build slice for the Moves rate-card program: a pure, tested rate-card ingestion kernel that validates internal, vendor, and geo-modifier rows and recomputes all planning math server-side. It also adds a research notes spine so future seed/workbook work is grounded in cited sources instead of fabricated market numbers.

## Layer Impact

- `global-control-lane`: Adds shared expert-kernel logic for sourcing and pricing estimates. No route, UI, or database behavior changes in this slice.
- `client-data-lane`: Prepares tenant-scoped rate-card ingestion semantics, but does not add migrations or mutate tenant data yet.

## Client Applicability

- All clients: The pure kernel will be available to all tenants once wired into ingestion and Moves.
- Specific clients: None.
- Internal only: Research notes guide internal execution of the rate-card build.
- Public/demo only: None.
- Feature flag: Not applicable for this pure-module slice.

## Changes Included

- `src/lib/programs/expert-kernel/rate-card/rate-card-ingestion.ts`
- `src/lib/programs/expert-kernel/rate-card/__tests__/rate-card-ingestion.test.ts`
- `docs/build/MOVES_RATE_CARD_RESEARCH_NOTES_2026-06-03.md`
- `docs/releases/records/2026-06-03-moves-rate-card-kernel.md`

## QA / Validation

- `npx jest --runTestsByPath src/lib/programs/expert-kernel/rate-card/__tests__/rate-card-ingestion.test.ts --runInBand` — passed, 10 tests.
- `npx eslint src/lib/programs/expert-kernel/rate-card/rate-card-ingestion.ts src/lib/programs/expert-kernel/rate-card/__tests__/rate-card-ingestion.test.ts` — passed.
- `npx tsc --noEmit --pretty false --incremental false` — passed.
- `npm run release:check -- --base origin/main --head HEAD` — passed.

## Rollout Plan

Merge to `main`. No database migration, seed run, or Vercel-only runtime activation is required for this slice. Later slices will wire the kernel into Data Loads parsing, templates, and the Moves estimator.

## Rollback Plan

Revert the PR. Because this slice adds pure code and docs only, rollback does not require data migration rollback or tenant cleanup.

## Audit Evidence

- Unit test output for the new rate-card ingestion test.
- Research note with source ledger and explicit gaps.
- PR checks after opening the release candidate.

## Known Gaps

- No schema migration, template registration, upload parser, or estimator binding yet.
- No filled workbook or `seed.json` yet; bulk BLS source extraction still needs a reachable download path or manual workbook handoff.
- Offshore SI rate evidence needs a second-source pass before seed rows are marked medium/high confidence.
