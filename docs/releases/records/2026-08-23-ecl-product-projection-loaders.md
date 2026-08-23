# 2026-08-23-ecl-product-projection-loaders — ECL Product Projection Loaders

## Release ID

`2026-08-23-ecl-product-projection-loaders`

## Status

`candidate`

## Plain-English Summary

The dense ECL projection builder now produces governed product projection rows for Home, Tower, and Intelligence instead of only Source. This closes the local producer gap for those projection tables while keeping product routes, browser proof, and Azure data-plane mutation as separate proof steps.

## Layer Impact

- `client-data-lane`: Updates local ECL data-build scripts and readback gates for client-scoped lab/preprod data.
- `Layer 4 PRODUCTS`: Adds projection producers for product-facing tables, but does not repoint any product route.
- `Layer 3 CANONICAL MODEL`: No schema or canonical-object contract change.

## Client Applicability

- All clients: No.
- Specific clients: Synthetic dense Meridian lab/preprod proof package only.
- Internal only: Yes, for governed data-build and QA workflow.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/ecl/load_dense_source_room_source_projection_layer.py`
- `scripts/ecl/execute_dense_all_layer_load.py`
- `scripts/ecl/export_dense_all_layer_readback.py`
- `scripts/ecl/validate_ecl_dense_azure_load_gate_package.py`
- `docs/releases/records/2026-08-23-ecl-product-projection-loaders.md`

## QA / Validation

- `python3 -m py_compile scripts/ecl/load_dense_source_room_source_projection_layer.py scripts/ecl/execute_dense_all_layer_load.py scripts/ecl/export_dense_all_layer_readback.py scripts/ecl/validate_ecl_dense_azure_load_gate_package.py` passed.
- `python3 scripts/ecl/load_dense_source_room_source_projection_layer.py --out-dir reports/ecl-dense-source-projection-local-load-2026-08-23` passed.
- `npm run ecl:dense-azure-gate:package && npm run ecl:dense-azure-gate:validate` passed.
- Planted failures rejected missing metric references, missing Home refusal payloads, missing Tower gate reasons, and invalid Intelligence context-pack references.

## Rollout Plan

Merge to main. A governed ACA data-build job may then use the updated image to reload the private lab/preprod ECL tables. Product routes remain unrepointed until the Azure readback and browser QA gates pass.

## Deployment Authority

- Repo-owned deploy workflow: Required before any shared runtime image is used.
- Shared runtime mutators: None in this change.
- Approved image digest: Not applicable until a future ACA data-build run selects a digest-pinned image.
- ACA runtime invariant: Not changed by this PR.
- Worker image invariant: Future ACA data-build job must use a digest-pinned image.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before any product route claim; not claimed here.

## Rollback Plan

Revert this release record and the script changes, then rerun the prior approved data-build image or proof bundle. No product route rollback is required because this change does not repoint routes.

## Audit Evidence

- `reports/ecl-dense-source-projection-local-load-2026-08-23/dense_source_room_ecl_source_projection_load_summary.json`
- `reports/ecl-dense-azure-load-gate-package-2026-08-23/ecl_dense_azure_row_for_row_readback_contract.json`
- `reports/ecl-dense-azure-load-gate-package-2026-08-23/ecl_dense_azure_load_gate_package_summary.json`

## Known Gaps

- Azure lab/preprod load and independent readback are not performed by this change.
- Product route/browser QA is not performed by this change.
- Legacy retirement is not performed by this change.
