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
- `src/components/home/v4/Exhibit.tsx`: removes `ExhibitBars` and its two private helpers
  (`Row`, `readRow`), 159 lines, superseded by the grid's governed bar. `ChapterPage.tsx` had
  already dropped the only render of it, so the export was left reachable by nothing.
- `docs/architecture/unreachable-components.json`,
  `docs/architecture/unreachable-exports.json`: refreshed through the audit's own `--update`,
  not hand-edited. Net effect is a tightening — two files leave the components baseline, so
  their exports are now checked where before the whole file was excused.
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

### CI repair, 2026-10-03 — backlog item U-551

The three red checks this candidate sat on for ~18h all reduce to **one** cause, which is the finding
that changed the work: `scripts/audit/route-reachability-check.mjs` exited non-zero, and three
separate checks consume it. `Agent context broker boundary` runs the audit directly; `Source
component suites` fails only `source-canvas-reachability.test.ts`, which shells out to it and
rethrows its stdout; and `Behavior coverage floor`'s two failing suites
(`route-export-reachability.test.ts`, `programs-discovery-directory-ci-coverage.test.ts`) both invoke
the same script. No check was failing on a broker-boundary violation: nothing here reached context
outside `AgentContextBroker`, and no such violation was repaired because none existed.

The audit reported three NEW unreachable exports, and none was newly written code. All three were
pre-existing symbols this candidate orphaned or exposed:

- `Exhibit.tsx#ExhibitBars` — orphaned. `ChapterPage.tsx` replaced `<ExhibitBars>` with
  `<CockpitChartGrid>` and dropped the import, leaving the export with no reachable caller.
  **Removed.** Its only governance property — explicit accounting for everything not drawn — is
  preserved by the replacement, which states it in prose ("Showing the N largest of M. K more rows
  are in the record and in the table below"), so nothing was lost with it.
- `home-chart-kit.tsx#HOME_SERIES`, `#VisualCard` — exposed, not caused. That file was itself in the
  unreachable-components baseline, so its exports were never checked; this candidate imports
  `HOME_HEX`/`HomeChartTooltip` from it, making the file reachable and its exports checkable for the
  first time. Their only importer is `GovernedVisual.tsx`, which remains a baselined unreachable
  file. **Baselined, deliberately not mounted:** `VisualCard` renders `visual.purpose`, which this
  surface refuses by design — pipeline-facing wording does not belong in front of a reader. Mounting
  it to satisfy a gate would have reintroduced exactly what v4 removed. Retiring `GovernedVisual.tsx`
  instead is a retire-versus-repair call outside this candidate's scope and is filed separately.

Measured locally, same scope, same commands CI runs, on head `2725b304e2`:

| Check | Before | After |
|---|---|---|
| `route-reachability-check.mjs` | exit 1, 3 NEW unreachable exports, 2 stale baseline entries | exit 0 |
| `source-canvas-reachability.test.ts` | 1 failed / 1 total | 1 passed / 1 total |
| `route-export-reachability` + `programs-discovery-directory-ci-coverage` | 2 failed / 18 passed / 20 total | 0 failed / 20 passed / 20 total |

The before-numbers were taken by restoring all three changed files to the pristine PR head and
re-running, not inferred from the CI log. Typecheck `tsc --noEmit` exit 0 with 0 `error TS`; ESLint on
the changed file exit 0.

Two deliberate breaks, each confirmed to change the file before running, each caught:

- Re-adding an unmounted `export function ExhibitBarsProbe` → audit exit 1, naming
  `Exhibit.tsx#ExhibitBarsProbe` as NEW. Proves the gate still runs and was not disabled by the
  baseline refresh.
- Re-adding `home-chart-kit.tsx` to the components baseline → audit exit 1 on `Baseline is stale`.
  Proves the components half is load-bearing, not decorative.

**Merge order with #8891, which the item asked to settle explicitly: this candidate lands first.**
The two share `HomeV4App.tsx` but do **not** conflict — `git merge-tree` merges them cleanly (exit 0),
so the shared file is not a shared conflict. This candidate also merges cleanly with `main` (exit 0),
while #8891 carries four content conflicts against `main`, all in `scripts/ecl/` and none in the
shared file. So the ordering is mechanical rather than a product call: the conflict-free branch lands,
and #8891 resolves its own unrelated ECL conflicts on its own schedule. No rebase of this candidate is
owed in either order.

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
- `GovernedVisual.tsx` is an unreachable file whose only remaining purpose is to consume
  `HOME_SERIES` and `VisualCard`. Those two exports are recorded in the exports baseline rather
  than removed, because deleting them means retiring that component and its live suite — a
  retire-versus-repair decision this candidate does not take. Filed separately.
- Recharts renders its chart SVG client-side only, so the static component proof shows chart frames
  and all surrounding content but not the SVG marks; the marks were verified in a client render
  instead.
