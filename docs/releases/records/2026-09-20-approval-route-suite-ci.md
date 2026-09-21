# 2026-09-20-approval-route-suite-ci - Run Governed Approval Routes In CI

## Release ID

`2026-09-20-approval-route-suite-ci`

## Status

`candidate`

## Plain-English Summary

Nineteen approval and approval-adjacent route suites now run in the pull-request workflow. The
measurement found one stale admin-page assertion; the approval and tenancy route controls already
passed unchanged.

## Layer Impact

- `global-control-lane`: test and release controls only.
- Product and data layers: no runtime, schema, tenant-data, or product behavior changes.

## Client Applicability

- All clients: shared approval, tenant, and lifecycle route controls gain continuous test ownership.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Runs nineteen named route suites with `--runTestsByPath`.
- Updates one stale admin setup-page source test to the current governed route contract.
- Adds a behavior guard for the high-value gate suite list.
- Refreshes the generated CI coverage census.

## QA / Validation

- Baseline: 18 of 19 suites and 112 of 114 tests passed.
- Final: 19 suites / 114 tests pass.
- Approval-gate, tenant-fence, separation-of-duties, notification-recipient, and fail-closed cases
  pass separately from the repaired shell assertion.
- Disabling the request-approval recipient guard makes its route suite fail; omitting any one route
  from the exact-path workflow command makes the ownership behavior fail.
- TypeScript, targeted lint, workflow parse, behavior coverage, and release control pass before merge.

## Rollout Plan

Squash-merge through the protected repository. The repo-owned ACA main deploy may publish the same
commit, although the change affects only CI ownership and tests.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Resolved by the repo-owned workflow after merge.
- ACA runtime invariant: Verified by the repo-owned workflow after merge.
- Worker image invariant: Verified by the repo-owned workflow after merge.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No; there is no product surface change.

## Rollback Plan

Revert the squash commit. No data-plane rollback is required.

## Audit Evidence

- Exact-path Jest output captured in the execution record.
- Generated census records the change in workflow ownership.

## Known Gaps

The two partially covered phase-gate directories named in the backlog are outside this item. Their
already-owned files must be resolved through the census before broadening those parent commands.
