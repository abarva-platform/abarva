# 2026-08-28-source-contract-depth-loader-idempotency

## Release ID

`2026-08-28-source-contract-depth-loader-idempotency`

## Status

`candidate`

## Plain-English Summary

The contract-depth loader now creates dataset-scoped optimization opportunity IDs so re-runs and newer dataset versions do not collide with previously loaded opportunity rows.

## Layer Impact

Release lane: `client-data-lane`.

Layer 3 Canonical Enterprise Model: narrows the identity grain for generated optimization opportunity rows to include the dataset version while preserving the contract-level evidence and calculation links.

## Client Applicability

All clients: No.
Specific clients: Synthetic demo data-build runs that use the contract-depth loader.
Internal only: Operator data-build path.
Public/demo only: Yes.
Feature flag: None.

## Changes Included

- `src/lib/source/data-model/contract-depth-demo-slice.ts`
- `scripts/source/load-contract-depth-demo-slice.ts`
- `src/lib/source/data-model/__tests__/contract-depth-demo-slice.test.ts`

## QA / Validation

- Focused Jest coverage for dataset-scoped opportunity IDs: pass, `npx jest src/lib/source/data-model/__tests__/contract-depth-demo-slice.test.ts --runInBand`.
- Scoped ESLint for touched loader and data-model files: pass, `npx eslint scripts/source/load-contract-depth-demo-slice.ts src/lib/source/data-model/contract-depth-demo-slice.ts src/lib/source/data-model/__tests__/contract-depth-demo-slice.test.ts`.
- Release check: pass, `npm run release:check`.
- ACA dry-run/apply/readback proof through the operator job: blocked until this change is merged and deployed into the operator image.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image. The governed ACA operator job then runs the contract-depth loader with explicit tenant scope, dataset version, and idempotency key.

## Deployment Authority

Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
Shared runtime mutators: none in this PR.
Approved image digest: assigned by the main deploy workflow.
ACA runtime invariant: required after deploy.
Worker image invariant: operator job must use the deployed digest-pinned image.
Feature/env flag update path: none.
Live signed-in proof required: yes, for affected Source contract views after the data-build job.

## Rollback Plan

Code rollback is a revert PR followed by the repo-owned ACA main deploy workflow. Data rows are idempotently namespaced by dataset version; any data rollback should use a governed operator cleanup/readback path rather than direct manual deletes.

## Audit Evidence

- PR URL: pending.
- Jest output: pass.
- ESLint output: pass.
- Release check output: pass.
- ACA operator proof bundle: pending after deploy.
- Signed-in Source readback/screenshots: pending after deploy and data-build job.

## Known Gaps

This fix only addresses opportunity identity collisions in the loader. It does not load the broader multi-contract depth package or refresh product projections by itself.
