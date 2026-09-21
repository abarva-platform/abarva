# 2026-09-20-source-export-suite-ci — Run Source Export Tests in CI

## Release ID

`2026-09-20-source-export-suite-ci`

## Status

`candidate`

## Plain-English Summary

The tests that protect Source files and reports now run on every pull request. This includes the
checks that block an unreviewed RFP body and keep every downloadable artifact aligned with the same
governed verdict.

## Layer Impact

- `global-control-lane`: adds CI ownership for shared Source export behavior.
- Layer 4 product outputs: runtime behavior is unchanged; existing export controls gain continuous
  regression coverage.

## Client Applicability

- All clients: Shared validation only.
- Specific clients: None.
- Internal only: CI and test ownership changes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Runs `src/lib/source/exports/__tests__` from `unit-suites.yml`.
- Adds a behavior contract for workflow reachability, census coverage, and Jest prefix safety.

## QA / Validation

- All 24 export suites and 250 tests pass unchanged.
- `narrative-export-quality-gate` passes four cases, including blocking an RFP scaffold and a failed
  quality gate.
- `artifact-verdict-consistency` passes and remains independently owned by the AI surface control
  workflow; the one-suite overlap is intentional.
- The export modules have live non-test API and product consumers.
- Removing the workflow step makes the ownership behavior test fail.
- TypeScript, targeted ESLint, workflow YAML parsing, release control, and the regenerated coverage
  census must pass before merge.

## Rollout Plan

Squash-merge through the protected repository. The repo-owned ACA main deploy may publish the same
commit; no product behavior or tenant data changes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Resolved by the repo-owned workflow after merge.
- ACA runtime invariant: Verified by the repo-owned workflow after merge.
- Worker image invariant: Verified by the repo-owned workflow after merge.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No; no product surface changes.

## Rollback Plan

Revert the squash commit to remove the workflow step and its ownership contract. No database or
tenant state rollback is required.

## Audit Evidence

- Pull request and CI checks created from `codex/T420-triage-source-exports`.
- Baseline, mutation, and final Jest outputs are recorded in the execution log.

## Known Gaps

This release gives the existing export controls a CI owner. It does not claim that every Source
artifact route has universal send or human-approval enforcement.
