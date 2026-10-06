# 2026-09-19-programs-governance-integration-gate — Governed Programs Integration Coverage

## Release ID

`2026-09-19-programs-governance-integration-gate`

## Status

`candidate`

## Plain-English Summary

A dedicated pull-request check now runs the currently healthy Programs tests that protect tenant-scoped reads and writes, approval decisions, and lifecycle advancement. The broader historical directory remains outside the gate because 17 suites have stale fixtures, request harnesses, labels, or source-location assertions; those failures are cataloged rather than hidden or imported as a noisy blocker.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 / product controls: no product behavior changes; existing Programs control paths receive executable regression coverage.
- Release governance: a dedicated CI workflow makes removal or breakage of the selected control tests visible on every pull request.

## Client Applicability

- All clients: no product behavior change.
- Specific clients: none.
- Internal only: CI and engineering governance.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/programs-governance-integration.yml`
- `docs/architecture/programs-governance-integration-triage.json`
- `src/__tests__/behaviors/programs-governance-integration-ci.test.ts`

## QA / Validation

- Full directory baseline: 66 suites; 48 passed, 17 failed, 1 skipped; 1,444 tests passed, 31 failed, 20 skipped.
- Selected governance gate: 9 suites and 175 tests passed.
- Behavior contract verifies every selected suite is named by the dedicated workflow, the 17 excluded failures remain cataloged, and no broad known-red directory invocation is used.
- TypeScript, scoped ESLint, release control, and diff hygiene are required before merge.

## Rollout Plan

Merge through a protected pull request. GitHub Actions begins enforcing the dedicated check immediately. The normal repo-owned ACA workflow may include the repository-only change in a later image, but no runtime behavior depends on deployment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this release.
- Approved image digest: resolved by the repo-owned workflow after merge.
- ACA runtime invariant: required if this commit is included in a web deployment.
- Worker image invariant: required if this commit is included in a web deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: no; product behavior is unchanged.

## Rollback Plan

Revert the workflow and its behavior contract if the selected gate is incorrectly scoped. Do not replace it with the full known-red directory; re-triage and widen suite by suite.

## Audit Evidence

- The committed triage JSON records the full baseline, every excluded suite, and the selected gate.
- The PR check output records all 175 selected assertions executing successfully.
- The behavior test makes the workflow-to-triage mapping executable.

## Known Gaps

- Seventeen historical suites remain excluded until their stale fixtures, request harnesses, product labels, or source-location checks are repaired behaviorally.
- The gate covers the highest-value green subset, not every Programs integration test.
