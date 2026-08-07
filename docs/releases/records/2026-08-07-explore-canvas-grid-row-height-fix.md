# 2026-08-07-explore-canvas-grid-row-height-fix — Fix the Explore canvas height lock that didn't actually clip

## Release ID

`2026-08-07-explore-canvas-grid-row-height-fix`

## Status

`candidate`

## Plain-English Summary

The same-day canvas-anchor release (`2026-08-06-source-workspace-canvas-anchor`, PR #6007) gave the Explore tab's filter-pane/chart grid an explicit `height: calc(100dvh - 386px)` so it would fit the viewport without scrolling. Live verification on the deployed page found it didn't work: the grid's implicit CSS Grid row was never given an explicit row-height, so it auto-sized to its content instead of respecting the container's declared height, and the content simply overflowed past the box onto the page — exactly the scrolling behavior the release was meant to remove. This release adds the missing `gridTemplateRows: 'minmax(0,1fr)'` and `overflow: 'hidden'` on the grid container (plus `height: '100%'` on the filter-pane column) so the height actually holds and each panel scrolls internally instead of the whole page. Verified live: on a realistic 1536×864 viewport, the full filter-pane + chart canvas now renders within 722px of vertical space, comfortably inside the viewport with no page scroll needed to see the whole analysis screen.

## Layer Impact

- `global-control-lane`: `src/app/(maestro)/source/preview/workspace/lenses/ExploreLens.tsx` only — CSS-only fix, no data or computation change.

## Client Applicability

- All clients: yes — any tenant using the Source Workspace's Explore tab.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `ExploreLens.tsx`: the filter-pane/chart grid container gained `gridTemplateRows: 'minmax(0,1fr)'` and `overflow: 'hidden'` (previously had `height` and `alignItems: 'stretch'` but no explicit row track, so the height was not enforced). The filter-pane column gained explicit `height: '100%'` alongside its existing `overflowY: 'auto'`.

## QA / Validation

- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit -p . --pretty false` — passed, clean.
- `npx eslint` on the changed file — passed, clean.
- Live signed-in verification on `app.abarva.ai/source/preview/workspace` (Explore tab, SkyHarbor tenant), via `getBoundingClientRect()` measurement and screenshot at a 1536×864 viewport — passed: grid container top at y=242.5, height 479px, bottom at y=721.5, fully inside the 865px viewport. Confirmed the bug first (failed: page-level scroll needed, header scrolling away with the canvas) on the unfixed version, then confirmed the fix passed on the same live page.

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys automatically. No migration, no feature flag — pure CSS fix.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies (template image, 100%-traffic revision, worker jobs all match digest).
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes — reload the Explore tab post-deploy at a normal laptop viewport height and confirm the filter panes + chart are both fully visible without scrolling the page, and that each panel scrolls internally if its own content overflows.

## Rollback Plan

Revert the PR. The grid container returns to the PR #6007 state (`height` set but no `gridTemplateRows`/`overflow`), which is a visual regression (page scrolls again) but not a functional break — no data or interaction is affected either way.

## Audit Evidence

- PR diff for the one changed file.
- This record's QA section, including the live `getBoundingClientRect()` measurement.
- Post-deploy: live signed-in screenshot showing the full canvas within one viewport.

## Known Gaps

The `calc(100dvh - 386px)` constant is still a hand-tuned magic number based on this tenant's current chrome height (nav bar, status bar, breadcrumb, title, thesis, tabs, compact ticker, category-quality warning banner, selection bar). If a future change grows any of that chrome — a longer thesis string, an additional warning banner — the constant will need re-tuning; it is not derived from the actual measured chrome height. A more robust follow-up would compute available height at runtime (e.g. `ResizeObserver` on the chrome block) rather than a fixed subtraction, but that is out of scope for this same-day fix.
