# 2026-08-31-tower-ava-page-aware-catalog — Tower aVa Page-Aware Catalog Answers

## Release ID

`2026-08-31-tower-ava-page-aware-catalog`

## Status

`candidate`

## Plain-English Summary

Tower Ask aVa now receives the active Tower tab, subview, selected row, and nearby visible rows before it answers. The deterministic Tower answerer can return governed tables for top investments, tool rollouts, initiative distribution, constraints, foundations, and selected-row drill-downs from the current Tower read model.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 PRODUCTS: Updates the Tower product surface and Tower chat API payload so aVa can answer from the page the user is actually viewing.

Layers 1-3: No client intake, source adapter, canonical model, schema, or data-load behavior changes.

## Client Applicability

- All clients: Clients with Tower Command Center data loaded receive the improved Tower aVa behavior after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- Tower Command Center reports active tab, subview, selected entity, and visible row context to the aVa shell.
- Tower chat and ask routes pass page context through to the current-layer deterministic answerer.
- Current-layer Tower answers add catalog-style tables for investments, tools, distributions, constraints, foundations, and selected detail.
- Missing numeric fields remain explicit gaps such as `Not loaded`; the answerer does not substitute another metric or render missing measures as zero.
- Recharts-compatible visual contracts are attached to table answers for renderer-side visualization.

## QA / Validation

- `npx jest --runTestsByPath src/lib/tower/__tests__/current-layer-answer.test.ts src/components/tower/command-center/__tests__/TowerCommandCenterAvaShell.test.tsx src/app/api/tower/chat/route.test.ts --runInBand` — passed.
- `npx eslint src/lib/tower/current-layer-answer.ts src/lib/tower/current-layer-answer-contract.ts src/components/tower/command-center/TowerCommandCenter.tsx src/components/tower/command-center/TowerCommandCenterAvaShell.tsx src/app/api/tower/chat/route.ts src/app/api/tower/ask/route.ts src/lib/tower/__tests__/current-layer-answer.test.ts src/components/tower/command-center/__tests__/TowerCommandCenterAvaShell.test.tsx src/app/api/tower/chat/route.test.ts` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — passed.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — passed.

## Rollout Plan

Merge through the protected repository PR flow. The shared web runtime becomes active only through the repo-owned Azure Container Apps main deploy workflow for the merge commit.

## Deployment Authority

- Repo-owned deploy workflow: Required for the web runtime.
- Shared runtime mutators: None in this release.
- Approved image digest: To be produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required before claiming the change is live.
- Worker image invariant: No worker job image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower page context and aVa table/chart behavior must be verified after deployment.

## Rollback Plan

Revert the PR and allow the repo-owned deploy workflow to publish the prior Tower chat behavior. No data rollback or migration rollback is required.

## Audit Evidence

- PR URL.
- Focused Jest output.
- Focused ESLint output.
- TypeScript output.
- Release check output.
- Post-deploy ACA runtime invariant.
- Post-deploy signed-in Tower aVa proof.

## Known Gaps

This release does not give aVa arbitrary access to raw intake workbooks or source-adapter rows. Tower aVa remains scoped to the governed current Tower read model plus the user-visible page context.
