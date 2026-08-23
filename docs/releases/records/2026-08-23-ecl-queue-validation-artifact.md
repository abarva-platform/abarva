# 2026-08-23-ecl-queue-validation-artifact — ECL Queue Validation Artifact

## Release ID

`2026-08-23-ecl-queue-validation-artifact`

## Status

`candidate`

## Plain-English Summary

The ECL no-stop proof workflow now runs the queue validator before the dense all-layer proof assertion reads its validation summary. This keeps the proof artifact explicit instead of depending on an implicit side effect.

## Layer Impact

- Release/control tooling: adds a CI proof step only.
- Data layers: no data-plane schema, loader, adapter, projection, cube, or tenant-data behavior changes.
- Product surfaces: no UI, route, prompt, or runtime behavior changes.

## Client Applicability

- All clients: CI proof behavior only when matching ECL files change.
- Specific clients: none.
- Internal only: yes, release/proof workflow.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `.github/workflows/ecl-no-stop-data-pipeline.yml`

## QA / Validation

- Pass: local ECL no-stop queue execution completed 12/12 executable slices, reported `postflight_accepted: true`, and left four hard-gated slices blocked behind explicit approval.
- Pass: `python3 scripts/ecl/validate_no_stop_execution_queue.py` produced `accepted: true`, `issue_count: 0`, `slice_count: 16`, and wrote `outputs/ecl-no-stop-queue-validation/validation-summary.json`.
- Pass: `python3 scripts/ecl/validate_ecl_operator_status_report.py` produced `accepted: true`, `completion_percent: 100`, and `issue_count: 0`.
- Pending: PR CI re-run of the ECL no-stop data pipeline with the validation step ordered after queue execution.

## Rollout Plan

Merge to `main`. No ACA deploy, migration, feature flag, or data-plane apply is required because this is CI proof wiring only.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the workflow step if it causes unexpected CI behavior. No data rollback is required.

## Audit Evidence

- PR CI for the ECL no-stop data pipeline workflow.

## Known Gaps

None known for this proof-artifact fix.
