# 2026-09-23-moves-terminal-handoff-status — Moves Terminal Handoff Status

## Release ID

`2026-09-23-moves-terminal-handoff-status`

## Status

`candidate`

## Plain-English Summary

This change makes the terminal Moves phase page reconcile its status labels after final handoff. When a Move has completed the last phase and has been handed off, the phase strip and step detail now show handoff-complete language and route the reviewer toward Tower instead of showing stale build or open-step labels.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Moves UI status rendering only. No canonical data, client intake files, adapters, registry state, migrations, or data-plane state change.

## Client Applicability

- All clients: Applies to Moves phase status rendering for completed terminal handoffs.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`

## QA / Validation

- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — passed.
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — passed, 78/78 tests.
- `npm run typecheck` — passed.

## Rollout Plan

Merge to main through a pull request. The repo-owned Azure Container Apps deploy workflow may rebuild and deploy the web image after merge. No manual migration, data load, registry activation, or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, terminal Moves phase page proof after deploy.

## Rollback Plan

Revert the pull request and allow the repo-owned deploy workflow to redeploy the previous behavior. No data rollback is required.

## Audit Evidence

- Smoke report: `reports/moves-e2e-operating-smoke/20260923T222629Z/`
- Focused test outputs under `reports/moves-e2e-operating-smoke/20260923T222629Z/raw/`

## Known Gaps

This change fixes terminal handoff status labels only. The broader Moves P0-P5 operating smoke test remains in progress.
