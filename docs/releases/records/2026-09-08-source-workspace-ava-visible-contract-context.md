# 2026-09-08-source-workspace-ava-visible-contract-context - Source Workspace Ava Visible Contract Context

## Release ID

`2026-09-08-source-workspace-ava-visible-contract-context`

## Status

`candidate`

## Plain-English Summary

Source Workspace now sends explicit Contract 360 mode and selected/requested contract fields in the aVa surface context. This keeps the chat prompt aligned with the visible Source workspace state and gives aVa a governed way to answer, or to say that the requested contract is absent, without falling back to generic "no contract selected" language.

## Layer Impact

Layer 4 - Products, `global-control-lane`: updates Source Workspace presentation-to-chat context only. No tenant data, loader, adapter, canonical model, schema, or deployment runtime mutation is included.

## Client Applicability

- All clients: Source Workspace and Contract 360 aVa users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts`
- `docs/releases/records/2026-09-08-source-workspace-ava-visible-contract-context.md`

## QA / Validation

Pass before merge:

- `npm test -- src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts src/lib/source/ava/__tests__/portfolio-fallback-answer.test.ts src/lib/intelligence/ask/__tests__/source-contract360-synthesis-context.test.ts --runInBand`
- `npx eslint 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts'`
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
- Live signed-in proof required: Source Workspace aVa on a Contract 360 URL answers from selected/requested contract context and does not claim that no contract is selected.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow. There are no schema, data, or migration rollback steps.

## Audit Evidence

Add PR URL, CI run, ACA deploy run, runtime invariant artifact, and signed-in Source Workspace aVa proof after merge/deploy.

## Known Gaps

This release does not change Source data coverage, action-candidate calculations, contract graph visuals, cube materialization, evidence ingestion, or signed-in tenant permissions.
