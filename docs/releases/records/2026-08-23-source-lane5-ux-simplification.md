# 2026-08-23-source-lane5-ux-simplification — Source Workflow UX Simplification

## Release ID

`2026-08-23-source-lane5-ux-simplification`

## Status

`candidate`

## Plain-English Summary

This release simplifies Source workflow screens that buyers use to collect evidence and move a sourcing stage forward. It reduces stage-header scale, collapses a dense evidence checklist into clearer decision columns, and makes upload panels explicit that mapped templates write typed facts back to Source after the file is stored.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source UI presentation only. No tenant data, canonical data, parser behavior, workflow semantics, or evidence readiness rules are changed.

## Client Applicability

- All clients: Source event workflow screens receive the presentation changes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route availability only.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/TaskChecklist.tsx`
- Focused regression tests for stage header density, stage evidence table labels, and upload-panel clarity.

## QA / Validation

- Pass: `npx jest src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageHeader.test.tsx --runInBand` passed with 3 suites and 26 tests.
- Pass: `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/TaskChecklist.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageHeader.test.tsx src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx` passed.
- Not run: signed-in browser proof. This candidate has not been deployed.
- No database mutation, parser execution, workflow-state mutation, or Azure runtime mutation is included in this candidate.

## Rollout Plan

Merge to main through the normal pull-request lane. The repo-owned Azure Container Apps deploy workflow will publish the change with the next approved web deployment.

## Deployment Authority

- Repo-owned deploy workflow: Required for live runtime.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before calling the UX change live-proven.

## Rollback Plan

Revert the PR. This is presentation-only and does not require a data rollback.

## Audit Evidence

- PR URL: pending.
- Local focused test output: pending.
- Live signed-in/browser proof: pending.

## Known Gaps

This candidate does not redesign the Source event journey, change evidence requirements, alter parser persistence, or prove live signed-in behavior.
