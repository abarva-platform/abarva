# 2026-06-16-source-stage-entry-autodraft — Source Stage Entry Auto-Drafts

## Release ID

`2026-06-16-source-stage-entry-autodraft`

## Status

`candidate`

## Plain-English Summary

Source now starts the right draft automatically when a sourcing event enters a stage. When Strategy starts, Sentinel drafts the strategy memo. When Scope starts, Sentinel drafts the scope memo if the strategy memo exists. When RFP starts, Sentinel starts the RFP package. Existing authored, locked, or superseded documents are skipped so the system does not overwrite human work.

## Layer Impact

- `global-control-lane`: Adds non-blocking Source stage-entry behavior for the shared Source workflow.
- `client-data-lane`: Reads and updates client-scoped Source artifact rows through the existing governed generator and data-plane write seam. No schema change.

## Client Applicability

- All clients: Source events using the persisted stage routes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses existing Source routes; no new feature flag.

## Changes Included

- Exported the existing Source artifact generation core so automatic drafts reuse the same governed manual-generation path.
- Added `src/lib/source/stage-entry-autodraft.ts` for idempotent, best-effort stage-entry drafting.
- Wired stage advancement to fire auto-draft after a successful stage commit.
- Wired Strategy-at-P0 approval to draft Strategy first, then Scope, after the event advances to Scope.
- Added focused behavior and static route tests.

## QA / Validation

- `npx jest src/lib/source/__tests__/stage-entry-autodraft.test.ts src/__tests__/integration/source/source-access-control-static.test.ts --runInBand` passed: 18 tests.
- Filtered TypeScript check for touched Source files passed with no slice-specific errors.

## Rollout Plan

Merge to `main`, let the Azure Container Apps build/deploy pipeline publish the new image, then verify on a persisted SkyHarbor Source event that stage entry creates the relevant draft without clicking Generate.

## Rollback Plan

Revert the PR. Existing manual Generate behavior remains the fallback and no data migration is involved.

## Audit Evidence

- PR and CI checks.
- Post-deploy browser proof on the SkyHarbor Source event workspace.
- Stage-entry artifact rows showing generated `body_generation_metadata`.

## Known Gaps

This is the fast-path draft trigger only. It does not convert Source to the premium section-batched board-grade orchestrator; that remains the separate Source quality bridge slice.
