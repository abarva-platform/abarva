# 2026-08-24-ecl-serving-surface-enumeration-guard — ECL Serving Surface Contract Guard

## Release ID

`2026-08-24-ecl-serving-surface-enumeration-guard`

## Status

`candidate`

## Plain-English Summary

Adds the 40-surface ECL serving enumeration and the demo-findings contract to the clean-break
execution plan. The projection schema reconciliation test now reads the product needs contract and
plan contract from a named git ref. This prevents a projection surface from being specified in
product planning but silently absent from committed DDL unless it is explicitly declared not built
with an owner and due date.

## Layer Impact

- `global-control-lane` — Layer 4 Products/projections: strengthens the reconciliation guard
  between product needs, projection DDL, and planned not-built projection backings.
- `global-control-lane` — Layer 5 Serving: publishes the intended Home, Tower, Source, and
  Intelligence serving-view contract without creating serving DDL yet.
- `client-data-lane` — Layer 1 Intake/source-room fixture: adds pinned demo-finding prerequisite
  fields and source-level checks for the dense source-room generator. No Azure data-plane load is
  performed by this change.

## Client Applicability

- All clients: Applies to the shared ECL clean-break control-plane contract.
- Specific clients: None.
- Internal only: Validation and execution planning only.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/architecture/ECL_CLEAN_BREAK_INTEGRATED_EXECUTION_PLAN_2026_08_24.md`
- `docs/architecture/meridian-demo-findings-20260824.json`
- `.github/workflows/ecl-no-stop-data-pipeline.yml`
- `scripts/ecl/generate_dense_source_room_extracts.py`
- `scripts/ecl/__tests__/run-ecl-demo-findings-source-contract-tests.mjs`
- `scripts/ecl/__tests__/run-ecl-projection-schema-reconciliation-tests.mjs`
- `package.json`

## QA / Validation

- `ECL_RECONCILE_REF=HEAD npm run test:ecl-projection-schema-reconciliation` — passed.
  Confirmed 12 specified product projections, 7 committed product projection tables, 5 explicit
  not-built declarations, and 40 enumerated product surfaces split Home 16 / Tower 9 / Source 9 /
  Intelligence 6.
- `npm run test:ecl-demo-findings-source-contract` — passed. Confirmed the committed 10-finding
  spec, pinned demo as-of date, required generator fields, and source-level finding prerequisites
  for F1, F2, F3, F4, F5, F6, F7, and F9. F8 and F10 remain projection/serving assertions for W2/W3.
- `python3 scripts/ecl/validate_dense_source_room_extracts.py --out-dir /tmp/ecl-demo-findings-source-room-20260824-1320` — passed with 14 extracts and 7,080 rows.
- `npm run release:check` — passed.

## Rollout Plan

Merge to `main`. No Azure deploy, data-plane load, migration, or route cutover is required for this
documentation, generator-field, and test-guard change.

## Deployment Authority

- Repo-owned deploy workflow: Not required.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR. This removes the plan enumeration and restores the previous reconciliation test.

## Audit Evidence

- PR URL after opening.
- Local output from `ECL_RECONCILE_REF=HEAD npm run test:ecl-projection-schema-reconciliation`.
- Local output from `release:check`.

## Known Gaps

- This does not build W2 projection surfaces or W3 serving DDL.
- Serving views are only enumerated here; product routes are not repointed by this change.
- Data assertions against loaded `ecl_context` / `ecl_commercial` and surface assertions against
  serving views remain W2/W3 work. This change pins the spec and source-room prerequisites first.
