# 2026-06-01-portfolio-dependency-graph — Portfolio Dependency Graph Builder

## Release ID

`2026-06-01-portfolio-dependency-graph`

## Status

`candidate`

## Plain-English Summary

Adds the first Wave 4 portfolio-sequencing primitive: a deterministic dependency graph builder that can identify when Moves share data, systems, sponsors, vendors, governance capacity, value claims, or workflow-change pressure.

## Layer Impact

- Release lane: `global-control-lane`.
- Broker/read model: adds a pure broker-layer portfolio graph builder under `src/lib/admin/broker/portfolio/`.
- Eval/QA: adds contract coverage for Apex Retail plus synthetic Meridian and SkyHarbor portfolios so the dependency rules are exercised across signature-client shapes.

## Client Applicability

- All clients: available as a pure input-scoped builder.
- Specific clients: tests cover Apex Retail, Meridian, and SkyHarbor-style portfolios.
- Internal only: no direct user-facing route or UI change in this slice.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- New `src/lib/admin/broker/portfolio/dependency-graph.ts`.
- New `src/lib/admin/broker/portfolio/__tests__/dependency-graph.test.ts`.

## QA / Validation

- PASS — `npx jest src/lib/admin/broker/portfolio/__tests__/dependency-graph.test.ts --runInBand`
- PASS — `npx tsc --noEmit --pretty false`
- PASS — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` and deploy through the normal Vercel production pipeline. This is additive TypeScript logic with no route, schema, migration, or runtime configuration change.

## Rollback Plan

Run `gh pr revert <PR_NUMBER>` to remove the builder and tests. No data migration or persisted state is involved.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2713
- CI checks: required before merge.
- Local validation commands listed above.

## Known Gaps

This slice only builds dependency edges. Resource pools, cannibalization scoring, optimizer output, Tower rendering, Sentinel intents, and Wave 4 QA evidence remain in later Wave 4 slices.
