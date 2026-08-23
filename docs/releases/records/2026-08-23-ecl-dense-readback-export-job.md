# 2026-08-23-ecl-dense-readback-export-job - ECL Dense Readback Export Job

## Release ID

`2026-08-23-ecl-dense-readback-export-job`

## Status

`candidate`

## Plain-English Summary

Adds a read-only ACA operator job entrypoint that independently reads back the dense ECL lab/preprod load from inside the VNet, compares it against the dense source-room contract, writes comparator-ready export files, and emits a small proof bundle.

## Layer Impact

Release lane: `client-data-lane`.

Layer 1 through Layer 4: Read-only validation only. No source records, context objects, commercial rows, projections, cubes, routes, or product runtime behavior are changed by this script.

## Client Applicability

- All clients: No.
- Specific clients: Dense synthetic ECL lab/preprod proof only.
- Internal only: Operator readback tooling.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/ecl/export_dense_all_layer_readback.py`
- `package.json` script `ecl:dense-all-layer:readback`

## QA / Validation

- PASS: `python3 -m py_compile scripts/ecl/export_dense_all_layer_readback.py`
- PASS: `ECL_DENSE_TARGET_DATA_PLANE=lab_preprod npm run ecl:dense-all-layer:readback` refuses with `DATABASE_URL_missing` when no database binding is supplied.
- NOT-RUN: read-only ACA operator job against lab/preprod waits for merge and digest-pinned image deployment.

## Rollout Plan

Merge to `main`, allow the repo-owned ACA main deploy workflow to build and deploy a digest-pinned image, then run the private ACA operator job with `--script ecl:dense-all-layer:readback` and the same lab/preprod target classification used by the dense load.

## Deployment Authority

- Repo-owned deploy workflow: Required before using the new script in the shared operator image.
- Shared runtime mutators: None from this script.
- Approved image digest: Required.
- ACA runtime invariant: Required by main deploy workflow.
- Worker image invariant: Required before operator job use.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not for this readback job.

## Rollback Plan

Revert this PR and use the prior readback evidence from the mutating job logs. The script is read-only, so no data rollback is required.

## Audit Evidence

- PR checks and local validation output.
- Future ACA operator readback job logs and extracted proof bundle.

## Known Gaps

This change does not load data, mutate Azure, repoint product routes, retire legacy assets, or capture browser QA.
