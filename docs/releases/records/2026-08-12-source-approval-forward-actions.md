# 2026-08-12-source-approval-forward-actions - Source Approval Forward Actions

## Release ID

`2026-08-12-source-approval-forward-actions`

## Status

`candidate`

## Plain-English Summary

Source stage approvals now provide explicit next-step actions when the stage is not ready to decide. If workflow inputs are incomplete, the approval page links back to the stage steps. If artifact or file review gaps remain, the approval page links directly to Files & deliverables.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Updates the shared Source event approval workspace to remove a dead-end diagnostic state.
- Canonical model: No schema, persistence, or calculation change.
- Source adapters: No intake, parser, or adapter change.

## Client Applicability

- All clients: Yes, for the shared Source event workflow.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source event route behavior.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`

## QA / Validation

- `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx --runInBand` passed: 3 tests.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx` passed.
- TypeScript, release check, and live signed-in proof are required before this release is marked released.

## Rollout Plan

Merge to main and deploy through the repo-owned Azure Container Apps workflow.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: Not used by this PR.
- Approved image digest: Produced by the main ACA deploy workflow.
- ACA runtime invariant: Verify after deployment.
- Worker image invariant: Verify after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming browser-visible workflow proof.

## Rollback Plan

Revert this PR and redeploy through the main ACA workflow. No data rollback is required.

## Audit Evidence

- PR URL and merge commit.
- Focused Jest, ESLint, TypeScript, release check, and signed-in browser proof after deployment.
- ACA deployment run, active revision, and digest invariant after merge.

## Known Gaps

This release does not certify the full 11-stage New Event journey or generated artifact quality. It only adds explicit next-step navigation from approval readiness blockers.
