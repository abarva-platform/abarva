# 2026-08-10-source-workflow-stage-header-compact — Source Workflow Stage Header Compact

## Release ID

`2026-08-10-source-workflow-stage-header-compact`

## Status

`candidate`

## Plain-English Summary

The Source event workflow header now uses smaller, calmer typography. Stage pages such as Strategy, Scope, Value, and approval-workspace redirects no longer render the stage name as an oversized presentation headline.

## Layer Impact

Layer 4 Products / `global-control-lane`: Source event shell presentation only. No Source data, workflow state, approval semantics, tenant routing, parsing, or evidence persistence changes are included.

## Client Applicability

- All clients: Yes, for Source event workflow pages.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source access controls only.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: reduces the Source stage H1 and purpose-copy typography.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageHeader.test.tsx`: adds regression coverage for compact stage-title styling.

## QA / Validation

- Pass: `npm test -- --runInBand src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageHeader.test.tsx`.
- Pass: `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageHeader.test.tsx`.
- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check`.
- Not run yet: signed-in browser proof after deployment.

## Rollout Plan

Merge through the normal PR path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the merged SHA to `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy before claiming live.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workflow stage header typography.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- Local test output: pending.
- Deploy workflow: pending.
- Signed-in browser proof: pending.

## Known Gaps

This release is presentation-only. It does not change stage readiness, approval persistence, upload parsing, evidence quality, or generated artifacts.
