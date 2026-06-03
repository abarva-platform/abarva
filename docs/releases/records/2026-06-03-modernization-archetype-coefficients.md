# 2026-06-03-modernization-archetype-coefficients — Modernization Archetype Coefficients

## Release ID

`2026-06-03-modernization-archetype-coefficients`

## Status

`candidate`

## Plain-English Summary

Adds the first source-backed coefficient library for the data-platform modernization pattern pack.
The library gives future estimator work a governed set of planning ranges for source onboarding,
ETL, stored procedures, marts, SAS, and BI/report workloads. Every heuristic carries a source,
as-of date, confidence level, and rationale so the platform does not present fabricated precision.

## Layer Impact

- `global-control-lane`: Adds pure TypeScript expert-kernel data and validation helpers shared by
  future Moves modernization estimates. No UI, route, API, or database behavior changes.

## Client Applicability

- All clients: Future modernization estimates can use this shared coefficient library as a fallback
  when tenant-specific Analyzer inventory is not yet loaded.
- Specific clients: None.
- Internal only: The docs and release record are internal governance evidence.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `src/lib/programs/expert-kernel/modernization/archetype-coefficients.ts`.
- Added `src/lib/programs/expert-kernel/modernization/index.ts`.
- Exported the modernization kernel from `src/lib/programs/expert-kernel/index.ts`.
- Added focused tests at
  `src/lib/programs/expert-kernel/modernization/__tests__/archetype-coefficients.test.ts`.
- Added build note `docs/build/MODERNIZATION_ARCHETYPE_COEFFICIENTS_2026-06-03.md`.

## QA / Validation

- PASS: `npx jest --runTestsByPath src/lib/programs/expert-kernel/modernization/__tests__/archetype-coefficients.test.ts --runInBand`
  passed 10 tests. Jest emitted pre-existing duplicate manual mock warnings for markdown mocks.
- PASS: `npx eslint src/lib/programs/expert-kernel/modernization/archetype-coefficients.ts src/lib/programs/expert-kernel/modernization/index.ts src/lib/programs/expert-kernel/modernization/__tests__/archetype-coefficients.test.ts src/lib/programs/expert-kernel/index.ts`.
- PASS: `npx tsc --noEmit --pretty false --incremental false`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main` through a PR. No runtime rollout, data migration, or tenant action is required. The
library becomes available to later estimator/intake slices after merge.

## Rollback Plan

Revert the PR. Because this slice has no database migrations or runtime route changes, rollback is a
straight source-code revert.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Focused test output: local Jest pass, 10/10.
- Release gate output: local release gate pass.

## Known Gaps

- Lakebridge/Analyzer inventory parser is not included in this slice.
- Industry-specific healthcare, retail, and airline source-family defaults are not wired yet.
- Rate-card cost conversion and Source RFP divergence report are deferred to later slices.
- SAS coefficients remain low-confidence until a richer benchmark pass is completed.
