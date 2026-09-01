# 2026-09-01-source-workspace-payload-safety — Source workspace payload safety

## Release ID

`2026-09-01-source-workspace-payload-safety`

## Status

`candidate`

## Plain-English Summary

The Source workspace now keeps its semantic catalog metadata tenant-neutral and resolves executive-readable vendor display fields before impact rows reach the workspace payload. Technical reference fields remain available for lineage, but display names, claim statements, and aVa-facing allowed claims no longer use opaque vendor references when a readable vendor name is already available in the same portfolio read.

## Layer Impact

Layer 4 / Products (`global-control-lane`): updates the Source workspace portfolio adapter and the semantic catalog payload used by the Source 360 workspace.

Layer 3 / Canonical Model: no schema, row, or canonical-data mutation.

## Client Applicability

- All clients: yes, for Source workspace payload rendering.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: follows the existing Source workspace provider selection.

## Changes Included

- Source workspace portfolio adapter display-name reconciliation for impact rows.
- Source semantic catalog payload metadata now supports source-specific dataset IDs instead of a tenant-specific default.
- Focused tests for display-name reconciliation and semantic catalog payload metadata.

## QA / Validation

- Pass: `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts'`
- Pass: `npx eslint 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' src/lib/source/data-model/source-v4-cube-ui-catalog.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`

## Rollout Plan

Merge through the protected PR path. The repo-owned Azure Container Apps main deploy workflow builds and rolls out the runtime image after merge.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: resolved by the repo-owned deploy workflow.
- ACA runtime invariant: verified by the repo-owned deploy workflow.
- Worker image invariant: verified by the repo-owned deploy workflow where applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source workspace payload and page checks after deployment.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow.

## Audit Evidence

- PR URL: to be added when opened.
- CI checks: to be added after PR validation.
- Deployment evidence: to be added after the repo-owned deploy workflow completes.
- Live proof: to be added after signed-in route verification.

## Known Gaps

This does not split the heavy Source workspace payload by tab. That remains a separate performance follow-up if cache behavior is not sufficient.
