# 2026-06-23-consistent-ava-mark-modules — Consistent aVa Ask Mark Across Modules

## Release ID

`2026-06-23-consistent-ava-mark-modules`

## Status

`candidate`

## Plain-English Summary

The ask composer now uses the same `aVa` visual mark across the main module ask surfaces instead of each surface carrying its own old prompt chrome. This keeps Home, Intelligence, Tower, Source, Moves, and shared agent drawers visually aligned around one canonical Ava ask identity.

## Layer Impact

- `global-control-lane`: shared client UI components and module ask composers are updated for all tenants.
- No backend, schema, ingestion, retrieval, or tenant data behavior changes.

## Client Applicability

- All clients: yes, wherever the affected module composer is rendered.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/agent-answer/AvaAskMark.tsx`
- `src/components/tower/AiControlTowerPage.tsx`
- `src/components/intelligence-v4/ContextCorpusExplorerPage.tsx`
- `src/components/intelligence-v4/SentinelExplorerRail.tsx`
- `src/components/source/PersistentNexusPanel.tsx`
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`
- `src/components/strategic-moves/NexusCurrentStateBriefingPanel.tsx`
- `src/components/strategic-moves/StrategicMoves.module.css`
- `src/components/agent/AgentDock.tsx`
- `src/components/shell/AtlasDrawer.tsx`

## QA / Validation

- PASS: targeted ESLint on changed source files.
- PENDING: release checklist after this record update.
- NOT RUN: signed-in browser proof on Home, Intelligence, Tower, Source, and Moves confirming the visible ask composer shows the `aVa` mark. This requires the PR to merge and deploy to ACA first.

## Rollout Plan

Merge to main, build the Azure Container Apps image through the repo-owned main deploy workflow, shift traffic to the new ACA revision after health checks pass, then verify signed-in browser surfaces.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repo-owned main deploy workflow only.
- Approved image digest: resolved by the ACA deploy workflow after merge.
- ACA runtime invariant: required post-deploy.
- Worker image invariant: no worker code changes; invariant should remain aligned.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, one proof pass across the main module ask surfaces.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA deploy evidence: pending after merge.
- Browser proof: pending after deploy.

## Known Gaps

Admin/setup/public demo ask fields and disabled/read-only source placeholder fields are out of scope for this module-consistency pass.
