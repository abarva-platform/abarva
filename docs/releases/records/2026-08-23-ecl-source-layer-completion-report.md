# 2026-08-23-ecl-source-layer-completion-report — ECL Source Layer Completion Report

## Release ID

`2026-08-23-ecl-source-layer-completion-report`

## Status

`candidate`

## Plain-English Summary

Adds a local operator report that converts the ECL Source proof lane into a layer-by-layer completion matrix. The report distinguishes local source-room/projection/cube proof from dense source-family completion, Azure loading, product route adoption, and live browser proof.

## Layer Impact

- Release lane: `internal-admin`.
- Client intake: reports the current local workbook execution package and source-family coverage.
- Source adapters: reports which local builders and validators have proof.
- Canonical model: reports local disposable-Postgres evidence for source, context, commercial, and review tables.
- Products: reports local Source 360 and Tower projection readiness without claiming live product adoption.
- Cubes: reports local commercial cube proof and calls out missing cross-family cube population.

## Client Applicability

- All clients: none directly.
- Specific clients: none.
- Internal only: ECL build/operator status tracking.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/write_source_layer_completion_report.py`
- `reports/ecl-source-layer-completion-2026-08-23/SOURCE_LAYER_COMPLETION_REPORT.md`
- `reports/ecl-source-layer-completion-2026-08-23/source_layer_completion_summary.json`
- `reports/ecl-source-layer-completion-2026-08-23/source_layer_completion_matrix.csv`
- `reports/ecl-source-layer-completion-2026-08-23/source_backlog_20_status.csv`

## QA / Validation

- `python3 scripts/ecl/run_no_stop_execution_queue.py`
- `python3 -m py_compile scripts/ecl/write_source_layer_completion_report.py`
- `python3 scripts/ecl/validate_no_stop_execution_queue.py`
- `python3 scripts/ecl/write_source_layer_completion_report.py --out-dir /tmp/ecl-source-layer-completion-check`

The local queue passed 19 of 19 executable slices and stopped at the declared product-route hard gate.

## Rollout Plan

Merge to main as reporting/tooling only. No runtime rollout is required.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this report-only change.

## Rollback Plan

Revert the report script and generated report artifacts. No data-plane or runtime rollback is required.

## Audit Evidence

- Local queue summary: `outputs/ecl-no-stop-execution-run/execution-summary.json`
- Layer report: `reports/ecl-source-layer-completion-2026-08-23/SOURCE_LAYER_COMPLETION_REPORT.md`
- Machine-readable summary: `reports/ecl-source-layer-completion-2026-08-23/source_layer_completion_summary.json`

## Known Gaps

- Dense source rooms for all required families are not fully populated.
- Azure/client-preprod load and independent readback were not performed.
- Product routes were not repointed and live signed-in browser proof was not claimed.
- Home, Intelligence, Moves, and full cross-family cubes are not yet complete against ECL.
