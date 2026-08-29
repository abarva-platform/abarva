# 2026-08-29-tower-healthcare-demo-layer4-products — Tower Layer 4 Product Refresh

## Release ID

`2026-08-29-tower-healthcare-demo-layer4-products`

## Status

`candidate`

## Plain-English Summary

This release adds a governed Tower Layer 4 refresh path for the healthcare demo tenant. It projects the signed-off synthetic AI business-case package into Tower product rows and Tower cube slices, while preserving the boundary that source data, canonical objects, product projections, and cubes are separate layers.

## Layer Impact

Release lane: `public-demo`.

Layer 4 products: Adds the Tower product/cube loader that rebuilds only Tower projection rows and Tower cube rows for the scoped demo assessment.

Layer 3 canonical: Read-only dependency. The loader points every projected case/tool row back to canonical object and measure IDs.

Layer 1 and Layer 2: Read-only dependency. The refresh preserves source and adapter records and uses them only for source-record proof refs.

## Client Applicability

All clients: No.

Specific clients: Healthcare synthetic demo tenant only.

Internal only: No.

Public/demo only: Yes.

Feature flag: None.

## Changes Included

- Adds `scripts/tower/load-healthcare-demo-layer4-products.mjs`.
- Adds npm commands for Tower Layer 4 dry-run, readback validation, and ACA write-job execution.
- Adds a serving-function migration so Tower AI portfolio rows and adoption-lens rows are filtered by an explicit Layer 4 payload page key.
- Updates the Tower ECL reader to honor governed display-payload metrics and include adoption-lens tool rows in the AI/tool portfolio view.
- Adds a focused reader regression test for executive totals, display-payload measures, and adoption tool rows.

## QA / Validation

- Pass: `npm run tower:healthcare-demo-layer4-products:load`
- Pass: `npx jest src/lib/tower/__tests__/readTowerCommandCenter.test.ts --runInBand`
- Pass: `npx eslint src/lib/tower/readTowerCommandCenter.ts scripts/tower/load-healthcare-demo-layer4-products.mjs`
- Not run yet: ACA operator write job and signed-in Tower proof. These run only after merge and repo-owned ACA deployment.

## Rollout Plan

Merge through pull request, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the image, then run the Tower Layer 4 write job through the ACA operator job. No direct shared-runtime traffic mutation is performed outside the repo-owned deploy workflow.

## Deployment Authority

Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.

Shared runtime mutators: None in this release path outside the repo-owned workflow.

Approved image digest: Filled after the ACA main deploy completes.

ACA runtime invariant: Required after deploy before claiming live product proof.

Worker image invariant: Required after deploy before running the Layer 4 write job.

Feature/env flag update path: None.

Live signed-in proof required: Yes, for the Tower route after the Layer 4 Azure write job succeeds.

## Rollback Plan

Roll back by redeploying the previous approved ACA image and re-running the previous Tower projection build if needed. The data loader is scoped to Tower projection/cube rows for the demo assessment and does not delete Layer 1 source, Layer 2 adapter, or Layer 3 canonical records.

## Audit Evidence

- Pull request for this release.
- ACA main deploy run and runtime invariant proof.
- ACA operator job proof bundle for the Tower Layer 4 write.
- Signed-in Tower route proof after refresh.

## Known Gaps

Home, Source, and Intelligence product/cube refreshes are not changed by this release. They should be refreshed in subsequent layer work using the same source-to-canonical-to-product boundary.
