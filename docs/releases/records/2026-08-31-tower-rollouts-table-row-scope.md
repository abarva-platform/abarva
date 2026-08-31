# 2026-08-31-tower-rollouts-table-row-scope — Tower Rollouts Table Row Scope

## Release ID

`2026-08-31-tower-rollouts-table-row-scope`

## Status

`candidate`

## Plain-English Summary

The Tower Command Center Rollouts table now renders only rows sourced from the tool-rollout intake. Business cases that mention tool usage continue to belong in the full AI portfolio, but they no longer appear as rollout records with missing users, targets, blockers, and linked-case counts.

## Layer Impact

Layer 4 PRODUCTS, `global-control-lane`: Tower-only rendering selector change. No data model, loader, serving view, tenant data, or retrieval behavior changes.

## Client Applicability

- All clients: Yes, for the Tower Command Center Rollouts table.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/command-center/views/ToolsTablePanel.tsx`
- `src/components/tower/command-center/__tests__/mechanical-panels.test.tsx`

## QA / Validation

- `NODE_OPTIONS=--max-old-space-size=8192 npx jest src/components/tower/command-center/__tests__/mechanical-panels.test.tsx --runInBand` passed.
- `npx eslint src/components/tower/command-center/views/ToolsTablePanel.tsx src/components/tower/command-center/__tests__/mechanical-panels.test.tsx` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit --pretty false` passed.
- `node scripts/release-check.mjs --base origin/main --head HEAD` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx jest src/components/tower src/lib/tower --runInBand --silent` matched the pre-existing Tower baseline: 6 failed suites, 21 failed tests.

## Rollout Plan

Merge through the protected PR path. The standard repo-owned Azure Container Apps main deploy workflow will build and deploy the next main image.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime rollout after merge.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Must be verified by the deploy workflow and any live-proof run.
- Worker image invariant: Not affected.
- Feature/env flag update path: Not affected.
- Live signed-in proof required: Required before claiming the changed Tower surface is live-proven.

## Rollback Plan

Revert the PR and allow the standard main deploy workflow to publish the prior component selector. No migration rollback is required.

## Audit Evidence

- Focused mechanical panel regression test.
- Focused ESLint run.
- Full TypeScript check.
- Release-control check.
- Tower-scope Jest baseline comparison.
- Post-deploy signed-in proof required after merge.

## Known Gaps

No data-plane reload is included in this candidate. This release only narrows the product render selector for the Rollouts table.
