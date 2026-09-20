# 2026-09-20-deliverables-suite-ci — Run Deliverables Tests in CI

## Release ID

`2026-09-20-deliverables-suite-ci`

## Status

`candidate`

## Plain-English Summary

The tests protecting generated deliverables, export routes, and approval controls now run on every
pull request. Stale display-label and renderer snapshots were reconciled to the already-released
behavior before the reachable tree was wired. One orphan synthesis suite stays excluded.

## Layer Impact

- `global-control-lane`: CI ownership for shared deliverable generation and export behavior.
- Product runtime and tenant data: unchanged.

## Client Applicability

- All clients: shared validation only.
- Specific clients: none.
- Feature flag: none.

## Changes Included

- Runs the two repaired deliverables directories, seven deliverables route suites, and the one
  previously dark deliverables component suite alongside the already-owned green subtrees.
- Keeps the control-specific component suite under its existing workflow to avoid a double run.
- Updates two document-final renderer snapshots and one normalized evidence-family assertion.
- Adds a behavior contract requiring every reachable deliverables directory to remain covered and
  pinning the one explicitly orphaned synthesis suite.

## QA / Validation

- Baseline: 86 of 88 suites passed; 936 of 939 tests passed.
- After repair, the full tree check is 88 suites and 939 tests passing; all three snapshots pass.
- The CI-owned reachable set is 87 suites and 936 tests. The one-suite, three-test synthesis
  subtree remains unwired because no product path reaches its implementation.
- Behavior, TypeScript, lint, release control, and workflow parsing must pass before merge.

## Rollout Plan

Squash-merge through the protected repository. CI ownership takes effect after merge; the repo-owned
ACA workflow may publish the same commit without changing product behavior.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Live signed-in proof required: no; no product surface changes.

## Rollback Plan

Revert the squash commit. No schema or tenant-data rollback is required.

## Audit Evidence

- Baseline and repaired Jest results are recorded under execution item T-413.
- The coverage census and behavior contract prove the entire deliverables tree has a workflow owner.

## Known Gaps

This release validates existing generation behavior; it does not make generated content client-final
or bypass its existing review and approval controls. The synthesis suite remains excluded until a
product path reaches it; a passing orphan test is not treated as product coverage.
