# 2026-06-03-lakebridge-analyzer-intake — Lakebridge Analyzer Inventory Intake Kernel

## Release ID

`2026-06-03-lakebridge-analyzer-intake`

## Status

`candidate`

## Plain-English Summary

Adds the first pure parser and validator for Lakebridge/Analyzer-style modernization workload inventories. AbarVa can now normalize tenant-owned metadata rows for legacy tables, ETL jobs, stored procedures, SAS programs, and reporting artifacts without ingesting raw code or pretending to run a converter.

## Layer Impact

- `global-control-lane`: Adds shared expert-kernel library code and tests for future Data Loads and Moves estimator wiring. No route, UI, database, or production workflow changes are activated by this slice.

## Client Applicability

- All clients: Available as a shared pure library once later wiring calls it.
- Specific clients: None.
- Internal only: No internal-only route or admin surface changed.
- Public/demo only: None.
- Feature flag: Not applicable; this slice is not yet runtime-wired.

## Changes Included

- `src/lib/programs/expert-kernel/modernization/analyzer-inventory-intake.ts`
- `src/lib/programs/expert-kernel/modernization/analyzer-inventory-templates.ts`
- `src/lib/programs/expert-kernel/modernization/__tests__/analyzer-inventory-intake.test.ts`
- `docs/releases/records/2026-06-03-lakebridge-analyzer-intake.md`

## QA / Validation

- `npx jest --runTestsByPath src/lib/programs/expert-kernel/modernization/__tests__/analyzer-inventory-intake.test.ts --runInBand` — passed, 8 tests.
- `npx eslint src/lib/programs/expert-kernel/modernization/analyzer-inventory-intake.ts src/lib/programs/expert-kernel/modernization/analyzer-inventory-templates.ts src/lib/programs/expert-kernel/modernization/__tests__/analyzer-inventory-intake.test.ts` — passed.
- `npx tsc --noEmit --pretty false --incremental false` — passed.

## Rollout Plan

Merge to `main`. No production behavior changes until a later Data Loads integration PR routes uploads through this parser.

## Rollback Plan

Revert the PR. Because there are no migrations, data writes, runtime route changes, or UI changes, rollback is limited to removing the pure library and tests.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2939
- Focused Jest, ESLint, TypeScript, and release gate output from the PR/CI run.
- Tests prove metadata normalization, tenant workload identity uniqueness, raw-code rejection, 7R disposition validation, automation confidence validation, and honest warning behavior for unknown complexity.

## Known Gaps

- Not yet wired into Data Loads upload routes, brokers, or persistence.
- Does not estimate effort or cost; later modernization-estimator slices should consume the normalized rows.
- Does not parse workbook binaries directly; Data Loads should continue converting CSV/XLSX/JSON into row objects before calling this pure parser.
