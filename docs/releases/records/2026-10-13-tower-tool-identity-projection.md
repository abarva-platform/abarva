# 2026-10-13 Tower tool identity projection

## Release ID

`2026-10-13-tower-tool-identity-projection`

## Status

`candidate`

## Plain-English Summary

Tower now recognizes a tool rollout when an adoption row declares a tool ID, even if the row also links to an AI use case. A row linked only to a use case remains a usage observation. This lets the Tools view include declared tools without treating separate case usage as another tool.

## Layer Impact

`global-control-lane`. Layer 4 Tower read-model presentation only. Source records, canonical identities, loaded data, and the serving selector are unchanged.

## Client Applicability

- All clients: The read-model rule applies to every tenant with Tower adoption rows.
- Specific clients: None.
- Internal only: None.
- Public/demo only: The same rule applies to synthetic demonstrations.
- Feature flag: None.

## Changes Included

The Tower read-model population rule and a regression test covering a declared tool linked to a case and a case-only usage observation.

## QA / Validation

The focused Tower read-model suite passed all 29 tests. Targeted ESLint and all 11 release checks passed locally. A signed-in check of the Tools view is required after deployment.

## Rollout Plan

Merge through a PR. The repo-owned ACA main deploy workflow builds and deploys the approved digest-pinned image. Verify runtime image parity, health, full traffic assignment, and the signed-in Tower view before calling the change live.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: The repo-owned workflow only.
- Approved image digest: To be recorded from the successful main deploy.
- ACA runtime invariant: Template and 100% traffic revision must match the approved digest.
- Worker image invariant: Required worker jobs must match the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the read-model change through a PR and the repo-owned ACA main deploy workflow. Verify the restored digest and signed-in Tower view.

## Audit Evidence

PR checks, the focused test output, release validation, ACA deploy run and digest, runtime invariant readback, and signed-in Tower evidence.

## Known Gaps

Deployment and signed-in proof remain pending until the PR merges and the repo-owned workflow completes.
