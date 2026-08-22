# 2026-08-22-ecl-no-stop-queue-manifest — ECL No-Stop Queue Manifest

## Release ID

`2026-08-22-ecl-no-stop-queue-manifest`

## Status

`candidate`

## Plain-English Summary

This change turns the ECL no-stop execution plan into a machine-readable queue. The queue records which proof slices can continue automatically, which evidence files prove each slice, and which actions must stop for explicit authorization.

## Layer Impact

- CI/control plane: adds queue validation to the ECL proof workflow.
- Documentation/governance: adds a machine-readable execution queue for the ECL proof lane.
- Product/runtime/data layers: no runtime route, database, tenant data, cube, projection, or Azure data-plane change.

## Client Applicability

- All clients: no direct client-facing change.
- Specific clients: none.
- Internal only: ECL build governance and proof execution.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `docs/architecture/ecl-no-stop-execution-queue.json`.
- Adds `scripts/ecl/validate_no_stop_execution_queue.py`.
- Updates `.github/workflows/ecl-no-stop-data-pipeline.yml` so the proof job validates and packages the queue output.

## QA / Validation

- PASS: `ruby -e "require 'yaml'; YAML.load_file('.github/workflows/ecl-no-stop-data-pipeline.yml'); puts 'workflow yaml ok'"`
- PASS: `python3 -m py_compile scripts/ecl/validate_no_stop_execution_queue.py scripts/ecl/run_commercial_contract_proof.py scripts/ecl/write_legacy_table_retirement_map.py`
- PASS: `python3 scripts/ecl/run_commercial_contract_proof.py && python3 scripts/ecl/write_legacy_table_retirement_map.py && python3 scripts/ecl/validate_no_stop_execution_queue.py`
- PASS: queue validation accepted 8 slices, 7 auto-proceed slices, 1 hard-gate blocked slice, and 17 evidence paths.

## Rollout Plan

Merge by PR. The ECL proof workflow will run on future matching PRs/pushes and on manual workflow dispatch. This change does not require a database migration or data-plane job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` remains the only shared ACA deployment lane after merge to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: not applicable before merge; main deploy workflow resolves it if deployment runs.
- ACA runtime invariant: not changed by this PR; main deploy workflow verifies it if deployment runs.
- Worker image invariant: not changed by this PR; main deploy workflow verifies it if deployment runs.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product surface changes.

## Rollback Plan

Revert this PR. The prior ECL proof workflow can continue without the queue validation step.

## Audit Evidence

- Local validation commands listed in this release record.
- CI workflow output for `.github/workflows/ecl-no-stop-data-pipeline.yml` after PR creation.
- Uploaded proof artifact should include `outputs/ecl-no-stop-queue-validation/validation-summary.json`.

## Known Gaps

- The queue is an execution-control artifact. It does not perform Azure data loads, migrations, active tenant replacement, product route repointing, browser QA, or legacy retirement.
