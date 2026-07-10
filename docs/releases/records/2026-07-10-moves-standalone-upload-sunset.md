# 2026-07-10-moves-standalone-upload-sunset — Moves Standalone Upload and Old Workbench Sunset

## Release ID

`2026-07-10-moves-standalone-upload-sunset`

## Status

`candidate`

## Plain-English Summary

Moves phase pages no longer send users back to retired detail tabs for upload, download, or document actions. The standalone phase workspace now owns evidence upload directly inside Files & Evidence and the P3 decision upload area. The retired phase workbench implementation and its private support components were removed so the product cannot silently flip back to the old page.

## Layer Impact

- `global-control-lane`: Updates the shared Moves phase workspace experience for all tenants.
- `public-demo`: Improves the demo-critical SkyHarbor/Lakeshore/Meridian Moves path by keeping users inside the new Source-like workspace.

## Client Applicability

- All clients: yes, all Moves phase pages use the standalone workspace route.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- `src/app/(maestro)/strategic-moves/[moveId]/evidence/page.tsx`
- `src/components/strategic-moves/PhaseDocumentsPanel.tsx`
- `src/lib/agent/product-truth/__tests__/suggested-question-audit.test.ts`
- `src/lib/agent/product-truth/suggested-question-audit.ts`
- `src/lib/agent/__tests__/surface.test.ts`
- `src/lib/programs/__tests__/phase-capture-workspace-alignment.test.ts`
- Removed retired old workbench files: `StrategicMovePhaseClient`, `EvidenceWorkbench`, `MovePhaseExplorer`, and old-only tests.

## QA / Validation

- `rg -n "StrategicMovePhaseClient|EvidenceWorkbench|MovePhaseExplorer|tab=cabinet|tab=downloads|tab=documents" src/app src/components src/lib` — Pass, no active references.
- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx 'src/app/(maestro)/strategic-moves/[moveId]/evidence/page.tsx' src/components/strategic-moves/PhaseDocumentsPanel.tsx src/lib/agent/product-truth/__tests__/suggested-question-audit.test.ts src/lib/agent/product-truth/suggested-question-audit.ts src/lib/agent/__tests__/surface.test.ts src/lib/programs/__tests__/phase-capture-workspace-alignment.test.ts` — Pass.
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/lib/agent/product-truth/__tests__/suggested-question-audit.test.ts src/lib/programs/__tests__/phase-capture-workspace-alignment.test.ts --runInBand` — Pass, 17/17 tests. Existing duplicate manual mock warnings are unchanged.

## Rollout Plan

Merge to `main`, build and deploy through the repo-owned Azure Container Apps main deploy workflow, then run a live signed-in Moves end-to-end smoke against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the approved workflow.
- Approved image digest: to be recorded after ACA deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: no worker image change expected, but runtime invariant should still be checked by the deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. No schema or data migration rollback is required.

## Audit Evidence

- PR URL: to be added when opened.
- CI run: to be added after PR checks.
- ACA revision and image digest: to be added after deploy.
- Live smoke proof bundle: to be added after deploy.

## Known Gaps

The wider-canvas/left-rail compression polish is tracked separately as `SHELL10 — Moves Workspace Canvas Utilization Polish`; this release focuses on functional end-to-end smoke blockers and old workbench retirement.
