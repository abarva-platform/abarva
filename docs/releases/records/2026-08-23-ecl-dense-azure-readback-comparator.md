# 2026-08-23-ecl-dense-azure-readback-comparator — Dense ECL Azure Readback Comparator

## Release ID

`2026-08-23-ecl-dense-azure-readback-comparator`

## Status

`candidate`

## Plain-English Summary

Adds an offline comparator for future dense ECL Azure readback exports. It compares an independent read-only export against the local row-for-row readback contract, emits row-count parity, and refuses missing rows, extra rows, field-hash mismatches, and count drift.

## Layer Impact

Release lane: `internal-admin`.

No data layer changes. This supports future Azure lab/preprod readback proof after a separately approved data-build job.

## Client Applicability

- All clients: Not directly active.
- Specific clients: None.
- Internal only: ECL operator validation and readback proof.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `scripts/ecl/compare_ecl_dense_azure_readback_export.py`.
- Adds npm scripts for readback comparison, positive sample validation, and planted negative validation.

## QA / Validation

- Pass: `python3 -m py_compile scripts/ecl/compare_ecl_dense_azure_readback_export.py`
- Pass: `python3 scripts/ecl/run_no_stop_execution_queue.py`
- Pass: `python3 scripts/ecl/run_ecl_dense_azure_gate_local_proof.py`
- Pass: `npm run ecl:dense-azure-readback:sample`
- Pass: `npm run ecl:dense-azure-readback:negative`
- Pass: `npm run release:check`

## Rollout Plan

Merge to main only. Future operators run this comparator after an explicitly approved Azure load and independent read-only export. This release does not connect to Azure or execute readback itself.

## Deployment Authority

- Repo-owned deploy workflow: Not used.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not affected.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Not claimed by this release.

## Rollback Plan

Revert this PR to remove the comparator script and npm entries. No data rollback is required because this release performs no data-plane mutation.

## Audit Evidence

- PR URL.
- Local command output from the QA / Validation section.
- Generated comparator reports under `reports/ecl-dense-azure-readback-compare-2026-08-23`.

## Known Gaps

- Actual Azure ACA Job execution is not authorized or performed.
- Actual Azure readback export is not produced by this release.
- Product route/browser QA remains hard-gated and is not claimed.
