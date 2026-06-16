# 2026-06-16-ai-control-tower-cxo-surface - AI Control Tower CXO Surface

## Release ID

`2026-06-16-ai-control-tower-cxo-surface`

## Status

`candidate`

## Plain-English Summary

The top-level Tower route now opens the simplified AI Control Tower executive surface instead of the older IT Portfolio view. The new view focuses on the CIO/CFO questions for AI value, adoption, productivity, agents, spend, risk, evidence, and system-derived actions. Legacy Tower subviews have been hard-retired, leaving `/tower` as the single Tower entry point. This slice also tightens the AI Control Tower visual system for high-density executive and tabular views, corrects the lens interaction so tabs sit below the KPI dashboard and refresh the active canvas, removes the oversized intermediate portfolio/focus block, and keeps Atlas quiet unless the user actually asks a question.

## Layer Impact

- `global-control-lane`: Changes shared Tower navigation and the default Tower user experience for all clients.
- `client-data-lane`: Reads existing tenant-scoped AI initiative, vendor, KPI, and pressure data but does not add new schema or migrations.

## Client Applicability

- All clients: The `/tower` route resolves to the new AI Control Tower surface.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `src/components/tower/AiControlTowerPage.tsx`.
- Updated `src/app/(maestro)/tower/page.tsx` to render the AI Control Tower surface by default.
- Retired legacy Tower subroutes and removed the temporary legacy fallback.
- Refined the AI Control Tower view with compact, table-friendly typography, rectangular lens tabs, tighter metric cards, thinner row rhythm, and quieter dashboard spacing.
- Moved the AI Control Tower lens tabs directly below the KPI dashboard strip.
- Added lens-specific canvases so Value, Productivity, Agents, Spend, Risk, Evidence, and Actions render distinct table/callout views on click.
- Removed the oversized Executive portfolio / Focus list block that pushed the active analysis down the page.
- Stopped tab selection and suggested-question routing from appending synthetic Atlas messages, eliminating repeated citation-gap banners caused by non-retrieval UI hints.
- Reduced the hero, metric cards, pills, and table/callout typography so the page behaves like an analysis control surface rather than a long report page.
- Narrowed the default Atlas panel allocation to give the dashboard and active table more horizontal room.
- Updated the legacy portfolio degradation test to assert retirement redirect behavior.
- Added a focused React regression test for tab placement, tab-driven canvas refresh, and zero synthetic Atlas thread messages on tab clicks.

## QA / Validation

- `git diff --check` passed locally.
- Focused ESLint for the changed AI Control Tower file passed locally.
- TypeScript compile passed locally.
- Focused AI Control Tower interaction test passed locally.
- `npm run build` passed locally; the production route manifest contains `/tower` as the Tower app route and does not ship the retired Tower subviews.
- Local browser smoke verified `/tower` routes through the Clerk sign-in boundary when unauthenticated; signed-in visual inspection was not completed in the local keyless Clerk session.

## Rollout Plan

Merge to `main`; the normal ACA main deploy builds and promotes the new web image. No database migration or manual data load is required for this UI slice.

## Rollback Plan

Revert the PR while a replacement fix is prepared. No data rollback is required.

## Audit Evidence

- PR URL and CI run will be attached after PR creation.
- Local validation output and browser smoke screenshot should be attached to the PR if available.

## Known Gaps

The page is dashboard-bound to existing Tower AI initiative read models. The monthly AI Control Tower template parser and full Azure persistence flow were introduced in the prior substrate slice and still need the next ingestion UI/API binding slice.
