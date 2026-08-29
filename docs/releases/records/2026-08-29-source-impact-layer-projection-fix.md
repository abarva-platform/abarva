# 2026-08-29-source-impact-layer-projection-fix

## Release ID

`2026-08-29-source-impact-layer-projection-fix`

## Status

`candidate`

## Plain-English Summary

Fixes the Source contract-depth Layer 4 projection so action-candidate rows derive vendor display names from the contract evidence coverage view instead of a non-existent opportunity-view column.

It also scopes aVa grounding bundles to deterministic Source-page story rows plus package action-candidate rows, preventing broad tenant contract coverage rows from inflating the action-candidate proof count.

It also fixes the scoped aVa grounding readback SQL parameter binding so the governed Layer 4 apply job can assert the package action-bundle count without PostgreSQL type-inference failures.

## Layer Impact

- `client-data-lane`: updates the governed ACA data-build projection script for Source contract-depth Layer 4 views.
- `global-control-lane`: updates shared Source workspace read-model projection code used by product readers after the governed job refreshes the views.

## Client Applicability

All clients using the Source contract-depth Layer 4 projection path. Current data-build proof remains scoped to the approved synthetic demo package and tenant run.

## Changes Included

- `scripts/source/project-contract-depth-package-layer4.ts`
- `scripts/source/__tests__/project-contract-depth-package-layer4.test.ts`
- Follow-up: scope `source.ava_grounding_bundle_v1` action grounding to deterministic action candidates and assert the package action-bundle count.
- Follow-up: bind the action-grounding readback to the load-run parameter directly and assert that no unused ambiguous parameter remains.

## QA / Validation

- PASS: `npx jest scripts/source/__tests__/project-contract-depth-package-layer4.test.ts --runInBand`
- PASS: `npx eslint scripts/source/project-contract-depth-package-layer4.ts scripts/source/__tests__/project-contract-depth-package-layer4.test.ts`
- PASS: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false`

## Rollout Plan

Merge by PR, deploy through the repo-owned Azure Container Apps main workflow, then rerun the governed Source contract-depth Layer 4 ACA operator job and verify readback.

## Deployment Authority

- Repo-owned deploy workflow: required
- Shared runtime mutators: none outside the repo-owned deploy workflow and ACA operator data-build job
- Approved image digest: recorded after deploy
- ACA runtime invariant: required after deploy
- Worker image invariant: use digest-pinned operator image
- Feature/env flag update path: none
- Live signed-in proof required: Source workspace and contract action-candidate rendering after Layer 4 verify

## Rollback Plan

Revert the PR and redeploy the prior digest if the projection fix regresses runtime behavior. Layer 4 views are replaceable views and can be rebuilt from the prior image.

## Audit Evidence

Inspect the PRs, deploy runs, ACA operator job logs, Layer 4 proof bundle, and signed-in Source page proof.

## Known Gaps

Layer 4 apply and verify must be rerun after this fix is deployed.
