# 2026-08-04-explore-lens-associative-selection-fix — Fix the Explore lens's QlikView-style selection to actually grey out excluded values

## Release ID

`2026-08-04-explore-lens-associative-selection-fix`

## Status

`candidate`

## Plain-English Summary

Live testing (user-reported, this session) found the Source Workspace's Explore lens — the
QlikView-style associative selection panel — had a real bug: clicking a vendor (e.g. "Salesforce")
correctly updated the "current selection" bar ($133.9M, 4 contracts), but the "Annual contract value
by Vendor" panel kept showing all 28 vendors at full color and full value, with none of them greyed
out to reflect the selection. The listboxes on the same page (Vendor category, Renewal urgency,
Benchmark clause) correctly greyed out excluded values when a filter was applied — only the main
grouped-value panel was broken.

Root cause: `WorkspaceViewModel.explore()`'s per-bucket "liveness" (whether a value renders full-color
vs. greyed-and-excluded) was computed from `matches(c, S.groupBy)` — a helper that deliberately
*ignores* the currently-grouped dimension's own active filter. That's the correct behavior for a
listbox (it needs to show "what else could I still pick" within its own dimension, so it must ignore
its own current selection when computing possibilities) — but it's wrong for the main panel, where a
bucket that isn't part of the active selection on that same dimension must never read as live. Because
`S.groupBy` defaults to `'vendor'` and the bug reproduces exactly when the grouped dimension matches
the filtered dimension, selecting any vendor while grouped by vendor made every vendor's contracts
pass through unfiltered, so every bucket looked "live."

## Layer Impact

- `global-control-lane`: `src/app/(maestro)/source/preview/workspace/viewModel.tsx` is UI-layer
  view-model code for the Source Workspace's Explore lens, used by all tenants. This is a pure
  liveness-computation fix — no data read, no computation of business values changes; only which
  buckets are marked "live" vs. "excluded" for rendering.

## Client Applicability

- All clients using the Source Workspace's Explore lens. Selecting any value in any dimension while
  grouped by that same dimension now correctly greys out every non-selected bucket, matching the
  associative-selection behavior the listboxes already had right.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/viewModel.tsx`: `explore()`'s bucket-liveness
  computation now requires `sel.length === 0 || isSel` in addition to the existing
  `g.live.length > 0` check — a bucket in the currently-grouped dimension can only be live if either
  nothing is selected on that dimension, or the bucket itself is one of the selected values.
  Cross-dimension grouping (e.g. grouped by benchmark clause while a vendor filter is active) is
  unaffected — that path was already correct.
- `src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts` (new): three
  regression tests — no-filter baseline (everything live), the exact reported bug (Vendor = Salesforce
  selected, grouped by vendor — only Salesforce stays live, CloudPeak/Microsoft grey out), and a
  cross-dimension check (grouping by benchmark clause while a vendor filter is active still correctly
  keeps matching benchmark buckets live). Confirmed the second test fails against the pre-fix code
  (`git stash` verification) and passes after.

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .` (clean worktree off `origin/main`)
- PASS: `npx eslint` on both changed/added files
- PASS: `npx jest viewModel.explore.test buildViewModel.numeric.test` — 10/10 (3 new + 7 pre-existing)
- Confirmed the new regression test fails without the fix and passes with it (stash-verified locally).
- Live signed-in proof: pending post-deploy — reload the Explore lens, select a vendor, confirm the
  "Annual contract value by Vendor" panel greys out every other vendor.

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys automatically. No migration, no
feature flag — pure logic fix to an existing view-model computation.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required before this release is marked `released`.

## Rollback Plan

Code rollback by reverting the PR. No data mutation, no schema change — reverting restores the exact
prior (buggy) behavior where every bucket in the grouped dimension renders as live regardless of the
active selection.

## Audit Evidence

- Live pre-fix screenshots (this session, user-reported): selecting Vendor = Salesforce in the Explore
  lens on `app.abarva.ai`, "current selection" correctly showing $133.9M/4 contracts, but the
  "Annual contract value by Vendor" panel still showing all 28 vendors at full value/color, "0
  excluded."
- This PR's diff, the stash-verified regression test, and CI run.
- Post-deploy: live signed-in re-check of the same Vendor = Salesforce selection.

## Known Gaps

- Only the Explore lens's main grouped-value panel was found and fixed. The listboxes (Vendor
  category, Renewal urgency, Benchmark clause, Supplier alternatives) already had correct
  associative-selection behavior and were not touched. No other panel on the Workspace uses this same
  bucket-liveness pattern, based on this session's review — but a broader sweep for the same class of
  bug elsewhere in the codebase was not performed given the same-day timeline.
- This is a genuinely strong, demo-worthy feature once verified live tomorrow — real QlikView-style
  associative selection against governed data, not a static filter. Worth a dedicated narrative beat
  in the walkthrough once confirmed working (separate from this release record).
