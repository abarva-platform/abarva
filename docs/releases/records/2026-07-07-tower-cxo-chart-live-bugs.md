# 2026-07-07-tower-cxo-chart-live-bugs — fix two live rendering bugs found in post-deploy browser QA

## Release ID

`2026-07-07-tower-cxo-chart-live-bugs`

## Status

`candidate`

## Plain-English Summary

PR #4538 (merged, deployed) rebuilt Tower's Value/Budget/Benchmark charts to
match the approved design. Live signed-in browser verification against
`https://app.abarva.ai/tower` for Lakeshore — required specifically because
an earlier release in this same effort had been declared "done" from
render-without-crashing alone, which turned out to be insufficient — found
two real bugs that only show up with live data and a real layout, not in
unit tests:

1. **Budget tab: wrong dollar amount on the "change" bar segment.** The
   inline label on each entity's green (change) segment showed the row's
   _total_ budget instead of the change-only amount (e.g. Run $22.6M +
   green segment mislabeled "$36.5M" when the change amount was actually
   ~$13.9M — $36.5M was the row's total). Root cause: Recharts passes the
   cumulative stack-top as `value` to a custom `LabelList` `content`
   function for non-first stacked segments, not the segment's own
   magnitude. Fixed by reading the real per-field amount directly off the
   chart's own row data (by index) instead of trusting `props.value`.
2. **Portfolio tab: the "Value Proven" chart overflowed its panel and its
   end-of-bar labels rendered off-screen.** `CioPanel` is a CSS grid item
   with the browser default `min-width: auto`; once a program's promised
   value pushed the value-proven chart's content past a certain width, the
   panel's intrinsic content size exceeded its grid track and grew past the
   page's visible width, silently clipped by an ancestor's `overflow-x` (so
   `document.body.scrollWidth` never revealed it). Fixed by setting
   `minWidth: 0` on `CioPanel`, the standard fix for this well-known CSS
   grid overflow pattern.

## Layer Impact

Release lane: `global-control-lane` (same shared `/tower` route).

- **Component layer**: `TowerCxoCharts.tsx` (`BudgetSegmentLabel` now reads
  `rows[index][field]` instead of `props.value`). `TowerIndexPage.tsx`
  (`CioPanel` gets `minWidth: 0`, a layout fix affecting every panel on
  every Tower tab, not just the two charts that exposed it).

## Client Applicability

- All clients: yes — same generic read path; the `CioPanel` fix applies to
  every panel on `/tower`, not just Lakeshore's data shape.
- Specific clients: bug confirmed live for Lakeshore; the underlying causes
  (Recharts stacked-label semantics, CSS grid min-width) are data-shape
  independent and would reproduce for any tenant with the same chart types.

## Changes Included

2 files. `src/components/tower/charts/TowerCxoCharts.tsx` (`BudgetSegmentLabel`
signature change — now requires `rows` + `field` props, read from row data
instead of the Recharts-supplied `value`). `src/components/tower/TowerIndexPage.tsx`
(`CioPanel` — added `minWidth: 0`).

## QA / Validation

- Bugs found via **live signed-in browser verification** of
  `https://app.abarva.ai/tower` (Lakeshore), not local testing — confirmed
  via `javascript_tool` reading actual rendered SVG text content and
  `getBoundingClientRect()` on the DOM ancestor chain to find the exact
  element whose intrinsic width exceeded its grid track.
- Real `npm run build` off latest `origin/main` (includes #4538) — compiles
  clean.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit` (exact CI
  command) — 132 errors, zero referencing `TowerCxoCharts.tsx` or
  `TowerIndexPage.tsx` (same pre-existing baseline count as #4538's
  verification).
- `npx eslint` on both touched files — 0 errors, same pre-existing warnings.
- Chart smoke tests — 7/7 passing.

## Rollout Plan

Standard ACA rollout on merge. No migration, no flag.

**Required after deploy**: repeat the live signed-in browser check — zoom
into the Budget tab's bars to confirm the change-segment label now shows
the change-only amount (not the row total), and confirm the Portfolio
tab's Value Proven chart end-labels are visible on-screen (not clipped past
the viewport).

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
- Live-bug discovery evidence: `javascript_tool` DOM/SVG inspection output
  captured in session transcript (SVG text content showing duplicate
  change/total labels; `getBoundingClientRect()` ancestor-chain walk
  showing the 1637px `CioPanel` inside a 917px grid track).

## Known Gaps

None known for this fix. Broader Known Gaps from #4538 (Portfolio-tab
entity cards, AI-initiatives quadrant, vendor-exposure content) remain
unchanged and out of scope here.
