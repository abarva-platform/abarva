# 2026-06-01-monte-carlo-input-distributions — Monte Carlo Input Distribution Wrappers

## Release ID

`2026-06-01-monte-carlo-input-distributions`

## Status

`candidate`

## Plain-English Summary

Adds the typed bridge between existing deterministic Move inputs and the new Monte Carlo distribution kernel. Effort ranges can now expose a triangular cost distribution, and value forecasts can expose adoption-ramp, value-per-unit, churn-rate, and vendor-reprice distributions. This keeps existing Moves unchanged while giving the next Wave 2 sampler a clean, deterministic input model.

## Layer Impact

- `global-control-lane`: Extends shared expert-kernel inputs and outputs with optional probabilistic wrappers.
- Runtime behavior: Backward compatible. Existing callers that omit probabilistic inputs receive the same deterministic forecast plus a `null` probabilistic field.

## Client Applicability

- All clients: The wrappers are shared and tenant-neutral.
- Specific clients: None in this slice.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None; no UI or route consumes this yet.

## Changes Included

- Adds `src/lib/programs/expert-kernel/probabilistic/input-wrappers.ts`.
- Exports probabilistic wrapper types and builders from `src/lib/programs/expert-kernel/probabilistic/index.ts`.
- Extends `buildEffortEstimate()` with optional `probabilistic` input and output.
- Extends `buildValueForecast()` with optional `probabilistic` input and output.
- Adds regression tests for wrapper construction, estimator/value-forecast pass-through, defaults, and backward compatibility.

## QA / Validation

- Pass: `npm ci --ignore-scripts`.
- Pass: `npx jest src/lib/programs/expert-kernel/probabilistic/__tests__/input-wrappers.test.ts --runInBand` (7 tests).
- Pass: `npx eslint src/lib/programs/expert-kernel/probabilistic src/lib/programs/expert-kernel/effort-estimator.ts src/lib/programs/expert-kernel/value-forecast.ts --max-warnings=0`.
- Pass: `npx tsc --noEmit --pretty false` after keeping the new output fields optional for type-literal backward compatibility.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `git diff --check`.

## Rollout Plan

Merge to `main`. This slice is pure TypeScript with no database migration, route, tenant data access, or UI rollout. Follow-up Wave 2 slices will run the sampled forecast and render the P10/P50/P90 bands.

## Rollback Plan

`gh pr revert <PR number>` removes the optional wrappers. Existing deterministic Move forecasts remain available.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2688.
- CI run: pending.
- Local validation: pending.

## Known Gaps

This slice intentionally does not run the Monte Carlo value forecast, compute NPV, rank variance drivers, render fan charts, or run tenant E2E. Those are Wave 2 follow-up slices.
