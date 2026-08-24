# 2026-08-24-ecl-w2-product-projections - ECL W2 Product Projection Backings

## Release ID

`2026-08-24-ecl-w2-product-projections`

## Status

`candidate`

## Plain-English Summary

This release adds the remaining W2 product projection backings needed before the serving-view layer
can be built. It gives Tower deterministic value-chain, evidence-queue, and AI-portfolio projection
rows, and gives Intelligence deterministic pattern-evidence and question-context projection rows.

## Layer Impact

`global-control-lane`, Layer 4 product projections: adds five projection tables and loader output, all tied back to
`projection_entry` and FK-backed source/context/review/measure references.

`client-data-lane`, Layer 3 canonical/commercial/review: read-only input to this slice. No canonical tables are
changed by this release.

`global-control-lane`, Layer 5 serving and Layer 6 product pages: not changed. The serving views
and route cutover remain future slices.

## Client Applicability

- All clients: Applies to the shared ECL projection contract.
- Specific clients: None.
- Internal only: The dense synthetic fixture proof remains internal validation data.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds five ECL projection backings: `tower_value_chain`, `tower_evidence_queue`,
  `tower_ai_portfolio`, `intelligence_pattern_evidence`, and `intelligence_question_context`.
- Extends the dense source-room projection loader to populate the five backings.
- Extends Azure load/readback/gate validation scripts to purge, count, compare, and drift-check all
  twelve product projection backings.
- Updates the integrated clean-break plan and local count contract.

## QA / Validation

PASS: `python3 -m py_compile scripts/ecl/load_dense_source_room_source_projection_layer.py scripts/ecl/execute_dense_all_layer_load.py scripts/ecl/export_dense_all_layer_readback.py scripts/ecl/validate_ecl_dense_azure_load_gate_package.py`

PASS: `npm run ecl:source-room-source-projection:load`

PASS: `npm run ecl:dense-all-layer:validate-counts`

PASS: `ECL_RECONCILE_REF=$(git rev-parse HEAD) npm run test:ecl-projection-schema-reconciliation`

PASS: `npm run test:ecl-dense-readback-query`

PASS: `npm run test:ecl-dense-azure-gate-validator`

NOT RUN: Azure data-build load/readback, serving-view route proof, and browser proof. They are
future gated slices.

## Rollout Plan

Merge through a pull request. This release does not run an Azure data-build job by itself. A future
governed ACA data-build execution will reload the dense ECL slice and run a separate readback.

## Deployment Authority

- Repo-owned deploy workflow: Not required for this local projection contract slice.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Required only when a future deploy/load job runs.
- Worker image invariant: Required only when a future ACA job runs.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this slice; required before product/browser proof claims.

## Rollback Plan

Revert the PR. Since no Azure mutation or route repoint is included, rollback is source-code only.

## Audit Evidence

- Local projection load/readback summary.
- ECL projection schema reconciliation test output.
- Dense all-layer count-contract validation output.
- Dense readback query and Azure gate-validator test output.

## Known Gaps

- No Azure reload/readback is performed by this release.
- No serving views are built by this release.
- No product route is repointed by this release.
- No browser or live product proof is claimed by this release.
