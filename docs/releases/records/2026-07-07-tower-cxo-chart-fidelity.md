# 2026-07-07-tower-cxo-chart-fidelity — Tower CXO charts rebuilt to match the approved design

## Release ID

`2026-07-07-tower-cxo-chart-fidelity`

## Status

`candidate`

## Plain-English Summary

PR #4531 (merged earlier this session) put real Recharts visualizations on
`/tower`'s Value, Budget, and Benchmark tabs, but the charts were generic —
plain bars with axis-only labels, no narrative, no radar, no per-tenant
cards. The approved design (`Tower · Redesign v4 · standalone` mockup,
reviewed live in-browser) is much more specific: inline dollar labels on
every bar segment, a flagship-program "committed → promised → measured"
bridge chart with a computed "N% proven of the promise" headline, outlier
badges and a computed narrative callout on the budget chart, and a radar
chart plus per-tenant summary cards on Benchmark instead of a grouped bar
chart. This release rebuilds the chart components to match that design.

Every number charted still comes straight off the existing view-model rows
(`CioTowerPortfolioValueRow`, `TowerBudgetRollup`, `CioTowerCxoBenchmarkRow`)
— no new queries. Where the mockup showed illustrative department/owner
labels ("Corporate platforms", "R. Okafor") that don't exist as real columns
in `cio_tower.entities` or `TowerBudgetRollup`, those labels were deliberately
NOT fabricated; the rebuilt charts show only what the substrate actually
carries.

## Layer Impact

Release lane: `global-control-lane` (same shared, non-tenant-gated `/tower`
route as PR #4531).

- **Component layer**: `TowerCxoCharts.tsx` — `ValueProvenBarChart` and
  `BudgetRunChangeChart` enhanced in place; `BenchmarkComparisonChart`
  demoted to `@deprecated` (kept for now, no call sites removed elsewhere)
  in favor of two new components (`BenchmarkTenantCards`,
  `BenchmarkRadarChart`); one new component (`ValueBridgeChart`) added for
  the Value tab's flagship-program bridge, which previously had no chart at
  all — only the measure-card grid.
- **Page layer**: `TowerIndexPage.tsx`'s `CxoGovernedCommandCenter` — Value
  tab now renders the bridge chart above the measure cards; Benchmark tab
  now renders tenant cards + radar instead of the grouped bar chart.

## Client Applicability

- All clients: yes — same generic, tenant-parameterized read path as #4531.
- Specific clients: Lakeshore remains the only tenant with confirmed live
  browser verification; the Benchmark tab's live data showed 4 real peer
  tenants (anonymized "Peer 1"–"Peer 4") in the prior session, confirming
  the underlying data is not Lakeshore-only.
- Internal only: no
- Public/demo only: no
- Feature flag: none (same as #4531 — no working prior behavior to protect)

## Changes Included

3 files. `src/components/tower/charts/TowerCxoCharts.tsx` (rewritten —
new `ValueBridgeChart`, `BenchmarkTenantCards`, `BenchmarkRadarChart`;
enhanced `ValueProvenBarChart`, `BudgetRunChangeChart` with inline labels,
outlier badges, computed narrative callout). `src/components/tower/TowerIndexPage.tsx`
(wires the new components into the Value and Benchmark tabs of
`CxoGovernedCommandCenter`). `src/components/tower/charts/__tests__/TowerCxoCharts.smoke.test.tsx`
(coverage added for the 3 new/changed exports).

## QA / Validation

- Real `npm run build` (genuine `npm install`, fresh worktree off latest
  `origin/main`) — `✓ Compiled successfully`, `/tower` route present.
- `npx eslint` on all 3 touched files — 0 errors (pre-existing warnings only,
  same set as before this change).
- `npx jest src/components/tower/charts/__tests__/TowerCxoCharts.smoke.test.tsx`
  — 7/7 passing.
- `npx jest src/components/tower src/lib/tower src/lib/cio-tower src/__tests__/integration/tower`
  — 1333/1341 passing; the 8 failures (6 suites) were individually checked
  and none reference `TowerCxoCharts.tsx`, `TowerIndexPage.tsx`, or the
  smoke test file — same pre-existing, unrelated failures noted in #4531's
  release record.

## Rollout Plan

Standard ACA rollout on merge: GitHub Actions "ACA main deploy" builds from
the merge SHA, deploys to `ca-abarva-web-lab-eastus`, shifts 100% traffic on
health check. No migration, no feature flag, no data reload required.

**Required after deploy**: live signed-in browser verification of
`https://app.abarva.ai/tower` for Lakeshore, specifically comparing the
rendered Value/Budget/Benchmark tabs against the approved mockup — not just
confirming the charts render without error. This is the explicit corrective
action for this release: the prior release (#4531) was declared complete on
render-without-crashing alone, which the mockup comparison showed was
insufficient.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/*aca-main-deploy*` (existing,
  unmodified)
- Shared runtime mutators: none added
- Approved image digest: assigned at deploy time via `az acr build` from
  merge SHA
- ACA runtime invariant: `ca-abarva-web-lab-eastus`, unchanged
- Worker image invariant: n/a
- Feature/env flag update path: n/a — no flag
- Live signed-in proof required: **yes** — see Rollout Plan above.

## Rollback Plan

Revert the merge commit; redeploy the previous image via the same ACA
rollout path. No migration to unwind.

## Audit Evidence

- PR URL: (to be filled in when opened)
- Build/test output: captured in session transcript.

## Known Gaps

- Portfolio-tab entity cards, AI-initiatives quadrant scatter, and
  vendor-exposure content from the mockup are NOT built in this release —
  scoped out as a separate piece of work requiring `initiatives` data to be
  threaded into `CxoGovernedCommandCenter`, which it currently is not.
- Design-token color for "N% proven" text uses the existing app-wide
  `GREEN`/`GREEN_DEEP` tokens rather than the mockup's slightly different
  `#15803D` — a deliberate judgment call to stay consistent with the
  already-shipped, locked design system rather than introduce a new green.
