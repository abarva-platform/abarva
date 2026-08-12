# 2026-08-12-source-stage-approval-exception-clarity - Source Stage Approval Exception Clarity

## Release ID

`2026-08-12-source-stage-approval-exception-clarity`

## Status

`candidate`

## Plain-English Summary

Source stage approval now distinguishes a clean approval from an audited exception approval when required artifacts still have review gaps. The approval workspace shows the open review blockers before the user advances, and the action copy now makes clear that advancing with gaps is an exception that needs an explicit rationale and closure owner.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Updates Source event approval workspace copy, blocker visibility, and stage-gate rationale guidance.
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
- Focused Jest, ESLint, TypeScript, release check, and signed-in browser proof after deployment.
- ACA deployment run, active revision, and digest invariant after merge.

## Known Gaps

This release does not certify the full 11-stage New Event journey or generated artifact quality. It only clarifies the approval state when a completed stage still has artifact review gaps.
