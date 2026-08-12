# 2026-08-11-source-event-evidence-clarity — Source Event Evidence Clarity

## Release ID

`2026-08-11-source-event-evidence-clarity`

## Status

`candidate`

## Plain-English Summary

Adds a compact requirement row to the active Source event work step. When a user
opens a step such as a volumetrics upload, the right canvas now states the
required input, owner/source, expected format, and status before the upload or
review control. This makes the workflow clearer without changing evidence
semantics, upload routes, parser behavior, approval gates, or completion logic.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source event workspace presentation only. The Source canvas
  continues to render from the existing Source shell view model and governed
  evidence state.

## Client Applicability

- All clients: yes, for Source event workspaces.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageFallbacks.test.tsx`

## QA / Validation

- Pass: `npx jest --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageFallbacks.test.tsx src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx --runInBand`
- Pass: `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageFallbacks.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds
and deploys the updated web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the approved workflow.
- Approved image digest: populated by the deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source event workspace.

## Rollback Plan

Revert the PR or roll back to the prior ACA image digest through the approved
deploy lane. No schema, data-plane, parser, or workflow-state rollback is
required.

## Audit Evidence

- Pull request and CI checks.
- ACA deployment run and runtime invariant after merge.
- Source event workspace browser proof after deploy.

## Known Gaps

This release does not redesign the full 11-stage event journey, change artifact
quality, add new parsers, or alter aVa. It addresses the visible clarity of the
active step's input contract.
