# 2026-08-07-explore-quality-banner-compact — Compact the category-quality warning banner on Explore

## Release ID

`2026-08-07-explore-quality-banner-compact`

## Status

`candidate`

## Plain-English Summary

Live measurement after the `2026-08-07-explore-canvas-grid-row-height-fix` release found the Explore canvas still needed real scroll on a normal desktop browser window: the "Category analysis is provisional" warning banner (shown whenever category classification is incomplete, which is true for this tenant) was a full multi-line card — roughly 100px tall with a message paragraph and five stat fields — sitting above the canvas alongside the breadcrumb, title, thesis, tabs, compact ticker, group-by row, and selection bar. Measured on a real 1536×864 Chrome window (687px usable content height after browser chrome), that stack of chrome left almost no room for the canvas. This release compacts the warning banner to a single line (headline + affected-rows/affected-value/conflicts inline, same pattern as every other compacted strip shipped this week), with a "+ detail" toggle revealing the full message, clean-value %, and rule version on demand. The canvas height-lock constant was also retuned from `calc(100dvh - 386px)` to `calc(100dvh - 600px)` to reflect the real, measured chrome height rather than the earlier guess.

## Layer Impact

- `global-control-lane`: `src/app/(maestro)/source/preview/workspace/lenses/ExploreLens.tsx` only — UI-layer, no data or computation change.

## Client Applicability

- All clients: yes — any tenant whose category classification is incomplete will see the compacted banner on Explore; tenants with fully classified categories are unaffected (the banner already didn't render for them).
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `ExploreLens.tsx`: the category-quality banner is now a single-line button (headline + `{affectedRows} affected rows · {affectedValue} affected value · {conflictedRows} conflicts` + a "+ detail" toggle) with local `showQuality` state; the full message, clean-value %, and rule version render in an expandable panel below it, matching the same collapse-by-default pattern already shipped for the compact context strip and the query/rationale panel. The canvas grid's height-lock constant changed from `386px` to `600px`, based on a live measurement of actual chrome height on a real browser window rather than an estimate.

## QA / Validation

- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit -p . --pretty false` — passed, clean.
- `npx eslint` on the changed file — passed, clean.
- Not yet re-verified live post-deploy (see Deployment Authority below) — the prior two releases in this series were each live-verified and this one directly responds to a gap found in that live verification.

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys automatically. No migration, no feature flag — pure UI change.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies (template image, 100%-traffic revision, worker jobs all match digest).
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes — reload the Explore tab post-deploy, confirm the category-quality banner renders as a single line with a working "+ detail" toggle, and re-run the `getBoundingClientRect()` viewport-fit measurement to confirm the reduction in required scroll.

## Rollback Plan

Revert the PR. The banner returns to its full multi-line card, and the canvas height constant returns to `386px`.

## Audit Evidence

- PR diff for the one changed file.
- This record's QA section.
- Post-deploy: live `getBoundingClientRect()` measurement and screenshot confirming reduced/eliminated scroll on a realistic browser window.

## Known Gaps

Even with this compaction, true zero-scroll depends on the viewer's actual browser chrome and window height — a real desktop Chrome window with a visible bookmarks bar, at a modest laptop resolution, may still require some scroll to see the full canvas; this is a function of how much vertical space the OS/browser chrome itself consumes, which page CSS cannot control. The `calc(100dvh - 600px)` constant is tuned to a 1536px-wide, 2-line-thesis layout; it will drift if the thesis text length, tab count, or category-quality message length changes materially. A fully robust fix would measure the actual chrome height at runtime (e.g. via `ResizeObserver`) instead of using a fixed subtraction — flagged as a follow-up, not done here given the same-day timeline.
