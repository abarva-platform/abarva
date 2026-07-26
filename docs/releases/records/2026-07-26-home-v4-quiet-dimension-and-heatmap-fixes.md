# 2026-07-26-home-v4-quiet-dimension-and-heatmap-fixes — three real quality defects found during live end-to-end review

## Release ID

`2026-07-26-home-v4-quiet-dimension-and-heatmap-fixes`

## Status

`candidate` — verified locally, not yet merged.

## Plain-English Summary

Found by walking the real, newly-approved SkyHarbor candidate chapter-by-chapter on the live
`/home` route, rather than spot-checking the handful of dimensions already known to have content.
Three independent, real defects, none introduced by this session's earlier work but all newly
surfaced by that walkthrough:

**1. Book-mode dimension pages had no title at all.** `HomeV4Dimension.executive_title` was declared
required in the TypeScript interface, but book mode's `renderDimensionsFromBook()` never sets it —
it sets a different field, `title`. Every book-mode dimension page's `<h1>`, and every book-mode
chapter nav item's label, silently rendered empty text. Fixed at the type level (both fields now
optional, documented as architecture-specific) and at both render sites (prefer `title`, fall back
to `executive_title`).

**2. Most dimension pages showed nothing but that (previously blank) title.** Book mode deliberately
tags shared conclusions/gaps/advantages to only a handful of dimensions per tenant (the fix for the
older "38 independently-authored, repetitive" problem) — but the consequence was never handled: a
dimension with nothing tagged to it specifically rendered completely blank otherwise. Confirmed live:
11 of skyharbor-air's real dimensions have no dedicated content. Fixed: a dimension with nothing of
its own now falls back to its book chapter's real, Claude-authored section narrative
(`enterprise_book.sections[dimension.chapter]`), honestly labeled as shared chapter context rather
than dimension-specific commentary — never a blank page again.

**3. The Risk & Controls heatmap rendered as a blank box.** `HeatmapVisual` builds its grid from
`data_points[].row/col`, but `resolveVisualDataPoints()` only ever produced `{label, value}` for
every visual type — every point collapsed onto the same blank row/col key, rendering one empty
cell. Fixed: `risk_register`'s render rule now names a real second axis
(`secondary_dimension: "control_status"`, a real `T09_risk-governance.csv` column), and
`resolveVisualDataPoints()` has a dedicated two-dimensional branch for `visual_type: "heatmap"`
that groups by both axes into real `(row, col, value)` cells.

A fourth, smaller finding from the same walkthrough — the chapter nav sidebar scrolls in its own
container independent of the main page, so an expanded group's items can land below the sidebar's
own visible edge with no visible affordance that more content exists — is fixed by scrolling the
newly-opened list into the sidebar's own view on expand.

## Layer Impact

- `internal-admin` lane: all four fixes are in the V4 explorer/generator. Fixes #1, #2, and #4 are
  pure rendering fixes and take effect immediately for any already-persisted candidate (including
  the currently-approved SkyHarbor pack) once this deploys — no regeneration needed. Fix #3 (the
  heatmap) is generator-side and only affects *future* regenerations; the currently-approved
  SkyHarbor pack's heatmap will still render blank until it is regenerated again.

## Client Applicability

- Internal only, `/home/v4-preview` and the real `/home` route for the one tenant
  (`skyharbor-air`) with an approved V4 pack.

## Changes Included

- `src/components/home/v4/homeV4Visual.ts`: `HomeV4Dimension.executive_title` and the new `title`
  field are both optional now, documented as architecture-specific (legacy vs. book mode).
- `src/components/home/v4/HomeV4ExplorerShell.tsx`:
  - Both `dimension.title ?? dimension.executive_title` call sites (chapter nav label, dimension
    page `<h1>`) fixed.
  - New chapter-narrative fallback for dimensions with no dedicated content, with a new
    `data-testid` on nav items for reliable test targeting.
- `src/components/home/v4/HomeV4Explorer.tsx`: expanding a chapter group now scrolls its newly-shown
  item list into the sidebar's own scroll view.
- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`: `risk_register`'s
  `VISUAL_RENDER_RULES` entry names a real `secondary_dimension`; `resolveVisualDataPoints()` has a
  new two-dimensional branch for `visual_type: "heatmap"`, falling back to an honest empty array if
  no `secondary_dimension` is configured (never a fabricated single-cell grid).
- `scripts/knowledge/__tests__/run-heatmap-2d-tests.mjs` (new, 8 assertions): proves real 2D cells
  for two tenants, defends against a misconfigured heatmap binding, and confirms non-heatmap types
  are unaffected.
- `src/components/home/v4/__tests__/HomeV4ExplorerShell.dimension-fallback.test.tsx` (new, 3 tests):
  proves the real skyharbor-air fixture has quiet dimensions, that one renders its chapter's real
  narrative (not blank), and that a populated dimension does not show the fallback label.

## QA / Validation

- `pass` — `npx eslint`, zero findings.
- `pass` — new suites: `run-heatmap-2d-tests.mjs` (8/8),
  `HomeV4ExplorerShell.dimension-fallback.test.tsx` (3/3).
- `pass` — all existing generator and component suites re-run clean (37/37 across the 4 suites this
  session's V4 work touches).
- `pass` — full-project `tsc --noEmit` (expanded heap), zero errors.
- `pass` — full production `npm run build`, zero errors.
- Live signed-in verification pending as part of this rollout: confirm dimension titles and the
  chapter-fallback content render correctly on the real, already-approved SkyHarbor `/home` pack
  immediately post-deploy (no regeneration needed for those two fixes).

## Rollout Plan

1. Merge to `main` → `aca-main-deploy.yml` builds and deploys the new image.
2. Live verification: confirm the already-approved SkyHarbor pack's dimension titles and
   previously-blank pages now render correctly on both `/home/v4-preview` and the real `/home`.
3. Separately (tracked, real Claude cost, requires explicit sign-off before triggering): a further
   governed regeneration of `skyharbor-air` only, to pick up the heatmap fix on the live pack.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none.
- Live signed-in proof required: yes, for fixes #1/#2/#4 as part of this rollout.

## Rollback Plan

Revert the PR. No schema or data-plane effect; the already-persisted candidate JSON is unchanged,
only how it's rendered.

## Audit Evidence

- This PR's diff and CI run.
- New test suite output (11/11 passing across both new suites).

## Known Gaps

- The heatmap fix does not retroactively repair the currently-approved SkyHarbor pack's stored
  `primary_visual.data_points` for the risk dimension — that requires a real regeneration, tracked
  separately, not bundled into this PR.
