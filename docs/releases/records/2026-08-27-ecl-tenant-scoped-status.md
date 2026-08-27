# 2026-08-27-ecl-tenant-scoped-status — ECL Tenant-Scoped Completion Status

## Release ID

`2026-08-27-ecl-tenant-scoped-status`

## Status

`candidate`

## Plain-English Summary

The ECL completion status now states which active tenant is covered by live product proof. This prevents route, surface, finding, and eval proof for one tenant from being read as proof for every active tenant in the registry.

## Layer Impact

- Layer 1 Client Intake: reads the active tenant registry as the tenant denominator for status reporting.
- Layer 4 Products: no product behavior changes.
- Layer 5 Serving: no serving view changes.
- Governance and proof: four-lane completion status now carries active tenant coverage and open items for active tenants without ECL live proof.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: none.
- Internal only: status and proof interpretation for ECL clean-break execution.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/write_ecl_four_lane_completion_status.mjs`
- `scripts/ecl/__tests__/run-ecl-four-lane-status-tests.mjs`
- `docs/architecture/ecl-four-lane-completion-status.json`
- `docs/architecture/ECL_CLEAN_BREAK_INTEGRATED_EXECUTION_PLAN_2026_08_24.md`

## QA / Validation

- `node scripts/ecl/__tests__/run-ecl-four-lane-status-tests.mjs` passed.

## Rollout Plan

Merge to `main`. No Azure data-plane load, runtime flag change, route repoint, or traffic shift is required for this reporting-only release.

## Deployment Authority

- Repo-owned deploy workflow: not required for runtime behavior.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, status/reporting only.

## Rollback Plan

Revert the PR if the status schema change breaks downstream reporting. Product routes and data-plane rows are unaffected.

## Audit Evidence

- PR and CI evidence for this release candidate.
- Existing live product proof run referenced by `docs/architecture/ecl-four-lane-completion-status.json`.

## Known Gaps

- This release does not load or prove additional tenant data. It only makes active-tenant proof coverage explicit.
