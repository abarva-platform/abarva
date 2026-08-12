# 2026-08-11-source-new-event-approval-handoff — Clear New Event approval handoff

## Release ID

`2026-08-11-source-new-event-approval-handoff`

## Status

`candidate`

## Plain-English Summary

When a Source New Event stage has all required workflow inputs completed, the main stage canvas now presents the approval gate as the primary next action inside the event shell. Users no longer need to infer the next move from a subtle text line or leave the event workflow to find the decision workspace.

## Layer Impact

- `global-control-lane`: Updates the shared Source New Event event-shell UI. It changes presentation and navigation only; the underlying stage, evidence, artifact, and approval read models remain unchanged.
- `client-data-lane`: No schema, migration, tenant data, parser, or canonical-data change.

## Client Applicability

- All clients: Source New Event event-shell users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`

## QA / Validation

- `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx --runInBand` — pass.
- Pending before release: focused lint, TypeScript, release check, PR checks, ACA deploy workflow, and runtime invariant readback.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image to the shared web runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Resolved by the deploy workflow after merge.
- ACA runtime invariant: Must be verified after deployment.
- Worker image invariant: Must be verified after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming end-to-end New Event QA pass; not claimed by this release record.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

- Pull request URL: to be added after PR creation.
- Local focused test output: stage approval test passes.
- Deployment evidence: to be added after merge/deploy.

## Known Gaps

This release does not certify the full 11-stage New Event journey, artifact quality, file parsing, aVa behavior, or signed-in end-to-end stage approval. It only fixes the completed-stage handoff so the next approval action is obvious and remains inside the event shell.
