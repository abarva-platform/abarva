# 2026-08-23-ecl-readback-logical-counts — ECL Readback Logical Counts

## Release ID

`2026-08-23-ecl-readback-logical-counts`

## Status

`candidate`

## Plain-English Summary

The dense ECL readback exporter now reports both physical schema counts and the logical layer counts used by the row-for-row proof contract. The comparator now checks the contract-declared proof keys and ignores extra diagnostic layers, so a populated target no longer appears failed because the export uses schema-qualified table groups.

## Layer Impact

- `client-data-lane`: Updates governed ECL readback proof tooling for lab/preprod data-build jobs.
- `Layer 2 SOURCE ADAPTERS`: No intake or adapter contract change.
- `Layer 3 CANONICAL MODEL`: No schema change.
- `Layer 4 PRODUCTS`: No product route or UI change.

## Client Applicability

- All clients: No.
- Specific clients: Synthetic dense ECL lab/preprod proof package only.
- Internal only: Yes, for governed data-build/readback validation.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/ecl/execute_dense_all_layer_load.py`
- `scripts/ecl/export_dense_all_layer_readback.py`
- `scripts/ecl/compare_ecl_dense_azure_readback_export.py`
- `docs/releases/records/2026-08-23-ecl-readback-logical-counts.md`

## QA / Validation

- `python3 -m py_compile scripts/ecl/execute_dense_all_layer_load.py scripts/ecl/export_dense_all_layer_readback.py scripts/ecl/compare_ecl_dense_azure_readback_export.py` passed.
- `npm run ecl:dense-azure-gate:package` passed.
- `npm run ecl:dense-azure-gate:validate` passed.
- Positive comparator sample accepted 86 contract-declared proof keys.
- Negative comparator sample rejected a planted row-count mismatch.

## Rollout Plan

Merge to main. The next governed ACA read-only readback job will emit the expanded logical layer counts in `readback_counts.json`. No product route or runtime behavior changes with this release.

## Deployment Authority

- Repo-owned deploy workflow: Required before shared runtime images consume this script update.
- Shared runtime mutators: None in this change.
- Approved image digest: Not applicable until the repo-owned deploy workflow builds the next image.
- ACA runtime invariant: Not changed by this PR.
- Worker image invariant: Future ACA data-build/readback jobs must use a digest-pinned image.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is proof tooling only.

## Rollback Plan

Revert this release record and the script changes. Existing loaded data remains untouched; only future readback export/comparison behavior changes.

## Audit Evidence

- `reports/ecl-dense-azure-load-gate-package-2026-08-23/ecl_dense_azure_row_for_row_readback_contract.json`
- `/tmp/ecl-readback-compare-positive-*`
- `/tmp/ecl-readback-compare-negative-*`

## Known Gaps

- This does not rerun Azure load/readback by itself.
- This does not wire product routes to ECL projections.
- This does not claim browser or live product proof.
