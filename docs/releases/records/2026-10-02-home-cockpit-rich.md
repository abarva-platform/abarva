# 2026-10-02-home-cockpit-rich — Home v4 cockpit: chart grid + cross-dimensional estate pivot

## Release ID

`2026-10-02-home-cockpit-rich`

## Status

`candidate`

## Plain-English Summary

The Home v4 chapter surface now reads as a dashboard rather than a vertical scroll of one chart after
another. Two things change for every chapter. First, a chapter's exhibits render in a responsive grid
of cards (two across on a wide screen, one when narrow), each card carrying its chart, the message it
is making, and the named source it stands on. Second, the Technology & Data chapter becomes an
interactive cockpit over the whole application estate: a reader can pivot the estate by provider,
business function, criticality, deployment model or scope; switch the measure between application count
and annual cost; drill into any value to see the slice behind it and how it relates across the other
dimensions; and read every application in a sortable table. Every number on the surface — each bar,
each point, each relationship card, each table cell, each scale figure — is counted or summed from the
governed estate rows the record already carries. The model supplies no plotted value, and a figure
that cannot be derived from a row is not shown. Where a row omits a dimension it reads "Not recorded"
rather than being folded into a real group, and where a row omits a debt score it is counted but not
plotted, with the omission stated in words.

## Layer Impact

Lane: `global-control-lane`. This is a layer-4 product (Home) presentation change only. It adds a new
projection of the existing canonical technology estate; it introduces no new source of truth, no new
canonical object, and no data-plane write. The estate rows are read from the governed review bundle
exactly as the rest of the surface reads them, so the data operating model is unchanged: the product
remains a projection of the canonical model and owns none of the data it renders.

## Client Applicability

- All clients: yes — the cockpit renders for every tenant whose served record carries a technology
  estate. It degrades honestly (a stated notice, not a blank) when the estate is absent.
- Specific clients: not applicable.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is on the default Home v4 chapter read path.

## Changes Included

- `src/components/home/v4/tech-estate-pivot.ts` (new): pure, unit-tested pivot arithmetic —
  normalisation, aggregation, drill-filter, relationship summary, scatter points, estate scale, and
  sorting, all computed from estate rows with no authored value.
- `src/components/home/v4/TechCockpit.tsx` (new): the Technology & Data cross-dimensional cockpit
  (scale strip, pivot/measure controls, governed bar + Recharts scatter, relationship cards, sortable
  drill-filtered table).
- `src/components/home/v4/CockpitChartGrid.tsx` (new): the responsive exhibit grid and the shared
  governed horizontal-bar component, drawn through the governed chart kit.
- `src/components/home/v4/ChapterPage.tsx`: renders the chart grid for standard chapters and the
  cockpit for Technology & Data, in place of the stacked full-bleed exhibits; adds a typed `estate`
  prop; drops the now-unused per-exhibit meta prop.
- `src/components/home/v4/HomeV4App.tsx`: plumbs the estate's application and vendor rows (already in
  the served bundle) and the data-asset count through to the chapter, scoped to Technology & Data.
- `src/components/home/v4/Exhibit.tsx`: exports the dataset-subject map for reuse by the grid.
- `scripts/qa/render-home-v4-pages-proof.tsx`: renders the new cockpit in the component proof.
- Tests: `__tests__/tech-estate-pivot.test.ts` and `__tests__/cockpit-charts.test.tsx` (new);
  `__tests__/served-record-surface.test.tsx` updated to the new chapter composition.

## QA / Validation

All gates run locally from the worktree and passed:

- `node scripts/quality/typecheck.mjs` — passed (`typecheck: clean`).
- `npx eslint` on all changed files — passed (exit 0, no warnings after cleanup).
- `node scripts/ci/test-ratchet.mjs docs/ci/home-test-baseline.json` — passed
  (`no movement away from the baseline`; 937/965 tests, 12 failing suites, equal to the recorded
  baseline of 12; the two new suites add 21 passing tests).
- Full `src/components/home/v4/__tests__` suite — 39 suites, 466 tests, all passing.
- Visual proof: the two deliverables were rendered client-side from the checked-in golden snapshots
  and verified by eye — the grid lays out as cards with source lines; the cockpit's bar, scatter,
  relationship cards and table render; a bar/cell drill filters the slice and the pivot control
  re-aggregates. Scale and table figures matched the estate totals exactly.

## Rollout Plan

Becomes active by merge to `main` and the repo-owned Azure Container Apps deploy of the resulting
image, like any other Home v4 read-path change. There is no migration, no feature flag to toggle, and
no data build to run: the cockpit reads estate rows already present in the served review bundle.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on merge to `main`; no ad-hoc
  Azure commands are involved in this change.
- Shared runtime mutators: none — this change does not alter env vars, flags, scale, secrets, traffic
  weights, or the web Container App template.
- Approved image digest: unchanged by this record; the standard digest-pinned deploy applies.
- ACA runtime invariant: unaffected (no runtime image or template mutation here).
- Worker image invariant: unaffected (no worker job touched).
- Feature/env flag update path: not applicable — no flag or env change.
- Live signed-in proof required: yes, post-deploy, on the Technology & Data chapter for an affected
  tenant, as the standard Home v4 live proof; this record is a candidate and is not marked
  live-proven.

## Rollback Plan

Revert the merge commit and redeploy the prior image through the repo-owned deploy workflow. The change
is presentation-only and additive (a new component path plus a scoped prop), so a revert carries no
data or schema consequence; no migration rollback is involved.

## Audit Evidence

- The diff on this branch (the files listed under Changes Included).
- Local gate output quoted under QA / Validation (typecheck, eslint, test-ratchet, the v4 suite).
- The component proof pages produced by `scripts/qa/render-home-v4-pages-proof.tsx`.
- The new tests, which assert the pivot's figures come from estate rows, that no invented figure
  appears, that a drill filters correctly, and that the governance affordances persist.

## Known Gaps

- The cockpit is exercised against the two composite reference tenants' golden snapshots; a signed-in
  live proof on the deployed surface is still owed before this is marked live-proven.
- Recharts renders its chart SVG client-side only, so the static component proof shows chart frames
  and all surrounding content but not the SVG marks; the marks were verified in a client render
  instead.
