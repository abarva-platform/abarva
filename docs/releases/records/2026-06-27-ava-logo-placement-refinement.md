# 2026-06-27-ava-logo-placement-refinement — aVa Logo Placement Refinement

## Release ID

`2026-06-27-ava-logo-placement-refinement`

## Status

`candidate`

## Plain-English Summary

Refines the shared aVa visual placement rule. Header and collapsed identity placements use the darker circular aVa avatar, while composer/input placements keep the aVa wordmark at a smaller, subtler size. The Moves origination header no longer repeats a standalone `Ava` label next to the logo.

## Layer Impact

- `global-control-lane`: Updates shared UI components and Strategic Moves presentation only. No data-plane, model, routing, auth, or tenant binding behavior changes.

## Client Applicability

- All clients: Yes, for shared aVa component placement where these surfaces render.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/agent-answer/AvaAskMark.tsx`
- `src/components/agent/AgentDock.tsx`
- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx`
- `src/components/strategic-moves/StrategicMoves.module.css`
- `src/components/ava-chat/AvaChatShell.tsx`
- `src/components/intelligence-v4/SentinelExplorerRail.tsx`
- `src/components/source/PersistentNexusPanel.tsx`
- `src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`

## QA / Validation

- Passed: Focused Jest for aVa mark and Moves originate rendering.
- Passed: Focused ESLint for touched TS/TSX files. The CSS module was intentionally excluded from ESLint because the current flat config does not lint CSS modules.
- Passed: `npm run release:check`.
- Passed: Local visual/screenshot proof of the updated logo placement rule.

## Rollout Plan

Merge to main, build the exact main SHA, and deploy through the Azure Container Apps `ACA main deploy` workflow.

## Deployment Authority

- Repo-owned deploy workflow: `ACA main deploy`
- Shared runtime mutators: None.
- Approved image digest: Captured by deploy workflow after merge.
- ACA runtime invariant: Verified by deploy workflow.
- Worker image invariant: No worker behavior impact; deploy workflow keeps image invariant.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for Home/Intelligence/Tower/Source/Moves logo placement.

## Rollback Plan

Revert the UI commit or roll ACA traffic back to the previous healthy revision. No migration rollback is required.

## Audit Evidence

- PR and CI checks after branch publication.
- ACA deploy run after merge.
- Signed-in screenshot proof after deploy.

## Known Gaps

No functional gaps are known. This release only changes logo placement, size, and variant selection; it does not redesign the full aVa rail layout, tenant label strategy, or broader conversation rendering. Those remain separate product-design decisions.
