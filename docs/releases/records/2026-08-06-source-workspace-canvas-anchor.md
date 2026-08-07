# 2026-08-06-source-workspace-canvas-anchor — Anchor the Contract 360 Optimization tab and the Explore canvas on their real content

## Release ID

`2026-08-06-source-workspace-canvas-anchor`

## Status

`candidate`

## Plain-English Summary

Two follow-ups to the same-day Explore-tab redesign (PR #6005), both driven by direct feedback on the same static-dashboard-above-content pattern:

1. **Contract 360 Optimization tab.** This tab (the lever cards for Commercial/Leverage/Governance plus the Hold/Renegotiate/Recompete scenario comparison — the actual case for how to optimise a contract) opened below the same 6-card static value strip shown on every other contract sub-tab. That strip now collapses to a one-line ticker (annual value, actual spend, weak-leverage-signal count) plus a small "leverage risk" ring, with the original 6-card strip available on demand behind "+ full context" — the same mechanism already shipped for Explore, extended with a generic `compactRing` field instead of the Explore-only category-clean-% field it had before.
2. **Explore canvas.** Even with the static dashboard compacted, the associative-selection screen (filter panes + chart) still required scrolling to see in full — unlike a QlikView-style tool, where the whole slice/dice canvas is visible at once. The filter-pane column and the chart panel are now height-locked to the viewport (`calc(100dvh - 386px)`, floor 420px) with their own internal scrolling, instead of growing the page. The "query behind this view" / "why this matters" panel (supplementary, not part of the primary slice/dice work) moved behind a "+ show the query behind this view" toggle so it no longer competes with the canvas for default vertical space.

## Layer Impact

- `global-control-lane`: `src/app/(maestro)/source/preview/workspace/{buildViewModel.ts,WorkspaceClient.tsx,lenses/ExploreLens.tsx}` are UI-layer view-model and rendering code for the Source Workspace, used by all tenants. No data read changes, no computation changes — only which strip renders on which tab, and how the Explore canvas allocates vertical space.

## Client Applicability

- All clients: yes — any tenant using the Source Workspace's Explore tab or a contract's Optimization tab.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; behavior is gated purely on `activeTab`/`kind`.

## Changes Included

- `buildViewModel.ts`: `stripFull`/`stripCompact` now also go compact for `kind === 'contract' && activeTab === 'Optimization'` (previously Explore-only). `compactItems` gained a contract-Optimization branch (annual value, actual spend, weak-leverage-signal count, from the already-computed `contract.row`/`contract.leverage`). The Explore-only `categoryCleanPct`/`categoryCleanPctRaw` fields were replaced with a generic `compactRing: {label, valueLabel, pct01, color} | null`, carrying "category-clean %" on Explore and "leverage risk" (weak-signal count / 4) on Optimization.
- `WorkspaceClient.tsx`: renamed the compact-ticker component from `ExploreCompactStrip` to `CompactContextStrip` and made its ring visual generic over `vm.compactRing` (nullable) instead of hardcoded to category-clean %. No other behavior change.
- `lenses/ExploreLens.tsx`: the filter-pane/chart grid is now `height: calc(100dvh - 386px)` (floor 420px) instead of auto-growing; the filter-pane column and the chart's row list scroll internally (`overflowY: auto`) instead of the whole page scrolling past them. The chart panel became a column flex layout (header / scrolling rows / legend footer) so its header and legend stay pinned while only the rows scroll. The "query behind this view" + "why this matters" panel moved behind a new local-state toggle (`showQuery`, default collapsed) instead of always rendering.

## QA / Validation

- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit -p . --pretty false` — clean.
- `npx eslint` on all three changed files — clean.
- `npx jest buildViewModel.numeric.test viewModel.explore.test` — 14/14 pass, unaffected.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — passes once this record exists.
- No local visual verification possible — this page requires live Azure Postgres (private VNet only, unreachable from localhost). Live signed-in proof required post-deploy (see below).

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys automatically. No migration, no feature flag — pure view-model + rendering change.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies (template image, 100%-traffic revision, worker jobs all match digest).
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes — open a contract's Optimization tab, confirm the compact ticker + leverage-risk ring render instead of the 6-card strip, confirm the lever cards and scenario-comparison panel are visible without scrolling, and confirm "+ full context" expands to the original 6-card strip. Separately, open the Explore tab at a normal laptop viewport height (~900px), confirm the filter panes and chart are both visible together without scrolling the page, confirm each panel scrolls internally when its own content overflows, confirm "+ show the query behind this view" reveals the query/rationale panel on demand, and confirm all other tabs render unchanged.

## Rollback Plan

Revert the PR. `stripFull`/`stripCompact`/`compactItems`/`compactRing` return to their PR #6005 state (Explore-only compacting, `categoryCleanPct` field). `ExploreLens.tsx` returns to full-page-scroll layout with the query/rationale panel always visible.

## Audit Evidence

- PR diff for the three changed files.
- This record's QA section.
- Post-deploy: live signed-in screenshots of (1) the Optimization tab compact ticker + visible lever/scenario cards, (2) that tab's "+ full context" expanded, (3) the Explore tab showing filter panes + chart both visible without page scroll, (4) the query/rationale toggle expanded.

## Known Gaps

The `calc(100dvh - 386px)` canvas height is tuned for the current header/chrome height (crumbs + title + thesis + tabs + compact ticker + selection bar). If any of that chrome grows taller in a future change, the canvas height constant will need re-tuning — it is not derived programmatically from the actual chrome height. The same static-dashboard-above-content pattern may exist on other contract/vendor sub-tabs beyond Optimization; this release fixes Explore and Optimization only, the two tabs flagged live so far.
