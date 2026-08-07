# 2026-08-07-source-contract-optimization-copy-polish — Source Optimization Label Polish

## Release ID

`2026-08-07-source-contract-optimization-copy-polish`

## Status

`candidate`

## Plain-English Summary

This release tightens the Source contract optimization cockpit language so an unquantified leakage value does not read like duplicate wording. The four-ledger behavior is unchanged: recoverable leakage, avoided cost, negotiated improvement, and realized value remain separated and evidence-gated.

## Layer Impact

`global-control-lane`: updates labels in the shared Source workspace contract optimization view for all tenants that use this product surface.

`client-data-lane`: no data model, migration, calculation, tenant, or persistence change.

## Client Applicability

- All clients: Applies to the shared Source contract optimization workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source workspace routing only.

## Changes Included

- Updates the compact strip label from quantified leakage to recoverable leakage.
- Updates the four-ledger cockpit KPI label from Quantified leakage to Recoverable leakage.

## QA / Validation

- `npx jest --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts src/lib/source/data-model/__tests__/read-adapter.test.ts --runInBand` passed.
- `npx eslint src/app/'(maestro)'/source/preview/workspace/buildViewModel.ts src/app/'(maestro)'/source/preview/workspace/canvases/ContractCanvas.tsx` passed.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false` passed.

## Rollout Plan

Merge to main through a pull request. The repo-owned Azure Container Apps main deploy workflow builds and deploys the new image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this release.
- Approved image digest: Resolved by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: No worker-specific behavior change.
- Feature/env flag update path: None.
- Live signed-in proof required: Source workspace optimization cockpit should render the updated label.

## Rollback Plan

Revert the label-only commit and redeploy through the same ACA main workflow.

## Audit Evidence

- PR, CI checks, ACA deploy run, and signed-in Source workspace proof after merge.

## Known Gaps

This release does not add new evidence, change four-ledger calculations, or alter Door 1 workflow state. It only fixes the displayed label, so live proof should focus on the cockpit copy after deployment.
