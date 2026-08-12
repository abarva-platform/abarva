# 2026-08-12-source-stage-header-artifact-readiness — Source Stage Header Artifact Readiness

## Release ID

`2026-08-12-source-stage-header-artifact-readiness`

## Status

`candidate`

## Plain-English Summary

The Source event stage header now distinguishes completed intake inputs from full approval readiness. When required inputs are complete but file or artifact review is still blocking the gate, the header says `inputs ready` instead of the broader `ready` label.

## Layer Impact

- Lane: `global-control-lane`.
- Products: Source event canvas presentation only. The stage gate logic, data model, approvals, files, and artifacts are unchanged.

## Client Applicability

- All clients: applies to the shared Source event workflow.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx --runInBand`
- PASS: `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`
- PASS: `git diff --check`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- NOT-RUN: GitHub PR checks, pending PR.
- NOT-RUN: repo-owned Azure Container Apps deployment proof, pending merge.
- NOT-RUN: signed-in browser proof on the Source event stage route, pending deployment.

## Rollout Plan

Merge through the protected PR path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: recorded after deployment.
- ACA runtime invariant: verify after deployment.
- Worker image invariant: verify after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the same repo-owned Azure Container Apps workflow.

## Audit Evidence

- PR URL: pending.
- Local validation: pending.
- ACA deployment proof: pending.
- Signed-in browser proof: pending.

## Known Gaps

This is a label correction only. It does not change the artifact review workflow or approval gate semantics.
