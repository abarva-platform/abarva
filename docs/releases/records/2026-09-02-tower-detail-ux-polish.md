# 2026-09-02-tower-detail-ux-polish — Tower Detail UX Polish

## Release ID

`2026-09-02-tower-detail-ux-polish`

## Status

`candidate`

## Plain-English Summary

Tower tables now make row-level detail easier to discover and read. AI initiative and tool rollout tables keep double-click behavior, add an explicit Open action, and show concise help affordances for constraints and control blockers. The value-proof surface uses one stable layout instead of a non-essential display toggle, and action-campaign rows render short next-step labels rather than raw system keys.

## Layer Impact

`global-control-lane` affects the Tower product surface. The change is a UI-only consumer of the existing Layer 4 Tower command-center view model.

`client-data-lane` is not changed. No source intake files, adapters, canonical rows, projection jobs, cubes, or tenant data are modified by this release candidate.

## Client Applicability

All clients: applies to every tenant using the Tower command-center surface after the web runtime deploys this code.

Specific clients: not applicable.

Internal only: not applicable.

Public/demo only: not applicable.

Feature flag: none.

## Changes Included

- Added explicit Open actions to AI initiative and tool rollout tables while preserving double-click detail opening.
- Added inline help affordances for gating constraints and control blockers.
- Updated the AI tool drawer to label spend as tool spend, render absent spend as Not loaded, and explain adoption and linked-case fields.
- Removed the value-proof layout toggle and kept the stable grid presentation.
- Rendered action-campaign due keys as short next-step labels.
- Added focused regression coverage for the new affordances and raw-key suppression.

## QA / Validation

Passed: `npx jest src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/components/tower/command-center/__tests__/mechanical-panels.test.tsx --runInBand`.

Passed: `npx eslint src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/components/tower/command-center/__tests__/mechanical-panels.test.tsx src/components/tower/command-center/drawers/AiInitiativeDrawer.tsx src/components/tower/command-center/views/ContractTabs.tsx src/components/tower/command-center/views/InitiativesTablePanel.tsx src/components/tower/command-center/views/ToolsTablePanel.tsx`.

Passed: `git diff --check`.

Passed: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`.

Passed: `node scripts/release-check.mjs --base origin/main --head HEAD`.

## Rollout Plan

Merge through the protected repository PR flow. The code becomes active through the repo-owned Azure Container Apps main deploy workflow. No data-build job is required because this release only changes product rendering.

## Deployment Authority

Repo-owned deploy workflow: required for web/runtime deployment after merge.

Shared runtime mutators: none in this release candidate.

Approved image digest: not applicable until the repo-owned deploy workflow builds an image.

ACA runtime invariant: must be verified by the deploy workflow if a runtime deployment follows.

Worker image invariant: not applicable.

Feature/env flag update path: none.

Live signed-in proof required: required after runtime deployment before claiming the Tower surface is live-proven.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow. No data rollback is required.

## Audit Evidence

- `src/components/tower/command-center/views/InitiativesTablePanel.tsx`
- `src/components/tower/command-center/views/ToolsTablePanel.tsx`
- `src/components/tower/command-center/drawers/AiInitiativeDrawer.tsx`
- `src/components/tower/command-center/views/ContractTabs.tsx`
- `src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx`
- `src/components/tower/command-center/__tests__/mechanical-panels.test.tsx`

## Known Gaps

No Azure Container Apps deployment or signed-in browser proof is included in this release candidate. Those follow merge through the governed deploy path.
