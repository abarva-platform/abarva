# 2026-09-08-source-contract360-deterministic-ava-answer - Source Contract 360 Deterministic Ava Answer

## Release ID

`2026-09-08-source-contract360-deterministic-ava-answer`

## Status

`candidate`

## Plain-English Summary

Source Contract 360 value and evidence questions now route through the governed Source answer packet when the visible page has a selected contract header. This prevents the chat from falling through to a generic portfolio-level synthesis that can incorrectly say no contract is selected.

## Layer Impact

Layer 4 - Products, `global-control-lane`: updates Source aVa answer routing and tests only. No tenant data, loader, adapter, canonical model, schema, or runtime configuration changes are included.

## Client Applicability

- All clients: Source Workspace and Contract 360 aVa users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/ava/source-workspace-visual-answer.ts`
- `src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts`
- `src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts`
- `docs/releases/records/2026-09-08-source-contract360-deterministic-ava-answer.md`

## QA / Validation

Pass before merge:

- `npm test -- src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts src/lib/source/ava/__tests__/portfolio-fallback-answer.test.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts --runInBand`
- `npx eslint src/lib/source/ava/source-workspace-visual-answer.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts`
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
- Live signed-in proof required: Source Workspace aVa on a Contract 360 URL answers from selected contract context and does not claim that no contract is selected.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow. There are no schema, data, or migration rollback steps.

## Audit Evidence

Add PR URL, CI run, ACA deploy run, runtime invariant artifact, and signed-in Source Workspace aVa proof after merge/deploy.

## Known Gaps

This release does not change Source data coverage, action-candidate calculations, contract graph visuals, cube materialization, evidence ingestion, or signed-in tenant permissions.
