# 2026-06-01-monte-carlo-renderer — Monte Carlo Forecast Renderer

## Release ID

`2026-06-01-monte-carlo-renderer`

## Status

`candidate`

## Plain-English Summary

Adds a board-grade renderer and reusable Programs card for probabilistic Move forecasts. The new surfaces show P10/P50/P90 bands, net-positive probability, target-hit probability, and top variance drivers so a CFO can understand the forecast range instead of seeing only a single point estimate.

## Layer Impact

- `global-control-lane`: shared program expert-kernel export rendering and Programs UI components. The change is passive until a caller chooses to render a probabilistic forecast.

## Client Applicability

- All clients: available to any Move once probabilistic forecast data is supplied.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none required because no route is wired in this slice.

## Changes Included

- Adds `src/lib/programs/expert-kernel/exports/board-grade/probabilistic-forecast-renderer.ts`.
- Adds `src/components/programs/ProbabilisticForecastCard.tsx`.
- Exports the board-grade renderer from `src/lib/programs/expert-kernel/exports/board-grade/index.ts`.
- Adds renderer and component contract tests.
- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2690

## QA / Validation

- Pass: focused Jest for renderer and card tests.
- Pass: ESLint on changed renderer/component/test files.
- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `git diff --check`.

## Rollout Plan

Merge to `main`; Vercel deploys the passive library/component change. No migration, no new route, no tenant-data access, and no runtime feature activation in this slice.

## Rollback Plan

Revert the PR. The renderer and card are additive exports and do not persist state.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2690
- CI checks: pending.
- Local validation: focused Jest, ESLint, TypeScript, release gate, and diff check pass locally.

## Known Gaps

This slice does not yet wire the renderer into a live Move page or exported dossier. That should happen after the sampler PR lands and the renderer contract is green.
