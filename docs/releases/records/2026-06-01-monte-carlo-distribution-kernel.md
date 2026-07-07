# 2026-06-01-monte-carlo-distribution-kernel — Monte Carlo Distribution Kernel

## Release ID

`2026-06-01-monte-carlo-distribution-kernel`

## Status

`candidate`

## Plain-English Summary

Adds the deterministic sampling foundation for probabilistic Move forecasts. The new kernel can sample point, uniform, triangular, normal, lognormal, and beta-PERT distributions with a fixed seed, then summarize outcomes as P10/P25/P50/P75/P90, mean, standard deviation, min, and max. This is the first slice of Wave 2; it does not yet change any customer-facing business case.

## Layer Impact

- `global-control-lane`: Adds shared expert-kernel probability primitives that later Move business-case and value-forecast slices can consume.

## Client Applicability

- All clients: The kernel is tenant-neutral and deterministic.
- Specific clients: None in this slice.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None; no UI or route consumes this yet.

## Changes Included

- Adds `src/lib/programs/expert-kernel/probabilistic/distributions.ts`.
- Adds `src/lib/programs/expert-kernel/probabilistic/sampler.ts`.
- Adds `src/lib/programs/expert-kernel/probabilistic/index.ts`.
- Adds unit tests for deterministic seeding, summary percentiles, distribution moments, point exactness, validation, and 100k-sample performance.

## QA / Validation

- Pass: `npx jest src/lib/programs/expert-kernel/probabilistic/__tests__/sampler.test.ts --runInBand` (10 tests).
- Pass: `npx eslint src/lib/programs/expert-kernel/probabilistic --max-warnings=0`.
- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `git diff --check`.

## Rollout Plan

Merge to `main`. The slice is pure TypeScript with no database migration, route, tenant data access, or UI rollout. Follow-up Wave 2 slices will wire it into Move forecasts and renderers.

## Rollback Plan

`gh pr revert <PR number>` removes the optional module. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2687.
- CI run: pending.
- Local validation: pending.

## Known Gaps

This slice intentionally does not wrap existing Move inputs as distributions, compute NPV, render fan charts, or run tenant E2E. Those are Wave 2 follow-up slices.
