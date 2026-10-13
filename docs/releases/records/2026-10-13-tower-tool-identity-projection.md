# 2026-10-13 Tower tool identity and case source trails

## Release ID

`2026-10-13-tower-tool-identity-projection`

## Status

`candidate`

## Plain-English Summary

Tower now recognizes a tool rollout when an adoption row declares a tool ID, even if the row also links to an AI use case. A row linked only to a use case remains a usage observation. Tower also shows dated case observations and Finance events as source-reported history, while keeping unverified money out of verified and reportable totals.

## Layer Impact

`global-control-lane`. Layer 4 Tower read-model and case-drawer presentation only. Source records, canonical identities, loaded data, and the serving selector are unchanged.

## Client Applicability

- All clients: These presentation rules apply to every tenant with Tower adoption or dated case source rows.
- Specific clients: None.
- Internal only: None.
- Public/demo only: The same rule applies to synthetic demonstrations.
- Feature flag: None.

## Changes Included

The Tower read-model population rule, dated source-event mapping and drawer wording, and regression tests covering tool identity, case-only usage, and source-reported history without verified totals.

## QA / Validation

Focused Tower read-model and drawer tests passed (42/42). Targeted ESLint passed. The release check passed all 11 gates. Signed-in checks of Tools and the case drawer remain not run until deployment.

## Rollout Plan

Merge through a PR. The repo-owned ACA main deploy workflow builds and deploys the approved digest-pinned image. Verify runtime image parity, health, full traffic assignment, and the signed-in Tower view before calling the change live.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: The repo-owned workflow only.
- Approved image digest: To be recorded from the successful main deploy.
- ACA runtime invariant: Template and 100% traffic revision must match the approved digest.
- Worker image invariant: Required worker jobs must match the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for Tools and the case drawer.

## Rollback Plan

Revert the read-model and drawer changes through a PR and the repo-owned ACA main deploy workflow. Verify the restored digest and signed-in Tower views.

## Audit Evidence

PR checks, focused read-model and drawer test output, release validation, ACA deploy run and digest, runtime invariant readback, and signed-in Tower evidence.

## Known Gaps

Deployment and signed-in proof remain pending until the PR merges and the repo-owned workflow completes.
