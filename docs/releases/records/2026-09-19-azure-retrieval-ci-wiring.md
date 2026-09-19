# 2026-09-19 Azure Retrieval CI Wiring

## Release ID

`2026-09-19-azure-retrieval-ci-wiring`

## Status

`candidate`

## Plain-English Summary

Makes the executable governed-retrieval test part of the Atlas quality workflow. The test now runs when its implementation or test file changes, so the earlier source-text assertion is not replaced by a local-only check.

## Layer Impact

- Release lane: `global-control-lane`.
- Product assurance only: CI workflow coverage changes; product runtime behavior does not.

## Client Applicability

- All clients: shared test enforcement only.
- Specific clients: None.
- Internal only: Release assurance.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Trigger Atlas quality when the governed-retrieval behavior test changes.
- Execute that behavior test alongside the existing Atlas grounding contract.

## QA / Validation

- The exact workflow command passes locally with both suites and 10 tests.
- Workflow formatting, release control, and diff checks: passed.

## Rollout Plan

Merge through the protected pull-request lane. The changed workflow must execute on its own pull request before merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Not applicable to CI-only enforcement.
- ACA runtime invariant: Record if the repository-owned workflow builds a new main image.
- Worker image invariant: Record if the repository-owned workflow builds a new main image.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the workflow-only commit. No data, schema, or runtime rollback is required.

## Audit Evidence

- Pull request workflow run showing both suites execute.
- Local exact-command output and release-control result.

## Known Gaps

This is the narrow item 68 enforcement fix. The broader policy decision for all integration suites remains tracked separately.
