# 2026-08-06-explore-lens-anchor-redesign — Anchor the Explore tab on the associative-selection grid, not the static dashboard

## Release ID

`2026-08-06-explore-lens-anchor-redesign`

## Status

`candidate`

## Plain-English Summary

The Source Workspace's Explore tab (the QlikView-style associative-selection view) used to open with the same 5-card static stat dashboard shown on every other portfolio tab, pushed above the actual interactive grid. On a normal viewport, a user had to scroll past the stat cards, the group-by pills, and the category-quality warning banner before reaching the grid — the entire point of the tab. This release replaces the static dashboard on Explore only with a compact one-line ticker (annual value, contract count, vendor count, top-10 vendor concentration, category-clean %), so the interactive grid is visible immediately. A "+ full context" toggle expands back to the original stat cards plus the V4 semantic proof panel (10 real Cube-backed metrics — invoice lines, performance credits, SaaS/cloud observations, rate-card variance, off-contract exposure) on demand, so nothing is removed, just not on by default.

## Layer Impact

- `global-control-lane`: `src/app/(maestro)/source/preview/workspace/{buildViewModel.ts,WorkspaceClient.tsx}` are UI-layer view-model and rendering code for the Source Workspace, used by all tenants. No data read changes, no computation changes — only which strip renders on the Explore tab and what the compact ticker surfaces.

## Client Applicability

- All clients: yes — any tenant using the Source Workspace's Explore tab.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; behavior is gated purely on `activeTab === 'Explore'`.

## Changes Included

- `buildViewModel.ts`: `stripFull`/`stripCompact`/`compactItems` (previously always `true`/`false`/`[]`, dead scaffolding) now branch on whether the Explore tab is active. `compactItems` populated from already-computed real values (`v4Snapshot`/`summary` executive-portfolio totals, `conc.topNShare(10)`). Added `categoryCleanPct`/`categoryCleanPctRaw` for the ticker's ring visual.
- `WorkspaceClient.tsx`: extracted the existing full-strip markup (value strip + pending items + `SourceV4ProofPanel`) into a reusable `FullContextStrip` component — no behavior change for any tab other than Explore. Added `ExploreCompactStrip`, a new component with local expand/collapse state, rendered only when `stripCompact` is true.

## QA / Validation

- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit -p . --pretty false` — clean, off current `main`.
- `npx eslint` on both changed files — clean.
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
- Live signed-in proof required: yes — load `/source/preview/workspace?...` on the Explore tab, confirm the compact ticker renders instead of the 5-card strip, confirm the grid is visible without scrolling, confirm "+ full context" expands to the original strip + V4 proof panel, and confirm all other tabs (Context, Concentration, Renewals, Leverage, Opportunities, Agenda) render the full strip unchanged.

## Rollback Plan

Revert the PR. `stripFull`/`stripCompact`/`compactItems` return to their prior hardcoded `true`/`false`/`[]` values, restoring the original always-full-strip behavior on every tab including Explore.

## Audit Evidence

- PR diff for the two changed files.
- This record's QA section.
- Post-deploy: live signed-in screenshot of the Explore tab showing the compact ticker + visible grid, and a second screenshot with "+ full context" expanded.

## Known Gaps

This release only changes which strip renders — it does not add new group-by dimensions, an alternate chart metric (currently hardcoded to annual contract value), or a hierarchy drill-down. A same-day investigation found real, already-computed portfolio-level numbers (weak-leverage value-at-risk, per-contract source confidence, budget-vs-actual variance) that could enrich the grid itself further; that's a larger follow-up, not in scope here given the same-day timeline.
