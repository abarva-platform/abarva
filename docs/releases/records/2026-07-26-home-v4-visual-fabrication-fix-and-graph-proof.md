# 2026-07-26-home-v4-visual-fabrication-fix-and-graph-proof — stop fabricating zero-value chart points, and prove the relationship graph live

## Release ID

`2026-07-26-home-v4-visual-fabrication-fix-and-graph-proof`

## Status

`candidate` — verified locally, not yet merged.

## Plain-English Summary

Fifth slice of the V4 Knowledge experience productization work (PR4 of the home-v4 pivot). Two
related fixes, both about the same underlying rule: a chart must not show a number the source data
doesn't actually contain.

**1. Chart-data fabrication bug (generator, affects every tenant going forward).**
`resolveVisualDataPoints()` coerced a blank numeric measure to `0` instead of excluding the row. On
real data this produced fabricated points, not honest gaps:
- `meridian-health`'s IT budget dataset (`F12_it-budget-financials.csv`) has exactly one row, a
  deliberate sentinel (`line_id: MER-BUDGET-NOT-LOADED`, `spend_type: not_loaded`, `budget_fy26_usd`
  blank, notes: *"Tower projection intentionally avoids invented budget values."*). The old code
  still grouped it by `budget_area` and added `Number("") || 0`, producing a chart that looked real
  (a real category label, `loaded_fact` classification, "no model-generated values" boundary text)
  but whose only number was invented by `|| 0`, not read from the source.
- `meridian-health`'s initiative registry has 0/7 rows with `promised_benefit_usd` or
  `measured_value_usd` populated at all — the old scatter code plotted all 7 at `(0, 0)`, which
  reads as "measured and found to be zero," not "not measured."
- `first-capital` (36/42 real) and `skyharbor-air` (16/30 real) programs have partial coverage — the
  old code plotted the missing rows at `y=0` alongside the real ones, silently mixing real and
  invented values in the same chart.

Fix: a blank/missing numeric field now excludes that row from the measure entirely. If nothing in a
dataset has a real value for the bound measure, the dimension correctly falls back to the existing
`empty_state` message (already built, already wired to the renderer — the bug was only in what fed
it) instead of rendering a fabricated bar or point.

**2. `/home/v4-preview`'s `skyharbor-air` fixture was stale relative to three already-merged PRs.**
The explorer half of `/home/v4-preview` renders from a build-time-bundled fixture file, not the live
Postgres candidate (only the review-queue list at the top reads the database). That fixture
predated PR #5630 (honest per-dimension headlines), PR #5637 (real relationship graphs), and this
release's fabrication fix — so the Relationships chapter still showed the placeholder text
("not yet rendered as a graph in this view") even after a real governed regeneration job persisted a
fresh candidate to Postgres, and several dimension headlines were still duplicated across chapters.

