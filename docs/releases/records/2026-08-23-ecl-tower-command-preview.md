# 2026-08-23-ecl-tower-command-preview — ECL Tower Command Preview Proof

## Release ID

`2026-08-23-ecl-tower-command-preview`

## Status

`candidate`

## Plain-English Summary

Adds a local Tower preview proof for the ECL commercial command-center projection. The preview renders the gated commercial value rows, shows the deliberately weak contract, and fails when internal process language or snake-case tokens leak into the visible page.

## Layer Impact

`global-control-lane`: Layer 4 product projection proof only. This change adds a static render and QA gate for the existing ECL Tower projection output; it does not change canonical data, Azure data, product route defaults, or Tower runtime reads.

## Client Applicability

- All clients: no live behavior change.
- Specific clients: none.
- Internal only: ECL local proof and operator status automation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/render_tower_command_center_preview.py`: renders `tower_command_center_projection.csv` into a static HTML preview and JSON QA report.
- `docs/architecture/ecl-no-stop-execution-queue.json`: adds the Tower preview as an auto-proceed local slice before the queue self-validation and before the hard-gated browser/product-route slice.

## QA / Validation

- `python3 scripts/ecl/render_tower_command_center_preview.py --out-dir /tmp/ecl-tower-next-proof --require-weak-contract`: passed after the first red run caught visible internal vocabulary.
- `python3 scripts/ecl/run_no_stop_execution_queue.py`: passed 19 / 19 executable local slices and stopped at the declared `product_route_repointing` hard gate.

## Rollout Plan

Merge to `main` through PR. The repo-owned Azure Container Apps main deploy workflow may publish the code artifact, but no environment flag, data-plane load, product route repoint, or traffic behavior is changed by this slice.

## Deployment Authority

- Repo-owned deploy workflow: yes, after merge to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: resolved by the main deploy workflow.
- ACA runtime invariant: verified by the main deploy workflow.
- Worker image invariant: verified by the main deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: no live product claim is made; required before any Tower route repoint or ECL-provider default switch.

## Rollback Plan

Revert this PR. The rollback removes the static Tower preview proof and queue entry only; no database or runtime data rollback is required.

## Audit Evidence

- Local Tower preview QA JSON: `outputs/ecl-commercial-contract-supply-correction-2026-08-22/tower_command_center_static_preview/tower-command-center-preview-qa.json`.
- Local no-stop queue summary: `outputs/ecl-no-stop-execution-run/execution-summary.json`.
- Local operator status: `outputs/ecl-no-stop-execution-run/operator-status.json`.

## Known Gaps

- This is not a live Tower route proof.
- This is not signed-in browser QA.
- This does not load ECL data into Azure or authorize product-route repointing.
