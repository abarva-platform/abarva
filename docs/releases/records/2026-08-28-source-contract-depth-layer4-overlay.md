# 2026-08-28-source-contract-depth-layer4-overlay - Source Contract Depth Layer 4 Overlay

## Release ID

`2026-08-28-source-contract-depth-layer4-overlay`

## Status

`candidate`

## Plain-English Summary

Projects the governed contract-depth package into Source product read models without replacing the existing active portfolio cube. The overlay keeps existing contracts visible, adds the rich contract-depth rows to Contract 360, spend, performance, and opportunity views, and treats unassessed competitive alternatives as `not_assessed` instead of inventing leverage.

## Layer Impact

Release lane: `client-data-lane`.

Layer 4 - Products/projections only. Adds an operator job that rebuilds Source read-model views from canonical Layer 3 rows and a scoped overlay run. It does not change client intake files, adapter rows, canonical object definitions, or product-owned data.

Product read path - Source/Optimize. Updates the Source read adapter so governed financial/performance projections can supplement older tenant-specific candidate rows, and so Optimize evidence reads governed `consumption.*` views instead of the older canary namespace.

## Client Applicability

- All clients: The view definitions remain tenant-scoped and continue to read active Layer 3 load runs.
- Specific clients: The new overlay activation is scoped to the approved synthetic demo contract-depth package tenant/run only when the operator job is applied.
- Internal only: The operator script and validation evidence are internal release mechanics.
- Public/demo only: The data package remains synthetic demo-only, not client truth.
- Feature flag: None.

## Changes Included

- `scripts/source/project-contract-depth-package-layer4.ts`
- `package.json` script `source:contract-depth-package:l4`
- `src/lib/source/data-model/read-adapter.ts`
- Focused tests for the overlay script and read adapter merge/query behavior.

## QA / Validation

- `npx jest scripts/source/__tests__/project-contract-depth-package-layer4.test.ts src/lib/source/data-model/__tests__/read-adapter.test.ts --runInBand` - passed.
- `npx eslint scripts/source/project-contract-depth-package-layer4.ts scripts/source/__tests__/project-contract-depth-package-layer4.test.ts src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/__tests__/read-adapter.test.ts` - passed.
- Pre-L4 Layer 3 repair/verify ACA proof: `/tmp/source-contract-depth-package-layer3-repair-verify-20260828T2004Z/summary.json` shows `contracts_with_assessed_alternatives: 0`, 298 adapter rows, 5 canonical contracts, 60 spend rows, 36 performance rows, 7 service-credit rows, 5 opportunities, and no readback failures.

## Rollout Plan

Merge to main, deploy through the repo-owned Azure Container Apps main deploy workflow, then run `source:contract-depth-package:l4` through the ACA operator job in `plan`, `apply`, and `verify` modes. The apply mode requires `SOURCE_CONTRACT_DEPTH_PACKAGE_L4_APPLY_APPROVED=true` and writes a local proof summary from the job logs.

## Deployment Authority

- Repo-owned deploy workflow: Required for the web/operator image before the L4 operator job runs.
- Shared runtime mutators: No direct shared web runtime mutation outside the repo-owned workflow.
- Approved image digest: Captured after the main ACA deploy succeeds.
- ACA runtime invariant: Required after deploy before claiming the release is live.
- Worker image invariant: Required before running the operator job.
- Feature/env flag update path: None.
- Live signed-in proof required: Required after Layer 4 apply/verify to confirm Source and Optimize screens render the projected rows without cross-tenant strings.

## Rollback Plan

Remove the scoped row from `source.l4_cube_active_load_run_overlay` for the affected tenant/load run, then rerun the L4 projection job or the standard Source L4 refresh to restore the base active-run-only read models. If the deployed code must be rolled back, revert this PR and use the repo-owned ACA main deploy workflow.

## Audit Evidence

- PR and commit for this release candidate.
- Local focused Jest and ESLint output.
- Layer 3 repair/verify ACA proof folder: `/tmp/source-contract-depth-package-layer3-repair-verify-20260828T2004Z/`.
- Layer 4 ACA plan/apply/verify proof folders to be captured during rollout.

## Known Gaps

Layer 4 apply/verify and signed-in product proof are pending this release candidate's merge and ACA deploy.
