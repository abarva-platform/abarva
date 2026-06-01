# 2026-06-01-portfolio-cannibalization-detector — Portfolio Cannibalization Detector

## Release ID

`2026-06-01-portfolio-cannibalization-detector`

## Status

`candidate`

## Plain-English Summary

Adds the Wave 4 cannibalization primitive: a deterministic detector that spots when two Moves claim the same KPI or workflow value pool, estimates the potential double-count exposure from declared program values, and recommends whether to merge, sequence, descope, or explicitly accept the overlap.

## Layer Impact

- Release lane: `global-control-lane`.
- Broker/read model: adds a pure broker-layer portfolio overlap detector under `src/lib/admin/broker/portfolio/`.
- Eval/QA: adds contract coverage for Apex Retail plus synthetic Apex and Meridian portfolios so labor-cost, customer-experience, data-foundation, determinism, and tenant-scope behaviors are pinned.

## Client Applicability

- All clients: available as a pure input-scoped builder.
- Specific clients: tests cover Apex Retail and Meridian-shaped portfolios.
- Internal only: no direct user-facing route or UI change in this slice.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- New `src/lib/admin/broker/portfolio/cannibalization.ts`.
- New `src/lib/admin/broker/portfolio/__tests__/cannibalization.test.ts`.

## QA / Validation

- PASS — `npx jest src/lib/admin/broker/portfolio/__tests__/cannibalization.test.ts --runInBand`
- PASS — `npx eslint src/lib/admin/broker/portfolio/cannibalization.ts src/lib/admin/broker/portfolio/__tests__/cannibalization.test.ts`
- PASS — `npx tsc --noEmit --pretty false`
- PASS — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` and deploy through the normal Vercel production pipeline after the current production crawl gate clears. This is additive TypeScript logic with no route, schema, migration, or runtime configuration change.

## Rollback Plan

Run `gh pr revert <PR_NUMBER>` to remove the detector and tests. No data migration or persisted state is involved.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2717
- CI checks: required before merge.
- Local validation commands listed above.

## Known Gaps

This slice only identifies KPI/workflow cannibalization. The sequence optimizer, Tower rendering, Sentinel portfolio intents, and Wave 4 QA evidence remain in later Wave 4 slices.
