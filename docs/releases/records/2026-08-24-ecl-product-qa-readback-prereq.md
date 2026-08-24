# 2026-08-24-ecl-product-qa-readback-prereq — Product QA gate readback prerequisite

## Release ID

`2026-08-24-ecl-product-qa-readback-prereq`

## Status

`candidate`

## Plain-English Summary

Allows the ECL product browser QA gate package to use the actual ACA readback export summary for zero-drift prerequisite checks when the separate row-parity comparator only reports count parity.

## Layer Impact

`client-data-lane`: report/gate generation only. No schema, source data, loader, route, runtime, browser, or product-provider behavior changes.

## Client Applicability

- All clients: No runtime product change.
- Specific clients: None.
- Internal only: ECL product browser QA gate readiness reporting.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/ecl/write_ecl_product_browser_qa_gate_package.py` now derives required zero-drift checks from the actual readback export summary when the compare summary does not carry a `quality_zero_checks` object.

## QA / Validation

- Pass expected before merge — `ECL_ACA_READBACK_COMPARE_PATH=/tmp/ecl-dense-all-layer-readback-compare-20260824T014633Z-current-contract/readback_compare_summary.json ECL_ACA_READBACK_EXPORT_SUMMARY_PATH=/tmp/ecl-dense-all-layer-readback-20260824T014633Z/proof/ecl-dense-all-layer-readback/ecl_dense_all_layer_readback_export_summary.json npm run ecl:product-browser-qa-gate:package`
- Pass expected before merge — `ECL_ACA_READBACK_COMPARE_PATH=/tmp/ecl-dense-all-layer-readback-compare-20260824T014633Z-current-contract/readback_compare_summary.json ECL_ACA_READBACK_EXPORT_SUMMARY_PATH=/tmp/ecl-dense-all-layer-readback-20260824T014633Z/proof/ecl-dense-all-layer-readback/ecl_dense_all_layer_readback_export_summary.json npm run ecl:product-browser-qa-gate:validate`
- Pass expected before merge — `npm run release:check`

## Rollout Plan

Merge by pull request. This is a report generator fix; no ACA web deploy or data reload is required for correctness of the data already loaded.

## Deployment Authority

- Repo-owned deploy workflow: Normal post-merge workflow may run, but no runtime product proof is claimed by this release.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not required for this report-only change.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR to restore the previous prerequisite calculation.

## Audit Evidence

- Actual ACA readback compare accepted 86 tables with zero count issues but omitted the `quality_zero_checks` object.
- Actual ACA readback export summary carried the drift values and showed the required checks at zero.

## Known Gaps

This does not execute browser QA, route repointing, or default-provider cutover. It only fixes the readiness gate's ability to consume the actual readback proof already produced.
