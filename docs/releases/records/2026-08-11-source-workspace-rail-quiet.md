# 2026-08-11-source-workspace-rail-quiet — Quiet Source Workspace Rail

## Release ID

`2026-08-11-source-workspace-rail-quiet`

## Status

`candidate`

## Plain-English Summary

The Source event workspace rail no longer labels the inactive Intelligence Explorer workspace as
`hidden` or shows placeholder markers beside inactive workspace controls. The rail keeps the same
workflow destinations and state, but removes wording that looked like implementation/debug status to
end users.

## Layer Impact

- Layer 4 / Products (`global-control-lane`): Source event presentation only. The change affects the
  workspace navigation label rendering in the Source event canvas.
- Layers 1-3: No intake, adapter, canonical data, evidence, calculation, or persistence behavior
  changes.

## Client Applicability

- All clients: Yes, all tenants using the Source event workspace receive the quieter rail.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`

## QA / Validation

- Focused Source analytics canvas unit test: passed locally with 17/17 tests passing.
- ESLint on touched files: passed locally.
- TypeScript check: passed locally.
- Release check: passed locally.
- Diff whitespace check: passed locally.
- Signed-in browser proof on a live Source event workspace after deploy: not run yet in this
  candidate record; required after the repo-owned ACA deploy completes.

## Rollout Plan

Merge through a PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and
deploys the image. No database migration or data-build job is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for live `app.abarva.ai`.
- Shared runtime mutators: Not used.
- Approved image digest: Captured after the deploy workflow completes.
- ACA runtime invariant: Required before live-proof claim.
- Worker image invariant: Readback required if the deploy workflow updates worker jobs.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No data rollback is required.

## Audit Evidence

To be filled after merge/deploy:

- PR URL:
- CI/check output:
- ACA deploy run:
- Signed-in browser proof:

## Known Gaps

This does not redesign the full Source workflow or change artifact generation quality. It only removes
one visible rail-label clutter point.
