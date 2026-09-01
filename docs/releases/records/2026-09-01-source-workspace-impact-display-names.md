# 2026-09-01-source-workspace-impact-display-names — Source workspace impact display names

## Release ID

`2026-09-01-source-workspace-impact-display-names`

## Status

`candidate`

## Plain-English Summary

The Source workspace now resolves display names for impact rows even when an impact view uses a different technical vendor reference than the contract register. Technical references remain available for lineage, but executive-facing statements, vendor-position rows, and aVa grounding payloads use the readable vendor name when the linked contract already supplies one.

## Layer Impact

Layer 4 / Products (`global-control-lane`): updates the Source workspace portfolio adapter before payloads reach the Source 360 workspace.

Layer 3 / Canonical Model: no schema, row, or canonical-data mutation.

## Client Applicability

- All clients: yes, for Source workspace impact payload rendering.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: follows the existing Source workspace provider selection.

## Changes Included

- Source workspace impact display-name reconciliation now seeds opaque impact references from linked contract display names.
- Focused regression coverage for contract-scoped impact rows whose technical vendor reference differs from the contract register vendor reference.

## QA / Validation

- Pass: `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts'`
- Pass: `npx eslint 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts'`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `npm run release:check -- --changed-only`
- Pass: `git diff --check`

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

This does not split the heavy Source workspace payload by tab. That remains a separate performance follow-up if cold-load behavior is not sufficient.
