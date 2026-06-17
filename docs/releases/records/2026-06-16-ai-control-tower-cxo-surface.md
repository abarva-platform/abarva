# 2026-06-16-ai-control-tower-cxo-surface - AI Control Tower CXO Surface

## Release ID

`2026-06-16-ai-control-tower-cxo-surface`

## Status

`candidate`

## Plain-English Summary

The top-level Tower route now opens the simplified AI Control Tower executive surface instead of the older IT Portfolio view. The new view focuses on the CIO/CFO questions for AI value, adoption, productivity, agents, spend, risk, evidence, and system-derived actions. Legacy Tower subviews have been hard-retired, leaving `/tower` as the single Tower entry point. This slice also tightens the AI Control Tower visual system for high-density executive and tabular views, corrects the lens interaction so tabs sit below the KPI dashboard and refresh the active canvas, removes the oversized intermediate portfolio/focus block, restores the standard product navigation shell around the Tower canvas, and keeps Atlas quiet unless the user actually asks a question.

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
- Wrapped the AI Control Tower route in `AppShell` so the standard Home / Intelligence / Moves / Source / Tower navigation is visible again on `/tower`.
- Retired legacy Tower subroutes and removed the temporary legacy fallback.
- Refined the AI Control Tower view with compact, table-friendly typography, rectangular lens tabs, tighter metric cards, thinner row rhythm, and quieter dashboard spacing.
- Moved the AI Control Tower lens tabs directly below the KPI dashboard strip.
- Added lens-specific canvases so Value, Productivity, Agents, Spend, Risk, Evidence, and Actions render distinct table/callout views on click.
- Changed zero committed spend or evidence rows from misleading green states to explicit missing/red states, including a Spend lens fallback row that tells operators to load or commit Spend Contracts before a CFO demo.
- Removed the oversized Executive portfolio / Focus list block that pushed the active analysis down the page.
- Stopped tab selection and suggested-question routing from appending synthetic Atlas messages, eliminating repeated citation-gap banners caused by non-retrieval UI hints.
- Reduced the hero, metric cards, pills, and table/callout typography so the page behaves like an analysis control surface rather than a long report page.
- Narrowed the default Atlas panel allocation to give the dashboard and active table more horizontal room.
- Updated the legacy portfolio degradation test to assert retirement redirect behavior.
- Added a focused React regression test for tab placement, tab-driven canvas refresh, and zero synthetic Atlas thread messages on tab clicks.

## QA / Validation

- `git diff --check` passed locally.
- Focused ESLint for `src/app/(maestro)/tower/page.tsx`, `src/components/tower/AiControlTowerPage.tsx`, and `src/components/tower/__tests__/AiControlTowerPage.test.tsx` passed locally.
- Focused AI Control Tower interaction test passed locally.
- TypeScript compile was attempted locally and was blocked by missing optional dependency packages in the clean worktree (`@azure-rest/ai-document-intelligence` and `@axe-core/playwright`), not by the Tower change.
- Local browser smoke was attempted, but the unauthenticated local session redirected to Clerk and the local sign-in route was blocked by an existing duplicate `/intelligence` route resolution issue. Signed-in visual inspection was not completed locally.

## Rollout Plan

Merge to `main`; the normal ACA main deploy builds and promotes the new web image. No database migration or manual data load is required for this UI slice.

## Rollback Plan

Revert the PR while a replacement fix is prepared. No data rollback is required.

## Audit Evidence

- PR URL and CI run will be attached after PR creation.
- Local validation output and browser smoke screenshot should be attached to the PR if available.

## Known Gaps

The page is dashboard-bound to existing Tower AI initiative read models. The monthly AI Control Tower template parser and full Azure persistence flow were introduced in the prior substrate slice and still need the next ingestion UI/API binding slice.
