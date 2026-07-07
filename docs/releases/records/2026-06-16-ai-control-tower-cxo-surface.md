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
- Restored the standard AppShell product navigation around the redesigned Tower surface so Home / Intelligence / Moves / Source / Tower remain visible.
- Made zero committed spend rows and zero committed evidence rows render as explicit red/attention states instead of disappearing or showing as green.
- Added deterministic Atlas replies from the active dashboard lens so demo questions do not call the unproven live retrieval path or time out.
- Reduced the hero, metric cards, pills, and table/callout typography so the page behaves like an analysis control surface rather than a long report page.
- Narrowed the default Atlas panel allocation to give the dashboard and active table more horizontal room.
- Updated the legacy portfolio degradation test to assert retirement redirect behavior.
- Added a focused React regression test for tab placement, tab-driven canvas refresh, and zero synthetic Atlas thread messages on tab clicks.

## QA / Validation

- `git diff --check` passed locally.
- Focused ESLint for the changed AI Control Tower file passed locally.
- TypeScript compile was run locally and remains blocked by pre-existing `vendorSpendRows` fixture errors in `src/lib/intelligence-v3/__tests__/sentinel-intel-context.test.ts` and `src/lib/pilot-dashboard/__tests__/aggregates.test.ts`; no new Tower type errors were emitted.
- Focused AI Control Tower interaction test passed locally.
- Focused ESLint passed locally for `src/app/(maestro)/tower/page.tsx`, `src/components/tower/AiControlTowerPage.tsx`, and `src/components/tower/__tests__/AiControlTowerPage.test.tsx`.
- Local browser smoke should verify that `/tower` renders inside the standard product nav shell.

## Rollout Plan

Merge to `main`; the normal ACA main deploy builds and promotes the new web image. No database migration or manual data load is required for this UI slice.


## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — this change merged to main; ACA main deploy
  workflow builds and deploys from `refs/heads/main` only.
- ACA runtime invariant: new revision healthy before 100% traffic.
- Live signed-in client proof required: yes — verified on `app.abarva.ai` post-merge.

## Rollback Plan

Revert the PR while a replacement fix is prepared. No data rollback is required.

## Audit Evidence

- PR URL and CI run will be attached after PR creation.
- Local validation output and browser smoke screenshot should be attached to the PR if available.

## Known Gaps

The page is dashboard-bound to existing Tower AI initiative read models. The monthly AI Control Tower template parser and full Azure persistence flow were introduced in the prior substrate slice and still need the next ingestion UI/API binding slice.
