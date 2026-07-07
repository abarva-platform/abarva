# 2026-06-01-monte-carlo-value-forecast — Monte Carlo Value Forecast Sampler

## Release ID

`2026-06-01-monte-carlo-value-forecast`

## Status

`candidate`

## Plain-English Summary

Adds the first probabilistic Move value-forecast sampler. It consumes the deterministic value forecast, effort estimate, and optional distribution wrappers, then emits yearly revenue/cost/net summaries, 3-year and 5-year NPV percentile bands, probability of positive 3-year NPV, probability of hitting a locked target, and the top three variance drivers.

## Layer Impact

- `global-control-lane`: Adds shared expert-kernel Monte Carlo forecast logic for later business-case and board-pack rendering.
- Runtime behavior: No route, UI, database, or tenant-data path changes in this slice.

## Client Applicability

- All clients: The sampler is shared and tenant-neutral.
- Specific clients: None in this slice.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None; no UI consumes this yet.

## Changes Included

- Adds `src/lib/programs/expert-kernel/probabilistic/value-forecast-mc.ts`.
- Exports the Monte Carlo forecast builder from `src/lib/programs/expert-kernel/probabilistic/index.ts`.
- Adds unit tests for deterministic zero-variance behavior, sampled distributions, variance-driver ranking, and target-hit probability.

## QA / Validation

- Pass: `npm ci --ignore-scripts`.
- Pass: `npx jest src/lib/programs/expert-kernel/probabilistic/__tests__/value-forecast-mc.test.ts --runInBand` (3 tests).
- Pass: `npx eslint src/lib/programs/expert-kernel/probabilistic --max-warnings=0` after removing one unused parameter caught by the first run.
- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `git diff --check`.

## Rollout Plan

Merge to `main`. This slice is pure TypeScript with no database migration, route, tenant data access, or UI rollout. Follow-up Wave 2 renderer slices will surface the P10/P50/P90 bands in business-case views.

## Rollback Plan

`gh pr revert <PR number>` removes the optional sampler. Existing deterministic Move forecasts remain available.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2689
- CI run: pending.
- Local validation: pending.

## Known Gaps

This slice intentionally does not render fan charts, wire the sampler into customer-facing business cases, regenerate primers, or run tenant E2E. Those are Wave 2 follow-up slices.
