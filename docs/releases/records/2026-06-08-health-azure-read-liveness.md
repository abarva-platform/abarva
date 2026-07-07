# 2026-06-08-health-azure-read-liveness — Azure Read Health Probe Liveness Fix

## Release ID

`2026-06-08-health-azure-read-liveness`

## Status

`candidate`

## Plain-English Summary

The public health endpoint now checks whether the Azure/Postgres read adapter can execute a neutral liveness query instead of depending on the historical `engagements` table. This keeps the Azure deployment gate focused on database reachability and read-adapter health, not whether one legacy table is present in a specific lab schema.

## Layer Impact

- `global-control-lane`: Updates the shared `/api/health` liveness contract used by Azure Container Apps deployment verification.
- `internal-admin`: Improves operator confidence during Azure cutover checks by avoiding a false database failure when direct Postgres is healthy.

## Client Applicability

- All clients: Yes, the public health route is shared runtime infrastructure.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/health/route.ts`: changes the Azure read-adapter probe from `SELECT id FROM engagements LIMIT 1` to `SELECT 1 AS ok`.
- `src/app/api/health/__tests__/route.test.ts`: updates the liveness test expectation.

## QA / Validation

- PASS — `npm test -- --runTestsByPath src/app/api/health/__tests__/route.test.ts --runInBand`.
- PASS — `npx eslint src/app/api/health/route.ts src/app/api/health/__tests__/route.test.ts`.
- PASS — `git diff --check`.
- PASS — `npm run release:check -- --base origin/main --head HEAD`.
- BLOCKED OUTSIDE CHANGE — `npx tsc --noEmit --pretty false --incremental false` fails on missing optional packages `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`, not on the touched health route/test.
- PENDING — post-deploy Azure curl proof against `https://app.abarva.ai/api/health`.

## Rollout Plan

Merge to `main`, build a fresh Azure Container Apps image from current `origin/main`, deploy by pinned ACR digest to `ca-abarva-web-lab-eastus`, shift traffic only after the new revision is `Provisioned` and `Running`, then rerun public and signed-in Lakeshore QA.

## Rollback Plan

Fastest rollback is Azure Container Apps traffic shift back to the prior known-good revision. Code rollback is a revert PR if the neutral liveness query causes unexpected health semantics.

## Audit Evidence

- PR URL and CI checks after PR creation.
- Azure Container Apps revision and image digest evidence in `reports/azure-main-20260608-bc73d655-postdeploy/` or follow-on health-fix evidence folder.
- Curl headers/body showing HTTP 200, no Vercel headers, `postgres: true`, `direct_postgres: true`, and `azure_graph: postgres`.

## Known Gaps

This only fixes the health liveness probe. It does not resolve broader module gaps such as Art of Possible depth, Moves substrate depth, Tower substrate depth, Sentinel/Nexus answer QA, or deeper industry corpus usage.
