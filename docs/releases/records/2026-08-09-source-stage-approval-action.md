# 2026-08-09-source-stage-approval-action — Source Stage Approval Action

## Release ID

`2026-08-09-source-stage-approval-action`

## Status

`candidate`

## Plain-English Summary

Source event stage approvals now show a real approval action inside the event approvals workspace when the server has already armed the current stage gate. The action posts to the existing Source approval endpoint, records the rationale, applies the stage confirmations, and sends the user to the next stage after success.

## Layer Impact

- Release lane: `global-control-lane`
- Layer 4 Products: Updates the Source event workspace presentation and click path only. No canonical data model, tenant intake, adapter, or loader behavior changes.

## Client Applicability

- All clients: Yes, for Source event workspaces.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`

## QA / Validation

- `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx --runInBand` passed.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed in the clean release branch.

## Rollout Plan

Merge through PR to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Must be verified after deploy.
- Worker image invariant: No worker changes expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify the current-stage approval action advances to the next Source stage.

## Rollback Plan

Revert the UI change and redeploy the previous approved ACA image through the same repo-owned deployment path.

## Audit Evidence

- Focused Jest regression output for the Source stage approval action.
- ESLint output for the touched Source canvas files.
- PR, CI, ACA deployment run, runtime invariant proof, and live signed-in Source event proof after merge/deploy.

## Known Gaps

Secondary Source UX findings remain out of scope for this blocker release.
