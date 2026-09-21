# 2026-09-20-rendered-ai-controls-ci-ownership - Rendered AI control CI ownership

## Release ID

`2026-09-20-rendered-ai-controls-ci-ownership`

## Status

`candidate`

## Plain-English Summary

Pull-request CI now runs the shared rendered AI disclosure controls, the phase-workspace controls, and the two program approval-action suites. The key component tests fail when the visible confidence, AI-draft, or human-decision disclosure is removed.

## Layer Impact

- `global-control-lane`: test and release-control ownership for shared user-interface disclosure and approval behavior.
- No client data, schema, migration, product runtime, or user-interface implementation changes.

## Client Applicability

- All clients: future pull requests receive the additional CI coverage.
- Specific clients: none.
- Internal only: CI ownership and its audit evidence.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add parent workflow commands for the shared rendered-control and phase-workspace test trees.
- Add an exact-path workflow command for the two approval-action suites whose parentheses-bearing path cannot be used as an unescaped Jest pattern.
- Add a behavior guard for command ownership and generated-census ownership.
- Refresh the generated test-to-CI census.

## QA / Validation

- PASS - measured baseline: 9 suites and 64 tests.
- PASS - visible-control mutation checks for the confidence tier, AI label, and human-decision attestation.
- PASS - behavior ownership guard and generated census.
- PASS - repository behavior suite, TypeScript, scoped ESLint, workflow YAML parsing, and release control before merge.

## Rollout Plan

Merge through the protected pull-request path. The workflow coverage is active on subsequent pull requests. There is no data-plane or feature rollout.

## Deployment Authority

- Repo-owned deploy workflow: unchanged; a main deploy may run because repository policy deploys every merged change.
- Shared runtime mutators: none in this change.
- Approved image digest: resolved only by the repo-owned deploy workflow after merge.
- ACA runtime invariant: unchanged and checked by the repo-owned workflow if it runs.
- Worker image invariant: unchanged and checked by the repo-owned workflow if it runs.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no product behavior changed; authenticated product proof is not claimed.

## Rollback Plan

Revert the workflow commands, behavior guard, generated census update, and this release record. No migration or data rollback is required.

## Audit Evidence

- The committed generated census records all three directories as workflow-owned.
- Focused test and mutation outputs are summarized in the pull request.
- The exact-path command prevents shell or Jest regex interpretation of the route-group parentheses.

## Known Gaps

This release proves the component and action tests run in CI. It does not replace the catalog's separate surface-level behavioral tests and does not claim signed-in rendering on every consuming page.
