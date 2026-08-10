# 2026-08-10-source-event-artifact-readiness - Source Event Artifact Readiness

## Release ID

`2026-08-10-source-event-artifact-readiness`

## Status

`candidate`

## Plain-English Summary

Source event stages now separate completed checklist inputs from required artifact readiness. When a stage has all input tasks complete but required or gate-defining artifacts are still missing, AI draft only, evidence-only, content-blocked, or pending consulting-grade review, the stage handoff shows an explicit approval-gaps state instead of a clean approval signal.

## Layer Impact

- Lane: `global-control-lane` because this changes shared Source workflow behavior for every tenant using the common event shell.
- Products: Source event workflow UI and read model copy now expose artifact/client-final gaps in the stage handoff and approval item status.
- Canonical model: No schema or data mutation. The change consumes the existing Source artifact lifecycle matrix and event shell model.

## Client Applicability

- All clients: yes, for Source event workflow stages that use the shared Source shell.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/source-event-shell-v2.ts`
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/lib/source/__tests__/source-event-shell-v2.test.ts`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/home/HomeOverviewV2.tsx`

## QA / Validation

- `npm test -- src/lib/source/__tests__/source-event-shell-v2.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx --runInBand` passed: 3 suites, 33 tests.
- `npx eslint src/app/layout.tsx src/components/home/HomeOverviewV2.tsx src/lib/source/source-event-shell-v2.ts src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/lib/source/__tests__/source-event-shell-v2.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx` passed.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false` passed.
- `npm run build` passed after removing build-time Google font fetches.
- Jest emitted pre-existing duplicate manual mock warnings for markdown/GFM mocks; the targeted suites still passed.

## Rollout Plan

Merge through the protected repository PR path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the merged image to the shared web runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: produced by the repo-owned deploy workflow after merge
- ACA runtime invariant: required after deploy
- Worker image invariant: not affected
- Feature/env flag update path: none
- Live signed-in proof required: yes, Source event stage with completed inputs and non-final required artifacts must show approval gaps

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow redeploy the prior behavior. No migration rollback is required.

## Audit Evidence

- PR, merge commit, workflow run, ACA runtime invariant, and signed-in Source event screenshot/DOM proof will be attached after deployment.
- Local focused test and lint output are recorded in the task transcript.

## Known Gaps

- This release does not make missing or AI-draft artifacts client-final.
- This release does not implement rich vendor proposal dossier persistence, aVa hard-question improvements, or full 11-stage artifact-quality acceptance.
