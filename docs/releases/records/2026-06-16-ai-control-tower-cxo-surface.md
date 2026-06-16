# 2026-06-16-ai-control-tower-cxo-surface - AI Control Tower CXO Surface

## Release ID

`2026-06-16-ai-control-tower-cxo-surface`

## Status

`candidate`

## Plain-English Summary

The top-level Tower route now opens the simplified AI Control Tower executive surface instead of the older IT Portfolio view. The new view focuses on the CIO/CFO questions for AI value, adoption, productivity, agents, spend, risk, evidence, and system-derived actions. Legacy Tower subviews are retired at the route layer and redirect back to `/tower`.

## Layer Impact

- `global-control-lane`: Changes shared Tower navigation and the default Tower user experience for all clients.
- `client-data-lane`: Reads existing tenant-scoped AI initiative, vendor, KPI, and pressure data but does not add new schema or migrations.

## Client Applicability

- All clients: The `/tower` route resolves to the new AI Control Tower surface.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: `TOWER_LEGACY_VIEW_ENABLED=1` can temporarily expose the legacy server-rendered Tower index for emergency comparison, but it is off by default.

## Changes Included

- Added `src/components/tower/AiControlTowerPage.tsx`.
- Updated `src/app/(maestro)/tower/page.tsx` to render the AI Control Tower surface by default.
- Retired legacy Tower subroutes by redirecting them to `/tower`.
- Updated the legacy portfolio degradation test to assert retirement redirect behavior.

## QA / Validation

- `git diff --check` passed locally.
- Focused ESLint for the changed Tower files is expected to pass before merge.
- TypeScript compile is expected to pass before merge.
- Browser smoke will verify `/tower` renders the new executive surface and a retired route redirects to `/tower`.

## Rollout Plan

Merge to `main`; the normal ACA main deploy builds and promotes the new web image. No database migration or manual data load is required for this UI slice.

## Rollback Plan

Revert the PR or temporarily set `TOWER_LEGACY_VIEW_ENABLED=1` while a revert is prepared. No data rollback is required.

## Audit Evidence

- PR URL and CI run will be attached after PR creation.
- Local validation output and browser smoke screenshot should be attached to the PR if available.

## Known Gaps

The page is dashboard-bound to existing Tower AI initiative read models. The monthly AI Control Tower template parser and full Azure persistence flow were introduced in the prior substrate slice and still need the next ingestion UI/API binding slice.
