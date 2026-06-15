# 2026-06-15-workspace-explorer-no-preview — Remove workspace preview pane + scope skyharbor-air for P0 flags

## Release ID

`2026-06-15-workspace-explorer-no-preview`

## Status

`candidate`

## Plain-English Summary

Two fixes to the Source Workspace Explorer and the Strategy-at-P0 approval flow. First, the right-hand "Preview" column in the workspace has been removed — it was displaying internal database codes (e.g. "EVID SRC STR INCUMBENT") and "No file preview yet" which added noise without value. The workspace now has a clean two-column layout: lifecycle steps on the left, documents on the right. Second, the feature flags that enable the P0 approve→Scope shortcut were missing `skyharbor-air` as an allowed tenant (only `skyharbor` was listed), so SkyHarbor Air users saw the old gate-clearing flow instead of the one-click approve that advances the event directly to Scope.

## Changes Included

- `src/components/workspace-explorer/WorkspaceExplorer.tsx` — removed `<aside>` preview column; 3-column grid → 2-column; removed `activeId`/`activeItem` state; removed unused style constants (`PREVIEW_STYLE`, `PREVIEW_TITLE_STYLE`, `DETAIL_GRID_STYLE`, `LINEAGE_STYLE`, `ACTION_LINK_STYLE`, `DISABLED_ACTION_STYLE`, `KIND_LABELS`).
- ACA env vars (already applied to `p0fix` revision): `ABARVA_FEATURE_SOURCE_STRATEGY_AT_P0_TENANTS=skyharbor,skyharbor-air` and `ABARVA_FEATURE_SOURCE_STRATEGY_AUTO_DRAFT_TENANTS=skyharbor,skyharbor-air`.
- `docs/releases/records/2026-06-15-workspace-explorer-no-preview.md` — this record.

## Release Lane

`global-control-lane` for the preview pane removal (workspace UI); `client-data-lane` for the feature-flag scope correction (SkyHarbor Air).

## Layer Impact

- **UI layer (global-control-lane)**: Workspace Explorer drops the third (preview) column; layout changes to 2-column (nav + docs). Removes internal DB codes from user view.
- **Feature flag layer (client-data-lane)**: `ABARVA_FEATURE_SOURCE_STRATEGY_AT_P0_TENANTS` and `ABARVA_FEATURE_SOURCE_STRATEGY_AUTO_DRAFT_TENANTS` now include `skyharbor-air`. Enables the approve→Scope flow for SkyHarbor Air users.

## What Changed

1. **Preview pane removed** — the `<aside>` column in `WorkspaceExplorer.tsx` showed internal DB codes (e.g. `EVID SRC STR INCUMBENT`) with "No file preview yet". No useful content was available there. Replaced 3-column grid with 2-column (nav + docs).
2. **Feature flag scope corrected** — `source_strategy_at_p0` and `source_strategy_auto_draft` flags were missing `skyharbor-air` as an allowed tenant. SkyHarbor Air users saw the old gate-clearing flow instead of the P0 approve→Scope path.

## Client Applicability

Specific clients: SkyHarbor Air (`skyharbor-air`) for the flag change. All Source workspace users for the preview pane removal.

## QA / Validation

- 200/200 behavior tests pass (`WorkspaceExplorer` suite + full test:behaviors run)
- TypeScript clean
- Flag corrected in ACA lab env vars (revision `p0fix`) — verified Healthy/Running

## Rollout Plan

Deploy as PR to main → CI gate → ACA lab revision. Feature flags already updated in ACA via `p0fix` revision.

## Rollback Plan

Revert the PR. Restore `ABARVA_FEATURE_SOURCE_STRATEGY_AT_P0_TENANTS=skyharbor` (remove `skyharbor-air`) via ACA env var update.

## Audit Evidence

- Test run: 200/200 pass, `WorkspaceExplorer.test.tsx` all 4 tests green
- `p0fix` ACA revision: Healthy, Running, 100% traffic on `app.abarva.ai`
- Flag env vars confirmed via `az containerapp revision show`

## Known Gaps

- Existing events in Strategy stage (created before flag fix) require the user to navigate to the event canvas and click Approve to trigger the stage advance.
