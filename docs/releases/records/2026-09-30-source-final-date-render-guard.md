# 2026-09-30-source-final-date-render-guard — Accepted Final Date Rendering

## Release ID

`2026-09-30-source-final-date-render-guard`

## Status

`candidate`

## Plain-English Summary

The Source artifact workspace can render an accepted final whose acceptance timestamp arrives as a Date object. The option to restore that accepted final remains visible when a newer working draft is linked. Unrecognized timestamp values do not present the restore action.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 (Products): Source display logic only. Canonical facts, artifact authority, approval policy, and stored data are unchanged.

## Client Applicability

- All clients: Source artifact workspaces with an accepted final and a later working draft.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Handle valid Date and nonempty string acceptance timestamps at the restore-control display boundary.
- Add a mounted UI regression for Date-shaped and invalid-object values.
- No migration, data build, or external notification.

## QA / Validation

- Focused mounted UI suite: Pass (11 tests).
- Red-first reproduction: Pass; the Date-shaped fixture raised a `trim is not a function` error before the change.
- Mutation proof: Pass; removing Date handling made the new regression fail.
- Typecheck: Pass (`npx tsc --noEmit --pretty false`).
- Targeted lint: Pass.
- Release checks: Pass after declaring the release lane.
- CI and signed-in replay: Not run at candidate creation; record results before merge or live acceptance claims.

## Rollout Plan

Squash merge after applicable checks and review, then allow only the repository-owned ACA main workflow to deploy. Verify the digest-pinned runtime and replay the affected artifact workspace signed in.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: To be established by the main deploy workflow.
- ACA runtime invariant: Verify web template and 100%-traffic revision use the approved digest.
- Worker image invariant: Verify required workers use the same approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, restore the accepted final and retry the blocked downstream artifact step.

## Rollback Plan

Revert the squash merge through a PR and let the repository-owned main workflow redeploy; no schema or data rollback is required.

## Audit Evidence

The PR diff, focused test output, mutation result, applicable CI, official ACA run, read-only runtime invariant checks, and signed-in replay record.

## Known Gaps

Live restoration and downstream artifact generation remain unproven until the deployed signed-in replay. Unrelated workflow prerequisites remain governed independently.
