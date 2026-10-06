# 2026-09-19 Azure Retrieval Behavior Proof

## Release ID

`2026-09-19-azure-retrieval-behavior-proof`

## Status

`candidate`

## Plain-English Summary

Replaces a test that only searched retrieval source code for two strings with tests that execute the real retrieval assembler. The tests now prove that client identity resolves to a tenant-scoped Azure read, governed chunks are divided into client, industry, and topic lanes, and read failures produce empty evidence rather than invented context.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 product assurance: retrieval behavior is exercised through its public assembly function.
- No Layer 1, Layer 2, Layer 3, schema, migration, or tenant-data change.

## Client Applicability

- All clients: test coverage only; runtime behavior is unchanged.
- Specific clients: None.
- Internal only: Release assurance.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Add executable tests for Azure context retrieval behavior.
- Remove the superseded source-text assertion from the Atlas integration contract.

## QA / Validation

- Focused retrieval behavior and existing Atlas grounding contract suites: 2 suites, 10 tests passed.
- Mutation check: short-circuiting the governed chunk read produced 1 failing retrieval case and a non-zero exit; production code was restored before final validation.
- TypeScript no-emit, focused ESLint, release control, and diff checks: passed.

## Rollout Plan

Merge through the protected pull-request lane. The repository-owned ACA workflow may deploy the test-only commit with the next main image; there is no product behavior change to activate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending merge and deploy.
- ACA runtime invariant: Required if a main image is deployed.
- Worker image invariant: Required if a main image is deployed.
- Feature/env flag update path: None.
- Live signed-in proof required: No; rendered behavior is unchanged.

## Rollback Plan

Revert the test-only commit. No data or schema rollback is required.

## Audit Evidence

- Pull request and CI links after creation.
- Focused test output and release-control result.

## Known Gaps

This change does not decide whether the entire integration-test directory should become one CI gate; that separate governance decision remains open.
