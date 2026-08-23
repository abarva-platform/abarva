# 2026-08-23-ecl-cross-family-planning-proof — ECL Cross-Family Planning Proof

## Release ID

`2026-08-23-ecl-cross-family-planning-proof`

## Status

`candidate`

## Plain-English Summary

This change adds the next local ECL proof batch after the commercial Source 360 slice. It turns cross-family workbook/source-room planning into executable artifacts: client extraction mapping, dense source-room requirements, product/page deterministic fact contracts, and an acceptance validator that rejects missing product coverage, missing source-family coverage, vague partial behavior, and overcollection language.

## Layer Impact

- Layer 1 Client Intake: planning artifacts only. No active tenant input files or workbook packages are replaced.
- Layer 2 Source Adapters: no adapter behavior changes.
- Layer 3 Canonical Enterprise Model: no schema, migration, or shared data-plane changes.
- Layer 4 Products: product deterministic needs are documented as local contracts only. No product route is repointed.
- Control lane: the no-stop queue gains four additional local proof slices.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: none.
- Internal only: ECL source-room/workbook planning proof.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/write_ecl_client_extraction_mapping.py`
- `scripts/ecl/write_ecl_dense_source_room_requirements.py`
- `scripts/ecl/write_ecl_product_fact_contracts.py`
- `scripts/ecl/validate_ecl_next_slice_acceptance.py`
- `docs/architecture/ecl-no-stop-execution-queue.json`
- `docs/architecture/ECL_NO_STOP_EXECUTION_QUEUE_2026_08_22.md`

## QA / Validation

- `python3 scripts/ecl/run_no_stop_execution_queue.py` must pass with the new slices included.
- `python3 scripts/ecl/validate_ecl_next_slice_acceptance.py` must pass after generated artifacts exist.
- `python3 -m py_compile` must pass for the new scripts.
- `npm run release:check` must pass.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow may rebuild and deploy the application image after merge, but this change does not activate a product route, mutate tenant data, or upload workbook packages.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only after merge to `main`.
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the deploy workflow if deployed.
- ACA runtime invariant: checked by the deploy workflow if deployed.
- Worker image invariant: checked by the deploy workflow if deployed.
- Feature/env flag update path: none.
- Live signed-in proof required: required before any product-route claim, not for these local planning artifacts.

## Rollback Plan

Revert the PR. The change is limited to scripts, docs, and local proof automation; no data-plane rollback is required.

## Audit Evidence

- Cross-family extraction mapping: `outputs/ecl-next-slice-planning-2026-08-23/ecl_client_extraction_mapping_summary.json`
- Dense source-room requirements: `outputs/ecl-next-slice-planning-2026-08-23/ecl_dense_source_room_requirements_summary.json`
- Product fact contracts: `outputs/ecl-next-slice-planning-2026-08-23/ecl_product_deterministic_fact_contracts_summary.json`
- Acceptance gate: `outputs/ecl-next-slice-planning-2026-08-23/ecl_next_slice_acceptance_summary.json`
- No-stop queue run: `outputs/ecl-no-stop-execution-run/execution-summary.json`

## Known Gaps

Client-facing workbook package replacement, dense synthetic package promotion, active tenant source replacement, Azure data-plane mutation, migration execution, product route repointing, and legacy retirement remain hard-gated and out of scope.
