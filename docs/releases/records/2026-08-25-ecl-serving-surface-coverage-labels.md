# 2026-08-25-ecl-serving-surface-coverage-labels — ECL Serving Surface Coverage Labels

## Release ID

`2026-08-25-ecl-serving-surface-coverage-labels`

## Status

`candidate`

## Plain-English Summary

Adds a visible serving-surface coverage strip to the ECL-backed Source, Tower, and Intelligence
proof panels. The signed-in browser proof can now verify that the committed serving-surface contract
is visible on product routes, not only that the four entry routes load.

## Layer Impact

- `global-control-lane`: proof-visible product panels and local proof guard only.
- Layer 4 products: Source, Tower, and Intelligence show the serving-surface labels used by the
  browser proof denominator.
- QA / proof layer: the predeploy gate now verifies that the coverage labels and imports exist
  before a deploy-cycle browser proof.

No Layer 1 intake, Layer 2 adapter, Layer 3 canonical, schema, data-load, or serving-view change is
included.

## Client Applicability

- All clients: applies to routes using the ECL product default provider.
- Specific clients: current live proof target is the synthetic Meridian assessment.
- Internal only: proof harness guardrails.
- Public/demo only: not applicable.
- Feature flag: existing ECL product provider configuration only.

## Changes Included

- `src/components/ecl/EclServingSurfaceCoverage.tsx`
- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`
- `src/app/(maestro)/tower/page.tsx`
- `src/app/(maestro)/intelligence/page.tsx`
- `scripts/ecl/run_product_ecl_predeploy_gate.mjs`

## QA / Validation

- Passed: `npm run ecl:product-browser:predeploy-gate`
- Passed: `npx eslint src/components/ecl/EclServingSurfaceCoverage.tsx src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx src/app/(maestro)/tower/page.tsx src/app/(maestro)/intelligence/page.tsx scripts/ecl/run_product_ecl_predeploy_gate.mjs`
- Passed: `git diff --check`
- Passed: `npm run release:check`
- Pending after deploy: `ecl-product-live-proof` signed-in browser proof and aVa ablation eval.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deployment may ship the updated product
panels. After deployment, the ECL live proof workflow should rerun the signed-in default-route
browser proof and the aVa baseline-vs-ablation evaluation from the deployed digest.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this release beyond the normal repo-owned deploy workflow.
- Approved image digest: pending ACA main deploy.
- ACA runtime invariant: required before claiming deployed proof.
- Worker image invariant: required by the deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before claiming 40/40 named surfaces or post-cutover eval.

## Rollback Plan

Revert this release. The product routes continue to serve ECL data, but the browser proof will again
report missing named-surface labels until a replacement UI signal is shipped.

## Audit Evidence

- PR URL: pending.
- Local proof: `npm run ecl:product-browser:predeploy-gate`
- Local lint: targeted `npx eslint` command listed above.
- Local whitespace check: `git diff --check`
- Release gate: `npm run release:check`
- Live proof: pending post-deploy `ecl-product-live-proof` workflow artifact.

## Known Gaps

- This release does not mutate Azure data, repopulate ECL, retire legacy tables, or change route
  default-provider selection.
- Do not claim 40/40 browser proof or the post-cutover aVa eval until the post-deploy proof artifact
  is captured.
