# 2026-07-07-tower-cxo-chart-grid-collapse — correct the grid overflow fix, add the missing track constraint

## Release ID

`2026-07-07-tower-cxo-chart-grid-collapse`

## Status

`candidate`

## Plain-English Summary

PR #4541 fixed a chart-panel overflow bug by adding `min-width: 0` to
`CioPanel`. Live re-verification of that fix (required, since the last two
Tower chart releases each shipped a live-only bug) found the fix was
**incomplete and introduced a new regression**: with only `min-width: 0` on
the panel and no explicit column-track sizing on the surrounding
`display: grid` sections, the grid's default `auto` column-track sizing
collapsed toward near-zero instead of filling the available width — the
Budget tab's bars rendered at ~10px wide instead of spanning the panel, and
every inline dollar label disappeared (Recharts hides labels when the bar
segment is narrower than its width threshold).

The correct, complete fix is the standard two-part CSS Grid idiom: give the
wrapping `display: grid` sections an explicit
`gridTemplateColumns: "minmax(0, 1fr)"` (the column always fills 100% of
the container regardless of children's content size) in addition to
`CioPanel`'s existing `minWidth: 0` (so the panel doesn't refuse to shrink
into that track). Together these make Recharts' `ResponsiveContainer`
measure a stable, correct width instead of getting caught in the
grow-forever or collapse-to-zero failure modes.

## Layer Impact

Release lane: `global-control-lane` (same shared `/tower` route).

- **Component layer**: `TowerIndexPage.tsx` — the 5 tab-content
  `<section style={{ display: "grid", ... }}>` wrappers inside
  `CxoGovernedCommandCenter` (Value/Budget/Portfolio/Benchmark/Evidence) now
  declare `gridTemplateColumns: "minmax(0, 1fr)"`.

## Client Applicability

- All clients: yes — layout fix, not tenant-specific.
- Specific clients: regression confirmed live for Lakeshore immediately
  after #4541 deployed; root cause is CSS-only and reproduces for any
  tenant viewing these tabs.

## Changes Included

1 file. `src/components/tower/TowerIndexPage.tsx` (5 identical
`gridTemplateColumns` additions to the CXO command center's tab sections).

## QA / Validation

- Regression found via **live signed-in browser verification** immediately
  after deploying #4541 — `javascript_tool` reading actual SVG `<rect>`
  `width` attributes (~10px, far too narrow to be correct) and confirming
  zero dollar-amount `<text>` labels present on the Budget tab.
- Root-caused via DOM ancestor-chain inspection (`getComputedStyle`,
  `getBoundingClientRect()`) showing the grid item's default `auto`
  track-sizing collapsing once its own `min-width: 0` removed its content's
  contribution to track sizing, with nothing (`1fr`) forcing the track back
  to the container's full width.
- Real `npm run build` off latest `origin/main` (includes #4538 + #4541) —
  compiles clean.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit` (exact CI
  command) — 132 pre-existing errors, zero in touched files.
- `npx eslint` — 0 errors.
- Chart smoke tests — 7/7 passing.

## Rollout Plan

Standard ACA rollout on merge. No migration, no flag.

**Required after deploy**: live re-verification, this time checking exact
pixel measurements via `getBoundingClientRect()`/`querySelectorAll('rect')`
widths — not a visual screenshot alone — on both the Budget tab (bars should
span most of the panel width, labels visible) and the Portfolio tab
(end-of-bar labels on-screen, panel width not exceeding the viewport).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/*aca-main-deploy*`
- Shared runtime mutators: none added
- Approved image digest: assigned at deploy time via `az acr build` from
  merge SHA
- ACA runtime invariant: `ca-abarva-web-lab-eastus`, unchanged
- Live signed-in proof required: **yes**

## Rollback Plan

Revert the merge commit; redeploy the previous image via the ACA workflow.

## Audit Evidence

- PR URL: (to be filled in when opened)
- Regression discovery evidence: `javascript_tool` rect-width measurements
  and grid ancestor-chain inspection, captured in session transcript.

## Known Gaps

None known for this fix. This is the third iteration on the same chart
work in one session (#4538 design fidelity, #4541 label/overflow bugs, this
release for the overflow fix's own regression) — each was caught by
requiring live signed-in verification with concrete measurements rather
than accepting a build-succeeds or screenshot-looks-fine signal, per this
session's explicit standing correction against declaring premature success.
