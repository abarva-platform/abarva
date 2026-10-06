# 2026-09-17-source-ava-test-fixtures - Restore active-tenant aVa coverage

## Release ID

`2026-09-17-source-ava-test-fixtures`

## Status

`candidate`

## Plain-English Summary

Three Source aVa test suites now use an active synthetic tenant for their governed read-path fixtures. They retain opposite-tenant and restricted-evidence rejection checks. Runtime authorization and data are unchanged.

## Layer Impact

`global-control-lane`: Test coverage for the Layer 4 answer path only. No production layer, schema, data, or policy change.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: None.
- Internal only: Test infrastructure.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

Vendor-coverage, evidence-readiness, and artifact-quality aVa test fixtures and assertions.

## QA / Validation

PASS: three focused suites (25/25), full Source aVa cluster (302/302), scoped lint, TypeScript and release gate. NOT RUN: CI and signed-in answer proof; this PR makes no runtime answer change.

## Rollout Plan

Squash merge through a PR after current runtime deploys settle. The repo-owned ACA main workflow runs on main even though this change affects tests only; no migration or data job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Recorded by the deploy workflow.
- ACA runtime invariant: Verify after main deploy.
- Worker image invariant: Verify through the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: No new runtime behavior; existing answer acceptance remains separately pending.

## Rollback Plan

Revert the test-only change in a new PR; no data rollback.

## Audit Evidence

PR diff, focused and cluster test output, release check and CI run.

## Known Gaps

The answer paths still require signed-in acceptance on a stable deployed SHA; green unit tests do not prove that.
