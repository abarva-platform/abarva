# 2026-08-22-ecl-multi-slice-execution-runner — ECL Multi-Slice Execution Runner

## Release ID

`2026-08-22-ecl-multi-slice-execution-runner`

## Status

`candidate`

## Plain-English Summary

Adds a multi-slice execution runner for the ECL no-stop queue. The runner reads the machine-readable queue, executes pre-authorized local proof/report slices in order, publishes progress checkpoints at 0/15/30/45/60/75/90/100 percent, records per-slice logs, and marks hard-gated work separately from queued work that still needs a proof command.

## Layer Impact

Release lane: `internal-admin`.

Layer 2/3/4 proof operations: changes the local ECL proof workflow from a hand-run sequence into an ordered queue runner. It does not alter ECL schema, source data, projections, cubes, or product runtime behavior.

## Client Applicability

- All clients: none directly.
- Specific clients: none.
- Internal only: ECL proof execution and release workflow.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/run_no_stop_execution_queue.py` executes the queue, emits checkpoints, writes an execution summary, status report, event log, and per-slice logs.
- `scripts/ecl/validate_no_stop_execution_queue.py` distinguishes executable auto-proceed slices from queued slices that still need proof commands.
- `docs/architecture/ecl-no-stop-execution-queue.json` now includes the next visible Source 360 quality slices as queued work while preserving the product-route/browser hard gate.
- `.github/workflows/ecl-no-stop-data-pipeline.yml` now runs the queue runner and packages its execution artifacts.
- `docs/architecture/ECL_NO_STOP_EXECUTION_QUEUE_2026_08_22.md` documents the runner and checkpoint contract.

## QA / Validation

- `python3 scripts/ecl/run_no_stop_execution_queue.py` passed locally with `7 / 7` executable slices, `3` queued-for-proof-command slices, and `1` hard-gated browser/product-repointing slice.
- The runner emitted checkpoints at `0`, `15`, `30`, `45`, `60`, `75`, `90`, and `100` percent.
- `python3 -m py_compile scripts/ecl/run_no_stop_execution_queue.py scripts/ecl/validate_no_stop_execution_queue.py` passed.
- `npm run release:check` passed.

## Rollout Plan

Merge to main as proof-runner automation. The repo-owned PR checks validate the runner. No Azure data-plane load, no migration, no active tenant input replacement, no product route repointing, and no direct traffic mutation are performed by this runner.

## Deployment Authority

- Repo-owned deploy workflow: merge to main may trigger the existing ACA main deploy workflow for application code propagation.
- Shared runtime mutators: none in this runner.
- Approved image digest: handled only by `.github/workflows/aca-main-deploy.yml` if main deploy runs.
- ACA runtime invariant: handled only by `.github/workflows/aca-main-deploy.yml` if main deploy runs.
- Worker image invariant: handled only by `.github/workflows/aca-main-deploy.yml` if main deploy runs.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this proof-runner automation; required before any product-route/browser claim.

## Rollback Plan

Revert the PR that adds the runner and workflow wiring. Existing individual proof commands remain available.

## Audit Evidence

- Local execution summary: `outputs/ecl-no-stop-execution-run/execution-summary.json`.
- Local status report: `outputs/ecl-no-stop-execution-run/execution-status.md`.
- Local checkpoint event log: `outputs/ecl-no-stop-execution-run/execution-events.jsonl`.
- Per-slice local logs under `outputs/ecl-no-stop-execution-run/logs/`.

## Known Gaps

- The next Source 360 quality slices are named but not executed until their proof commands exist.
- Product route repointing and signed-in browser proof remain hard-gated.
