# 2026-09-08-source-contract360-ask-selected-context - Source Contract 360 Ask Selected Context

## Release ID

`2026-09-08-source-contract360-ask-selected-context`

## Status

`candidate`

## Plain-English Summary

Source Contract 360 aVa requests now carry the selected contract context into the Intelligence ask synthesis path. Selected-contract facts, dataset coverage, cube coverage, evidence posture, and next action guidance are promoted into the model prompt for Claude-authored answers instead of relying on the generic ask context alone.

## Layer Impact

Layer 4 - Products, `global-control-lane`: updates Source and Intelligence answer orchestration only. No tenant data, loader, adapter, canonical model, schema, or deployment runtime mutation is included.

## Client Applicability

- All clients: Source Contract 360 and Source Workspace aVa users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/index.ts`
- `src/lib/intelligence/ask/types.ts`
- `src/app/api/intelligence/ask/route.ts`
- `src/lib/intelligence/ask/__tests__/source-contract360-synthesis-context.test.ts`
- `src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts`

## QA / Validation

Pass before merge:

- `npm test -- src/lib/intelligence/ask/__tests__/source-contract360-synthesis-context.test.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts src/lib/source/ava/__tests__/portfolio-fallback-answer.test.ts --runInBand`
- `npx eslint src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/types.ts src/app/api/intelligence/ask/route.ts src/lib/intelligence/ask/__tests__/source-contract360-synthesis-context.test.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts`
- `npm run release:check`
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`

## Rollout Plan

Merge through PR and deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow
- Approved image digest: assigned by the deploy workflow
- ACA runtime invariant: required after deploy
- Worker image invariant: required after deploy
- Feature/env flag update path: none
- Live signed-in proof required: Source Contract 360 aVa answer on the deployed app shows the selected contract, candidate opportunity basis, evidence posture, and next action without claiming that no contract is selected.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow. There are no schema, data, or migration rollback steps.

## Audit Evidence

Add PR URL, CI run, ACA deploy run, runtime invariant artifact, and signed-in Source Contract 360 aVa proof after merge/deploy.

## Known Gaps

This release does not change Source data coverage, contract graph visuals, action-candidate calculations, cube materialization, or evidence ingestion.
