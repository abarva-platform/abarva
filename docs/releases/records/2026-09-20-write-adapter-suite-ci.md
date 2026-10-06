# 2026-09-20-write-adapter-suite-ci — Run Data-Plane Write Tests in CI

## Release ID

`2026-09-20-write-adapter-suite-ci`

## Status

`candidate`

## Plain-English Summary

The eleven suites that protect data-plane writes now run on every pull request. One stale test mock
was updated to the Azure/Postgres read path used by production; no product behavior was loosened.

## Layer Impact

- `global-control-lane`: adds CI ownership for shared data-plane write-adapter behavior.
- Layer 2 and Layer 3 runtime behavior: unchanged; the tests cover the existing write seams.

## Client Applicability

- All clients: Shared validation only.
- Specific clients: None.
- Internal only: CI and test changes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Runs `src/lib/data-plane/write-adapters/__tests__` from `unit-suites.yml`.
- Updates the quarantine lifecycle test mock to the Azure/Postgres compatibility client.
- Corrects stale comments describing the parent-row read path.
- Adds a behavior contract for workflow reachability and Jest prefix safety.

## QA / Validation

- Baseline: 10 suites passed, 1 failed; 166 tests passed and 3 failed because a retired read module
  was mocked.
- After repair: 11 suites and 169 tests pass.
- Removing the Azure tenant predicate from the attachment soft-delete SQL makes its suite fail,
  proving the tenant fence assertion can detect the defect.
- The imported quarantine lifecycle module has two non-test API route consumers.
- TypeScript, targeted ESLint, behavior tests, workflow YAML validation, and release control must
  pass before merge.

## Rollout Plan

Squash-merge through the protected repository. The repo-owned ACA main deploy may publish the same
commit; the user-visible runtime remains unchanged.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Resolved by the repo-owned workflow after merge.
- ACA runtime invariant: Verified by the repo-owned workflow after merge.
- Worker image invariant: Verified by the repo-owned workflow after merge.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No; no product surface changes.

## Rollback Plan

Revert the squash commit to remove the workflow step and restore the prior test mock. No database or
tenant state rollback is required.

## Audit Evidence

- Pull request and CI checks created from `codex/T412-triage-write-adapter-suites`.
- Baseline, repaired, and mutation Jest outputs captured in the execution record.

## Known Gaps

The broader shared write-adapter migration remains governed by its own data-plane rollout and
readback controls. This release only ensures the existing adapter contracts cannot remain dark in
CI.
