# 2026-09-20-phase-advance-route-ci-ownership - Phase advance route CI ownership

## Release ID

`2026-09-20-phase-advance-route-ci-ownership`

## Status

`candidate`

## Plain-English Summary

The pull-request workflow now runs the remaining unowned route suite that exercises a governed phase-gate write. Its focused approval-gate contract was already owned by another workflow. The sibling program-advance directory became fully owned through the v1 API parent before this change and is deliberately not duplicated.

## Layer Impact

- `global-control-lane`: CI and release-control ownership for lifecycle-write routes.
- No product runtime, schema, migration, tenant data, or authorization behavior changes.

## Client Applicability

- All clients: future pull requests receive the additional lifecycle-write validation.
- Specific clients: none.
- Internal only: CI ownership and audit evidence.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add one exact-path workflow command for the remaining unowned route suite.
- Add a behavior guard requiring that exact path and full census ownership for both governed-write directories.
- Refresh the generated test-to-CI census.

## QA / Validation

- PASS - all four files across the two directories: 4 suites / 21 tests.
- PASS - remaining newly owned route file: 1 suite / 5 tests.
- PASS - phase-advance CI ownership guard: 2 tests.
- PASS - mutation checks prove the phase-gate approval-permission guard and hard-gate advance guard can fail.
- PASS - TypeScript, scoped ESLint, workflow YAML parsing, release control, and repository behavior suite before merge.

## Rollout Plan

Merge through the protected pull-request path. The CI coverage is active on subsequent pull requests; no migration or data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: unchanged; a main deploy may run because repository policy deploys every merged change.
- Shared runtime mutators: none in this change.
- Approved image digest: resolved only by the repo-owned deploy workflow after merge.
- ACA runtime invariant: unchanged and checked by the repo-owned workflow if it runs.
- Worker image invariant: unchanged and checked by the repo-owned workflow if it runs.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no product behavior changed; authenticated product proof is not claimed.

## Rollback Plan

Revert the workflow command, behavior guard, and generated census update. No migration or data rollback is required.

## Audit Evidence

- The generated census confirms both governed-write directories are fully covered: one by this exact route command and one by the existing v1 API parent.
- The behavior guard requires an exact-path command so dynamic route segments cannot be treated as regular expressions.
- Mutation output is summarized in the pull request.

## Known Gaps

None in the two targeted route directories. This release does not address unrelated red or unowned test trees.