Fix: reran `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs --reresolve-visuals` (an
existing, zero-Claude-cost tool — it recomputes only the deterministic `dimensions[]` array from the
fixture's already-approved `enterprise_book`, `claude_calls: 0`) against the `skyharbor-air` fixture,
then reran `scripts/knowledge/reconcile-tenant-applications.mjs` to restore the `apps` dimension's
`data_tab.full_rows` (a separate, code-only patch step that `--reresolve-visuals` does not carry,
since it rebuilds the book-mode `dimension` object from scratch and that object has no `data_tab`
field). Caught and fixed before commit: my first attempt skipped the second step and would have
shipped a fixture with a working relationship graph but a broken 900-row Applications & Systems grid
and portfolio summary.

`first-capital.json` and `meridian-health.json` are byte-identical after the same reconcile step ran
against them — confirmed via `git diff`, not assumed.

## Layer Impact

- `internal-admin` lane: `resolveVisualDataPoints()` lives in the governed candidate generator; the
  fixture is `/home/v4-preview`-only. No tenant currently has an approved V4 pack, so no
  client-facing surface is affected. The generator fix does change what any *future* governed
  regeneration produces for every tenant, but that only reaches a real candidate row (`status =
  'candidate'`, never auto-approved) — never a live client view.

## Client Applicability

- Internal only. No client-visible surface changes.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`: new `hasRealNumericValue()` helper;
  `resolveVisualDataPoints()`'s grouped-bar and scatter branches now skip rows lacking a real numeric
  value for the bound measure instead of coercing blank to `0`. Also exports
  `loadTenantDatasetRegistry`, `resolveVisualDataPoints`, `DIMENSION_DATASET_BINDINGS`, and
  `VISUAL_RENDER_RULES` (previously module-private) so the new test suite can exercise the real
  aggregation function directly against real tenant CSVs, not a re-implementation of it.
- `scripts/knowledge/__tests__/run-visual-data-fabrication-tests.mjs` (new, 8 assertions): proves
  `meridian-health`'s budget and programs measures now resolve to `[]` (honest empty, not fabricated
  zeros); proves `first-capital`/`skyharbor-air`'s partially-populated programs measure excludes the
  blank rows rather than zero-padding them; proves fully-populated data (`first-capital`
  budget/vendors, `skyharbor-air` apps-by-domain count) is unaffected by the fix.
- `package.json`: new `"home:knowledge-v4:test-visual-fabrication"` script.
- `src/app/(maestro)/home/v4-preview/_fixtures/skyharbor-air.json`: resynced via
  `--reresolve-visuals` + `reconcile-tenant-applications.mjs` (zero Claude calls) — real relationship
  graph now present for the Relationships chapter, honest per-dimension headlines (no more chapter-
  wide duplicates), fabrication-fixed programs scatter, `full_rows` (900 applications) confirmed
  intact.

## QA / Validation

- `pass` — `npx eslint`, zero findings.
- `pass` — new test suite: `node scripts/knowledge/__tests__/run-visual-data-fabrication-tests.mjs`,
  8/8 passing against real tenant CSVs (not synthetic fixtures).
- `pass` — existing generator test suites re-run clean after the fixture resync:
  `run-dimension-headline-tests.mjs` (11/11), `run-relationship-graph-tests.mjs` (13/13).
- `pass` — full V4 component test suite: 13/13 passing.
- `pass` — full-project `tsc --noEmit` (expanded heap), zero errors.
- `pass` — `git diff` confirms `first-capital.json`/`meridian-health.json` fixtures are unchanged by
  the reconcile re-run (only `skyharbor-air.json` differs).
- **Live signed-in browser verification, `skyharbor-air` tenant, bare platform-admin session**:
  confirmed the Applications & Systems portfolio summary (900 apps, $9,836M, 76% owner coverage,
  real criticality/hosting mixes) and Fraunces chart heading render correctly; confirmed the
  Relationships chapter (XIII) real SVG relationship graph — *pending re-verification against this
  resynced fixture after deploy, to be completed as part of this release's rollout.*

## Rollout Plan

1. Merge to `main` → `aca-main-deploy.yml` builds and deploys the new image.
2. Live signed-in verification on `/home/v4-preview?tenant=skyharbor-air`: confirm the Relationships
   chapter now renders the real SVG graph (not the placeholder text), and confirm Applications &
   Systems still shows the full 900-application grid and portfolio summary.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none.
- Live signed-in proof required: yes, completing as part of this rollout.

## Rollback Plan

Revert the PR. The generator fix and fixture resync have no schema or data-plane effect outside
`/home/v4-preview`'s bundled fixture and future (not-yet-approved) candidate generations.

## Audit Evidence

- This PR's diff and CI run.
- New test suite output (8/8 passing) against real tenant CSVs.
- `git diff` confirming `first-capital`/`meridian-health` fixtures are byte-identical post-reconcile.

## Known Gaps

- The generator fix does not retroactively repair any already-persisted Postgres candidate row
  (including the `skyharbor-air` candidate regenerated earlier today, `home-pack-v4-book-
  skyharbor-air-d03972c27cb2662e`) — it only changes what a *future* governed regeneration produces.
  That candidate's budget/programs charts (if reviewed) still reflect the pre-fix aggregation.
