# 2026-09-30-source-scope-criterion-review - Scope criterion review

## Release ID

`2026-09-30-source-scope-criterion-review`

## Status

`candidate`

## Plain-English Summary

Event Owners can review the current Scope gate criteria in the approvals workspace. The existing server-side decision and evidence checks still determine whether a criterion can be recorded and whether the stage can advance.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Source presentation only. No canonical data, adapter, or intake contract changes.

## Client Applicability

- All clients: Source event workspaces with the Scope approval flow.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- Reuse the governed stage-criterion review control for Scope as well as Strategy.
- Keep current-stage, active-event, linked Client Final, and authorized-review checks.
- Add a mounted Scope interaction test covering the criterion PATCH and unavailable review controls for an unauthorized viewer.

## QA / Validation

- Red-first mounted Scope test failed because no criterion review was rendered; passed after the change.
- Focused Source stage-approval tests, TypeScript, scoped ESLint, release check, and diff check before PR.
- Negative mutation of the review authorization guard before PR.
- Signed-in replay remains required after the official deploy.

## Rollout Plan

Squash merge a reviewed PR to main. Only the repo-owned ACA main workflow may build and deploy the digest-pinned image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None from an agent session.
- Approved image digest: Record from the official workflow after deployment.
- ACA runtime invariant: Verify template digest and sole 100%-traffic revision image match.
- Worker image invariant: Verify required worker job templates match the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, current Scope event approvals and criterion action visibility.

## Rollback Plan

Revert the PR and use the repo-owned main deploy workflow. Existing criterion decisions are not modified by this presentation change.

## Audit Evidence

PR, CI results, official deployment run, immutable runtime readback, and private signed-in smoke ledger.

## Known Gaps

Rendering a review control does not itself approve a criterion or a stage. Decisions still require truthful evidence and an authorized Event Owner action.
