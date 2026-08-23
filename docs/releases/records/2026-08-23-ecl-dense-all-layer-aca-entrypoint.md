# 2026-08-23-ecl-dense-all-layer-aca-entrypoint — ECL Dense All-Layer ACA Entrypoint

## Release ID

`2026-08-23-ecl-dense-all-layer-aca-entrypoint`

## Status

`candidate`

## Plain-English Summary

Adds the missing dense ECL all-layer execute script that the governed ACA data-build job is expected to run. The entrypoint regenerates dense source-room extracts, builds source/context/commercial/review/projection/cube SQL, applies ECL DDL, replaces only the configured tenant and assessment slice, loads all layers, runs independent readback, and emits a proof bundle for the ACA operator wrapper.

## Layer Impact

Release lane: `client-data-lane`.

Layer 1: Regenerates the dense synthetic source-room extracts inside the operator job image.

Layer 2 and Layer 3: Loads source records and canonical context/commercial/review objects through the existing ECL builders.

Layer 4: Loads Source projections and cube read-model rows only. It does not repoint product routes or claim browser proof.

## Client Applicability

- All clients: No.
- Specific clients: Dense synthetic ECL lab/preprod load only.
- Internal only: Operator execution tooling.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/ecl/execute_dense_all_layer_load.py`
- `package.json` script `ecl:dense-all-layer:execute`
- Runtime image now includes Python, the Postgres client, ECL SQL drafts, and writable job output directories.

## QA / Validation

- PASS: `python3 -m py_compile scripts/ecl/execute_dense_all_layer_load.py`
- PASS: `npm run ecl:dense-all-layer:execute -- --plan-only --out-dir /tmp/ecl-dense-execute-plan-proof --dense-out-dir /tmp/ecl-dense-execute-source-room-proof`
- PASS: Disposable Postgres execute proof loaded all layers with expected readback counts and planted FK failures rejected.
- PASS: `npm run ecl:dense-all-layer:execute -- --plan-only --out-dir /tmp/ecl-dense-execute-plan-proof-2 --dense-out-dir /tmp/ecl-dense-execute-source-room-proof-2`

## Rollout Plan

Merge to `main`, build a digest-pinned ACA image through the repo-owned deploy workflow or approved image-build lane, then submit the governed ACA operator job with `--script ecl:dense-all-layer:execute` and explicit lab/preprod data-plane environment bindings. Azure data-plane execution remains a governed operator job action with readback proof.

## Deployment Authority

- Repo-owned deploy workflow: Required before shared runtime image use.
- Shared runtime mutators: ACA operator job only; no web traffic shift.
- Approved image digest: Required, `@sha256` pinned.
- ACA runtime invariant: Required for any shared runtime change.
- Worker image invariant: Required for operator job image.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not for this entrypoint; required later for route/browser QA claims.

## Rollback Plan

Revert this PR and use the previous image digest. If an operator data-build job has already loaded lab/preprod rows, rerun the prior approved load or restore from the captured readback/proof bundle according to the data-build job runbook.

## Audit Evidence

- Plan-only proof output under `/tmp/ecl-dense-execute-plan-proof-2`
- Disposable Postgres proof output under `/tmp/ecl-dense-execute-actual-proof`
- Release gate output from `npm run release:check`

## Known Gaps

This change does not submit an ACA job, mutate Azure by itself, perform Azure readback, deploy or repoint product routes, retire legacy assets, or capture browser QA.
