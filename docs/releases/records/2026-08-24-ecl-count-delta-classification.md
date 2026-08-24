# 2026-08-24-ecl-count-delta-classification — ECL Count Delta Classification Gate

## Release ID

`2026-08-24-ecl-count-delta-classification`

## Status

`candidate`

## Plain-English Summary

This release turns the dense ECL local proof count expectations into a classified contract. A planted demo-data change may increase expected counts only when the row increase is tied to a named producer or finding. A decrease now requires a written explanation before expectations can move.

It also fixes an identity regression in the synthetic finding planter: a platform finding changed the platform primary key, which caused deployment hosting edges to drop. The finding now changes descriptive attributes while preserving the `PLAT-####` identity used by deployment references.

The operator completion expectation is corrected from 100% to 91% because the operator validation
denominator includes four hard-gated slices. The executable local queue still passes 12 of 12
slices; the hard gates are intentionally not counted as complete.

## Layer Impact

- `client-data-lane`, Layer 1 synthetic source room: preserves primary-key identity while planting infrastructure findings.
- `client-data-lane`, Layers 2 and 3 local proof: validates dense local proof counts through a shared count contract.
- `client-data-lane`, Layer 4 projections: count assertions now include all built ECL projection surfaces in the shared contract.

## Client Applicability

- All clients: no runtime or data-plane effect.
- Specific clients: none.
- Internal only: ECL synthetic proof and CI guardrails.
- Public/demo only: synthetic proof fixtures only.
- Feature flag: none.

## Changes Included

- Adds `docs/architecture/ecl-dense-all-layer-count-contract.json`.
- Adds `scripts/ecl/validate_dense_all_layer_local_proof_counts.py`.
- Updates the no-stop data pipeline workflow to call the count-contract validator instead of hardcoded inline expectations.
- Updates the Azure gate validator test to read the shared count contract.
- Classifies the five W2 projection-table producer-count increases.
- Classifies the operator completion-percent correction caused by hard-gated slices remaining open.
- Adds a source-contract regression assertion that demo infrastructure findings must not replace platform primary keys.
- Preserves platform identity in `scripts/ecl/generate_dense_source_room_extracts.py` while keeping the Netezza finding attributes.

## QA / Validation

- PASS: `python3 -m py_compile scripts/ecl/generate_dense_source_room_extracts.py scripts/ecl/validate_dense_all_layer_local_proof_counts.py scripts/ecl/load_dense_source_room_context_layer.py scripts/ecl/load_dense_source_room_review_layer.py scripts/ecl/load_dense_source_room_source_projection_layer.py scripts/ecl/load_dense_source_room_cube_layer.py`
- PASS: `python3 scripts/ecl/run_no_stop_execution_queue.py`
- PASS: `python3 scripts/ecl/validate_no_stop_execution_queue.py`
- PASS: `python3 scripts/ecl/validate_ecl_operator_status_report.py`
- PASS: `npm run ecl:dense-all-layer:validate-counts`
- PASS: `npm run test:ecl-demo-findings-source-contract`
- PASS: `npm run test:ecl-dense-azure-gate-validator`
- PASS: `ECL_RECONCILE_REF=$(git rev-parse HEAD) npm run test:ecl-projection-schema-reconciliation`

## Rollout Plan

Merge through PR. The next ECL no-stop data pipeline run will use the shared count contract instead of hardcoded workflow expectations.

## Deployment Authority

- Repo-owned deploy workflow: not required by this release.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because this release does not repoint product routes or mutate runtime data.

## Rollback Plan

Revert this release. Rollback restores inline workflow expectations and the prior finding planter behavior, so use only if the shared count contract blocks unrelated ECL work.

## Audit Evidence

- `docs/architecture/ecl-dense-all-layer-count-contract.json`
- `scripts/ecl/validate_dense_all_layer_local_proof_counts.py`
- `outputs/ecl-dense-all-layer-count-contract-validation/dense_all_layer_count_contract_validation_summary.json`
- `outputs/ecl-no-stop-execution-run/execution-summary.json`
- `outputs/ecl-no-stop-queue-validation/validation-summary.json`

## Known Gaps

No Azure data-plane load, product route repointing, browser/live proof, or legacy retirement is performed by this release.
