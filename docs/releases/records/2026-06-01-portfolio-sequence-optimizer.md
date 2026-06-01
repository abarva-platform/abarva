# 2026-06-01-portfolio-sequence-optimizer — Portfolio Sequence Optimizer

## Release ID

`2026-06-01-portfolio-sequence-optimizer`

## Status

`candidate`

## Plain-English Summary

Adds the Wave 4 sequence optimizer: a deterministic broker-layer planner that combines dependency edges, resource-pool capacity, and cannibalization findings into a four-quarter portfolio sequence with blocked Moves, utilization, cumulative value, and alternative sequencing scenarios.

## Layer Impact

- Release lane: `global-control-lane`.
- Broker/read model: adds a pure portfolio optimizer under `src/lib/admin/broker/portfolio/`.
- Eval/QA: adds contract coverage for Apex Retail plus synthetic Meridian and SkyHarbor cases covering hard dependency blocking, resource constraints, tenant scoping, and deterministic output.

## Client Applicability

- All clients: available as a pure input-scoped optimizer.
- Specific clients: tests cover Apex Retail, Meridian-shaped, and SkyHarbor-shaped portfolios.
- Internal only: no direct user-facing route or UI change in this slice.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- New `src/lib/admin/broker/portfolio/sequence-optimizer.ts`.
- New `src/lib/admin/broker/portfolio/__tests__/sequence-optimizer.test.ts`.

## QA / Validation

- PASS — `npx jest src/lib/admin/broker/portfolio/__tests__/sequence-optimizer.test.ts --runInBand`
- PASS — `npx eslint src/lib/admin/broker/portfolio/sequence-optimizer.ts src/lib/admin/broker/portfolio/__tests__/sequence-optimizer.test.ts`
- PASS — `npx tsc --noEmit --pretty false`
- PASS — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` and deploy through the normal Vercel production pipeline after the dependency graph, resource pools, and cannibalization detector slices are on main. This is additive TypeScript logic with no route, schema, migration, or runtime configuration change.

## Rollback Plan

Run `gh pr revert <PR_NUMBER>` to remove the optimizer and tests. No data migration or persisted state is involved.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2720
- CI checks: required before merge.
- Local validation commands listed above.

## Known Gaps

This slice produces the optimizer output only. Tower rendering, Sentinel portfolio intents, and Wave 4 QA evidence remain in later Wave 4 slices.
