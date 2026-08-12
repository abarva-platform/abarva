# 2026-08-12-source-stage-approval-workspace-handoff - Source Stage Approval Workspace Handoff

## Release ID

`2026-08-12-source-stage-approval-workspace-handoff`

## Status

`candidate`

## Plain-English Summary

When every required step in a Source event stage is complete, the primary next action now opens the event's approval workspace instead of routing to the standalone intake approval page. This gives operators a clear path from completed evidence inputs to the governed stage decision, rationale capture, and approval ledger.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Updates the Source event canvas handoff between stage work and stage approval.
- Canonical model: No schema or persistence change.
- Source adapters: No intake, parser, or adapter change.

## Client Applicability

- All clients: Yes, for the shared Source event workflow.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source event route behavior.

## Changes Included

- `src/lib/source/source-event-shell-v2.ts`
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`
- `src/lib/source/__tests__/source-event-shell-v2.test.ts`

## QA / Validation

- `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx src/lib/source/__tests__/source-event-shell-v2.test.ts --runInBand` passed: 20 tests.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx src/lib/source/source-event-shell-v2.ts src/lib/source/__tests__/source-event-shell-v2.test.ts` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- `git diff --check` passed.

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
- Focused Jest, ESLint, TypeScript, and release check outputs.
- ACA deployment run, active revision, and digest invariant after merge.

## Known Gaps

This release does not certify the full 11-stage New Event journey or the generated artifact quality. It only fixes the completed-stage approval handoff path.
