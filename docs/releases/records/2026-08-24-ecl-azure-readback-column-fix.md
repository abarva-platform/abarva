# 2026-08-24-ecl-azure-readback-column-fix — ECL Azure Readback Column Fix

## Release ID

`2026-08-24-ecl-azure-readback-column-fix`

## Status

`candidate`

## Plain-English Summary

Fixes the governed ECL data-build readback query so the Tower value-chain drift check uses the
value-chain table's `measure_id` column. The evidence queue keeps using `related_measure_id`.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 4 Product Projections: no projection rows or table shapes change.
- Data-build proof: the ACA execution/readback query is corrected so it can verify loaded Tower
  value-chain rows.

## Client Applicability

- All clients: ECL data-build proof script only.
- Specific clients: none.
- Internal only: operator proof and local validation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Updates `scripts/ecl/execute_dense_all_layer_load.py` readback SQL for
  `tower_value_chain_measure_drift`.
- Extends `test:ecl-dense-readback-query` to assert the Tower value-chain and evidence-queue
  measure references use their respective columns.

## QA / Validation

- `pass` — `npm run test:ecl-dense-readback-query`.
- `not-run` — Full local dense gate package rerun after this patch before any subsequent ACA retry.

## Rollout Plan

Merge by PR. The next repo-owned image build will produce a digest-pinned image for the governed
ACA data-build retry. No product default-provider repoint or browser proof is included.

## Deployment Authority

- Repo-owned deploy workflow: required before using the fix in an ACA job image.
- Shared runtime mutators: none in this PR.
- Approved image digest: required for subsequent ACA data-build job.
- ACA runtime invariant: job idle restore must be verified after any data-build execution.
- Worker image invariant: required before claiming any ACA data-build execution complete.
- Feature/env flag update path: none.
- Live signed-in proof required: required before claiming any product surface is live-proven.

## Rollback Plan

Revert the PR before the next data-build job. If a job has already run, rely on the job proof and
independent readback before making any product cutover decision.

## Audit Evidence

- Readback query test: `scripts/ecl/__tests__/run-ecl-dense-readback-query-tests.mjs`.
- Data-build script: `scripts/ecl/execute_dense_all_layer_load.py`.

## Known Gaps

- Does not itself rerun the ACA data-build.
- Does not provide independent Azure readback.
- Does not provide browser/live/product proof.
