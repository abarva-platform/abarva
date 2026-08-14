# 2026-08-14-source-stage-ready-blocker-guidance — Source Stage Gate Blocker Guidance

## Release ID

`2026-08-14-source-stage-ready-blocker-guidance`

## Status

`candidate`

## Plain-English Summary

When a Source stage has all workflow inputs complete but cannot move to approval because artifact review is still open, the stage-ready panel now labels the list as an approval gate blocker and explains the next action in plain language.

## Layer Impact

Layer 4 PRODUCTS: Source presentation only. The stage-ready panel renders clearer blocker guidance from existing artifact-readiness data.

No Layer 1, Layer 2, or Layer 3 changes. No workflow persistence, parser, schema, upload API, approval automation, evidence-state mutation, or data-plane mutation changed.

## Client Applicability

- All clients: yes, for the live Source event detail stage workflow.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`

## QA / Validation

- `npx prettier --write src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx` — passed.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx` — passed.
- `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx --runInBand` — passed, with pre-existing duplicate manual mock warnings.

## Rollout Plan

Merge to main through a PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image to the shared web runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this release.
- Approved image digest: assigned by the deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, open a live Source event stage-ready workflow and confirm the approval gate blocker guidance renders.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. Because this is UI presentation only, rollback does not require data repair or migration rollback.

## Audit Evidence

Inspect the PR, CI output, focused Jest output, deploy workflow run, ACA runtime invariant proof, and live signed-in Source stage workflow proof.

## Known Gaps

This does not change artifact acceptance, exception approval, or stage completion logic. It only clarifies the existing blocker state.
