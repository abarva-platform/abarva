# 2026-08-27-ecl-retained-target-cleanup-status — ECL Retained Target Cleanup Status

## Release ID

`2026-08-27-ecl-retained-target-cleanup-status`

## Status

`candidate`

## Plain-English Summary

This release updates the ECL cleanup tracker so active ECL target tables are marked as retained target substrate instead of unresolved legacy cleanup work. It also refreshes the static retirement inventory against the current committed SQL drafts and keeps the four completion lanes reported separately.

## Layer Impact

- Layer 3 canonical model: ECL source, context, commercial, and review tables are classified as retained target tables.
- Layer 4 products: ECL projection and serving tables are classified as retained target tables.
- Operations/proof: the four-lane status artifact advances the cleanup lane by classification only; no live database objects are changed by this PR.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: none.
- Internal only: cleanup tracking and release evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Updates the legacy retirement map generator to classify ECL targets as `RETAINED_ECL_TARGET`.
- Regenerates the static retirement map and summary from current SQL.
- Updates cleanup status tests to reflect the refreshed static inventory.
- Updates the four-lane status writer and committed status JSON to report the retained ECL target credit.

## QA / Validation

- PASS: `python3 scripts/ecl/write_legacy_table_retirement_map.py --out-dir reports/ecl-legacy-table-retirement-map-2026-08-22`
- PASS: `ECL_RECONCILE_REF=HEAD node scripts/ecl/__tests__/run-ecl-legacy-retirement-status-tests.mjs`
- PASS: `ECL_RECONCILE_REF=HEAD node scripts/ecl/__tests__/run-ecl-four-lane-status-tests.mjs`
- PASS: `python3 -m py_compile scripts/ecl/write_legacy_table_retirement_map.py`
- PASS: `node --check scripts/ecl/write_ecl_four_lane_completion_status.mjs`
- PASS: `git diff --check HEAD~1..HEAD`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. No Azure Container Apps deployment, data build, migration, feature flag, or route repointing is required for this tracking-only change.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR to restore the prior retirement-map classification and four-lane cleanup count.

## Audit Evidence

- PR checks for the release record gate and ECL status tests.
- Committed `docs/architecture/ecl-four-lane-completion-status.json`.
- Committed `reports/ecl-legacy-table-retirement-map-2026-08-22/legacy_table_retirement_summary.json`.

## Known Gaps

Live legacy object retirement is still pending; the next data-plane delete batch remains blocked until active code references are retired or explicitly classified.
