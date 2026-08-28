# 2026-08-28-source-contract-depth-load-run-reuse — Source Depth Load Run Reuse

## Release ID

`2026-08-28-source-contract-depth-load-run-reuse`

## Status

`candidate`

## Plain-English Summary

This release lets the Source contract-depth package loader reuse one governed
load-run record across sequential adapter and canonical projection phases. The
change prevents the canonical phase from colliding with the adapter phase when
both correctly share the same load-run identifier.

## Layer Impact

Release lane: `client-data-lane`.

Layer 2 Source Adapters: The adapter-row load remains unchanged. The run-status
row now behaves as a shared package-run ledger across phases.

Layer 3 Canonical Enterprise Model: Canonical projection can proceed after
Layer 2 readback without trying to create a duplicate package-run record.

## Client Applicability

- All clients: No default product-surface behavior changes.
- Specific clients: Applies only when an approved operator runs this package
  loader for a tenant-scoped dataset.
- Internal only: Operator job behavior and validation.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/source/load-contract-depth-package.ts`
- `scripts/source/__tests__/load-contract-depth-package.test.ts`

## QA / Validation

- PASS: `npx jest scripts/source/__tests__/load-contract-depth-package.test.ts src/lib/source/contract-depth-package/__tests__/adapter.test.ts src/lib/source/contract-depth-package/__tests__/projection.test.ts --runInBand`
- PASS: `npx eslint scripts/source/load-contract-depth-package.ts scripts/source/__tests__/load-contract-depth-package.test.ts`
- PASS: `npm run release:check`

## Rollout Plan

Merge through the protected repository path. The repo-owned Azure Container Apps
main deploy workflow builds and deploys the updated image. Operator data jobs
must use that deployed digest.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Captured by the ACA deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: No product UI change; data-job readback proof
  is required for the package load.

## Rollback Plan

Rollback to the previous ACA web digest if the operator loader cannot be used
safely. The schema and already-written adapter rows are additive and should not
be deleted without a separate approved data rollback.

## Audit Evidence

- Pull request and merge record for this release.
- Focused Jest/lint output.
- Release check output.
- ACA deploy run and runtime invariant proof.
- Operator job proof for Layer 2 and Layer 3 package load.

## Known Gaps

This release does not create Layer 4 product cubes or signed-in product proof.
