# 2026-09-08-source-tower-contract-depth-bridge-readback — Source Tower Bridge Readback Alignment

## Release ID

`2026-09-08-source-tower-contract-depth-bridge-readback`

## Status

`candidate`

## Plain-English Summary

Aligns the Source-to-Tower contract-depth bridge with the governed evidence path used by the current contract-depth package. The bridge now validates package document evidence through the Source adapter snapshot records that the loader physically writes, instead of requiring a separate document table path that this package does not populate.

## Layer Impact

- Release lane: `client-data-lane`, because this validates and projects tenant-scoped Source evidence into Tower's product substrate.

- Layer 4 products: Tower bridge validation and projection setup for contract-depth opportunity rows.

- Layer 3 canonical model: No canonical schema change. The bridge readback now checks existing governed Source snapshot rows for evidence-manifest coverage.

## Client Applicability

- All clients: no broad UI behavior change.
- Specific clients: contract-depth bridge runs scoped by operator-provided tenant key and dataset version.
- Internal only: ACA operator job validation and bridge execution.
- Public/demo only: not applicable.
- Feature flag: none.

## Changes Included

- `scripts/tower/apply-source-cloud-tower-bridge.mjs`
- `scripts/tower/__tests__/apply-source-cloud-tower-bridge.test.ts`

## QA / Validation

- `NODE_PATH=/Users/anand/Projects/nexus/node_modules /Users/anand/Projects/nexus/node_modules/.bin/jest scripts/tower/__tests__/apply-source-cloud-tower-bridge.test.ts --runInBand` passed.
- `npx eslint scripts/tower/apply-source-cloud-tower-bridge.mjs scripts/tower/__tests__/apply-source-cloud-tower-bridge.test.ts` completed with no errors; existing warnings remain in the bridge script.
- Local Tower bridge plan with explicit dataset/package overrides passed and produced the expected contract-depth readback shape.

## Rollout Plan

Merge to main through PR, allow the repo-owned ACA main deploy workflow to publish the digest-pinned web and worker image, then rerun the contract-depth Tower bridge ACA operator apply and verify jobs with the approved image digest.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repo-owned ACA deploy workflow only.
- Approved image digest: resolved by the deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for affected product surfaces after the bridge verify passes.

## Rollback Plan

Revert the bridge change through PR and redeploy via the repo-owned ACA main deploy workflow. Tower bridge rows are idempotently keyed and can be replaced by rerunning the prior bridge job after rollback if needed.

## Audit Evidence

- PR URL and merge SHA.
- ACA main deploy workflow run for the merge SHA.
- ACA operator job logs and proof bundle for bridge apply and verify.

## Known Gaps

Signed-in product proof remains required after the bridge apply and verify jobs pass.
