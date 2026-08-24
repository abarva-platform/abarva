# 2026-08-24-ecl-serving-readback-export-fix — ECL Serving Readback Export Fix

## Release ID

`2026-08-24-ecl-serving-readback-export-fix`

## Status

`candidate`

## Plain-English Summary

Adds the 40 serving-view proof counts to the governed ECL all-layer readback and independent
readback export. The Azure load already built the serving views; this patch makes the proof export
report them so the row-for-row comparator can verify that every planned serving surface is present
and non-empty.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 4 Product Projections: no projection rows or product route behavior change.
- Serving layer proof: readback now reports `serving_contract_rows`, `serving_views_declared`,
  `serving_views_populated`, and `serving_views_empty` beside the projection counts.

## Client Applicability

- All clients: ECL data-build/readback proof scripts only.
- Specific clients: none.
- Internal only: operator proof and local validation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Updates `scripts/ecl/execute_dense_all_layer_load.py` so the all-layer readback SQL includes the
  40 serving-view contract counts.
- Updates `scripts/ecl/export_dense_all_layer_readback.py` so the independent readback export writes
  those serving counts under the `projection` section used by the comparator.
- Extends `test:ecl-dense-readback-query` to assert the serving keys and all 40 serving views are
  counted.

## QA / Validation

- `pass` — `npm run test:ecl-dense-readback-query`.
- `pass` — `npm run ecl:dense-azure-gate:package && npm run ecl:dense-azure-gate:validate`.
- `pass` — `npm run release:check`.

## Rollout Plan

Merge by PR. The repo-owned main deploy workflow will build the digest-pinned image used for the
next governed read-only ACA readback execution. No product default-provider repoint or browser proof
is included.

## Deployment Authority

- Repo-owned deploy workflow: required before using the fix in an ACA job image.
- Shared runtime mutators: none in this PR.
- Approved image digest: required for subsequent ACA data-build/readback job.
- ACA runtime invariant: job idle restore must be verified after any ACA execution.
- Worker image invariant: required before claiming any ACA data-build/readback execution complete.
- Feature/env flag update path: none.
- Live signed-in proof required: required before claiming any product surface is live-proven.

## Rollback Plan

Revert this PR before the next readback job. If a readback job has already run, retain its proof
bundle and comparator output as the audit basis for the decision to continue or rerun.

## Audit Evidence

- Readback query test: `scripts/ecl/__tests__/run-ecl-dense-readback-query-tests.mjs`.
- Data-build readback script: `scripts/ecl/execute_dense_all_layer_load.py`.
- Independent readback exporter: `scripts/ecl/export_dense_all_layer_readback.py`.

## Known Gaps

- Does not itself rerun the ACA readback job.
- Does not provide browser/live/product proof.
