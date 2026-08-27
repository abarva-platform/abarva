# 2026-08-27-tower-ecl-trajectory-readiness

## Release ID

`2026-08-27-tower-ecl-trajectory-readiness`

## Status

`candidate`

## Plain-English Summary

Tower now maps ECL serving rows into the command-center value trajectory only when the rows carry recorded period evidence. If the serving rows do not include period start and period end, the page leaves the trajectory blank and explains the missing evidence instead of spreading annual values across quarters.

## Layer Impact

- Lane: `global-control-lane`
- Layer 4 - Products: updates the Tower command-center reader and presentation copy.
- Layer 3 - Canonical Enterprise Model: no canonical table or value changes.

## Client Applicability

- All clients: Tower command-center rendering behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/tower/readTowerCommandCenter.ts`
- `src/lib/tower/__tests__/readTowerCommandCenter.test.ts`
- `src/components/tower/command-center/views/CommandCenterView.tsx`
- `docs/architecture/sql-drafts/ecl_serving_views_v1_draft.sql`
- `scripts/ecl/__tests__/run-ecl-projection-schema-reconciliation-tests.mjs`

## QA / Validation

- PASS - `npm run test:behaviors -- --runTestsByPath src/lib/tower/__tests__/readTowerCommandCenter.test.ts`
- PASS - `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PENDING - `ECL_RECONCILE_REF=HEAD node scripts/ecl/__tests__/run-ecl-projection-schema-reconciliation-tests.mjs`

## Rollout Plan

Merge through PR to `main`; the repo-owned Azure Container Apps main deploy workflow will build and deploy the web image.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none outside the approved deploy workflow.
- Approved image digest: produced by the deploy workflow.
- ACA runtime invariant: required before live claim.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: Tower command-center route after deploy.

## Rollback Plan

Revert the PR and redeploy the previous digest through the repo-owned workflow.

## Audit Evidence

- PR URL and commit SHA after merge.
- Targeted Tower reader test output.
- TypeScript check output.
- ACA deploy workflow run and signed-in Tower route screenshot after deployment.

## Known Gaps

This does not create quarter-level Tower facts. The trajectory renders only when the governed serving rows already carry period evidence.
