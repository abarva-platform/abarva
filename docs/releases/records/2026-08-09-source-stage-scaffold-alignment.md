# 2026-08-09-source-stage-scaffold-alignment - Source Stage Scaffold Alignment

## Release ID

`2026-08-09-source-stage-scaffold-alignment`

## Status

`candidate`

## Plain-English Summary

Source event stages now render stage-matched step content for Pricing, Executive Decision, and Transition instead of falling back to the Scope checklist. The Source rail also keeps completed past stages internally consistent when a user views a completed stage after the event has advanced.

## Layer Impact

- Release lane: `global-control-lane`
- Layer 4 Products: Updates Source event workspace presentation and stage progress rendering only. No intake, adapter, canonical model, loader, or dataset mutation changes.

## Client Applicability

- All clients: Yes, for Source event workspaces using the stage canvas.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/analytics/sample-view-model.ts`
- `src/lib/source/facts/view/stage-analytics-builder.ts`
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/lib/source/source-event-shell-v2.ts`
- Focused regression tests for stage scaffold selection, fallback rendering, and rail progress reconciliation.

## QA / Validation

- `npx jest src/lib/source/facts/view/__tests__/stage-analytics-builder.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageFallbacks.test.tsx src/lib/source/__tests__/source-event-shell-v2.test.ts --runInBand` passed.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageFallbacks.test.tsx src/components/source/canvas/analytics/sample-view-model.ts src/lib/source/facts/view/stage-analytics-builder.ts src/lib/source/facts/view/__tests__/stage-analytics-builder.test.ts src/lib/source/source-event-shell-v2.ts src/lib/source/__tests__/source-event-shell-v2.test.ts` passed.

## Rollout Plan

Merge through PR to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Must be verified after deploy.
- Worker image invariant: No worker logic changes expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Verify Pricing, Executive Decision, and Transition render stage-specific step content and do not show Scope checklist items.

## Rollback Plan

Revert the presentation changes and redeploy the previous approved ACA image through the same repo-owned deployment path.

## Audit Evidence

- Focused Jest regression output for scaffold selection and rail progress.
- ESLint output for the touched Source canvas and shell files.
- PR, CI, ACA deployment run, runtime invariant proof, and live signed-in Source event proof after merge/deploy.

## Known Gaps

This release does not alter stage auto-advance policy or create new fact-template parsers for Pricing or Executive Decision evidence.
