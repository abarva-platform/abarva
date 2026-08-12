# 2026-08-11-source-stage-approval-forward-path — Source Stage Approval Forward Path

## Release ID

`2026-08-11-source-stage-approval-forward-path`

## Status

`candidate`

## Plain-English Summary

When a Source stage has all required inputs complete, the primary action now takes the user to the formal event approval page. A separate secondary action still lets the user review approval readiness inside the canvas. This removes the confusing state where the page said approval was next but the primary click only switched to another workspace panel.

## Layer Impact

- Lane: `global-control-lane`.
- Products: Updates the Source event canvas interaction for completed stage input checklists.
- Canonical model: No schema or data changes.
- Source adapters: No intake or parser changes.

## Client Applicability

- All clients: Applies to Source event canvases that use the shared shell.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/source-event-shell-v2.ts`
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/lib/source/__tests__/source-event-shell-v2.test.ts`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`

## QA / Validation

- Pass: `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx src/lib/source/__tests__/source-event-shell-v2.test.ts --runInBand`
- Pass: `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx src/lib/source/source-event-shell-v2.ts src/lib/source/__tests__/source-event-shell-v2.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `npm run release:check`

## Rollout Plan

Merge through the protected PR lane. The repo-owned Azure Container Apps main deploy workflow builds and deploys the approved main image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured after main deploy.
- ACA runtime invariant: Required before live-proof claim.
- Worker image invariant: Required before live-proof claim.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for any claim that the interaction is visible in production.

## Rollback Plan

Revert the PR and redeploy through the same repo-owned ACA workflow. No migration rollback is required.

## Audit Evidence

- Pull request URL, CI checks, deploy run, ACA runtime invariant, and focused Source stage tests.

## Known Gaps

This release only fixes the completed-stage forward path. It does not certify artifact quality, generated deliverable quality, end-to-end New Event readiness, or Optimize Contract readiness.
