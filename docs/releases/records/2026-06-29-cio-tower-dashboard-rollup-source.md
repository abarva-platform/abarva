# 2026-06-29-cio-tower-dashboard-rollup-source — Tower Dashboard Uses Governed Rollups

## Release ID

`2026-06-29-cio-tower-dashboard-rollup-source`

## Status

`candidate`

## Plain-English Summary

Tower dashboard budget slices now prefer the governed `cio_tower` fact layer before falling back to older rollup tables. This prevents the right-side dashboard from showing one set of function/platform budget values while aVa answers from a different, newer Tower source package.

## Layer Impact

- `global-control-lane`: Tower's shared dashboard read adapter changes for every tenant using the CIO Tower surface.
- `client-data-lane`: No schema or data mutation is included. The change only changes read precedence toward the already-loaded `cio_tower` facts.

## Client Applicability

- All clients: Yes, for tenants with `cio_tower` facts loaded.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/tower/tower-budget-rollups.ts`: Reads `cio_tower.facts` for FY26 IT budget rollups before legacy `tower_budget_rollups`.
- `src/lib/tower/__tests__/tower-materialized-read-model.test.ts`: Adds regression coverage proving governed `cio_tower` facts win over stale legacy rollups.

## QA / Validation

- `npx jest src/lib/tower/__tests__/tower-materialized-read-model.test.ts --runInBand` passed.
- `npx eslint src/lib/tower/tower-budget-rollups.ts src/lib/tower/__tests__/tower-materialized-read-model.test.ts` passed.
- `npm run release:check` required before PR.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new image to `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by ACA main deploy after merge.
- ACA runtime invariant: Required in deploy workflow.
- Worker image invariant: Required in deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower dashboard and aVa chat must agree on Lakeshore IT budget slices after deploy.

## Rollback Plan

Revert this PR. Tower will return to the previous read precedence where legacy `tower_budget_rollups` can feed dashboard slices.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Live proof: pending after ACA deploy.

## Known Gaps

This does not create missing program, vendor, or renewal data. It only removes the dashboard/chat contradiction for budget rollup source precedence.
