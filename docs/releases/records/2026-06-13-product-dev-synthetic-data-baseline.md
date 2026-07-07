# 2026-06-13-product-dev-synthetic-data-baseline — Product Dev Synthetic Data Baseline

## Release ID

`2026-06-13-product-dev-synthetic-data-baseline`

## Status

`candidate`

## Plain-English Summary

Adds the governed synthetic data baseline packet for Product Dev. It makes clear that synthetic data is a reference showcase for the same Admin bulk-load path pilot clients will use, not a shortcut seed path.

## Layer Impact

- `global-control-lane`: Defines Product Dev data-readiness governance without loading data.
- `client-data-lane`: Defines ingestion, idempotency, receipt, citation, and readiness requirements that future client data planes must follow.
- `internal-admin`: Defines where operators must stop for approval before writing, indexing, or promoting data.

## Client Applicability

- All clients: Indirectly; this becomes the reference process future client uploads must mirror.
- Specific clients: None.
- Internal only: Applies directly to AbarVa Product Dev synthetic reference data.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/azure/PRODUCT_DEV_SYNTHETIC_DATA_BASELINE_2026-06.md`
- `docs/azure/PRODUCT_DEV_SYNTHETIC_DATA_BASELINE_2026-06.json`
- `scripts/azure/verify-product-dev-synthetic-data-baseline.mjs`
- `npm run azure:product-dev-synthetic-data:verify`
- Production-readiness CI gate verifies the packet.

## QA / Validation

- PASS — `npm run azure:product-dev-synthetic-data:verify`
- PASS — `npm run azure:product-dev-cicd:verify`
- PASS — `npm run azure:product-dev-provisioning:verify`
- PASS — `npm run azure:environment-factory:verify`
- PASS — `npm run azure:environment-rbac:verify`
- PASS — `npm run azure:environment-cost-controls:verify`
- PASS — `npx eslint scripts/azure/verify-product-dev-synthetic-data-baseline.mjs`
- PASS — `npm run audit:architecture-rules`
- PASS — `npm run release:check`

## Rollout Plan

Merge to main. This is a non-mutating planning and governance slice. Actual synthetic data upload/load/index/retrieval/promotion remains blocked until explicit approval and Product Dev infrastructure.

## Rollback Plan

Revert this PR to remove the packet and verifier. No Azure rollback is required because no Azure data, indexes, Blob objects, queues, runtime, or resources are changed.

## Audit Evidence

- PR diff and CI output.
- Verifier output from `npm run azure:product-dev-synthetic-data:verify`.
- Production-readiness gate output after merge.
- This release record.

## Known Gaps

No synthetic data is loaded by this slice. ENV-08 is complete only after the synthetic reference datasets pass the governed Admin bulk-load path, ingestion receipts, idempotency checks, retrieval/citation proof, and context-bundle proof in Product Dev.
