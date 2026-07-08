# 2026-07-07-source-value-at-stake-parse — Source value-at-stake baseline parse fix

## Release ID

`2026-07-07-source-value-at-stake-parse`

## Status

`candidate`

## Plain-English Summary

Fixes a real defect found in live testing: on a freshly-created Source event the
value-type-waterfall header rendered garbage — "Value at stake (event estimate): $15"
and "305,654,347–436,649,067% of baseline".

Root cause: when a user opened an event, the intake's free-text "value target" field
(e.g. "Target 15-20% run-cost reduction via volume-band repricing") was parsed by
`extractEstimatedValue`, which matched the FIRST number ("15") and stored it as the
event's `estimated_value_usd`. That $15 became the event's value-at-stake and was then
used as the DENOMINATOR (baseline) of the value-pool / value-type-waterfall header, so
a real $46M–$65M classified total divided by a $15 baseline produced a nonsense
percentage.

Two-part fix:

1. **`extractEstimatedValue` now requires a currency signal.** A number becomes a USD
   amount ONLY when the text carries a `$` prefix OR a magnitude suffix
   (`k`/thousand, `m`/million, `b`/`bn`/billion). It scans all candidates and returns
   the FIRST currency-signalled one, so "target $4M savings, 15% unit cost" → 4,000,000
   and the "15%" is skipped. A number immediately followed by `%` (a rate/target like
   "15%" or "15-20%") and a bare number with no currency signal ("15", "3 vendors")
   both return `undefined` — no baseline is fabricated. `b`/`bn`/`billion` support was
   added alongside the existing `m`/`k`. Rounding is unchanged.

2. **The waterfall header suppresses the baseline when there is no valid amount.** In
   `ValueWaterfall.tsx`, when `baselineAmount <= 0` the "Value at stake … $0" line and
   the "% of baseline" fragment are omitted; the classified-value total still shows on
   its own. The `step-insight-builder.ts` headline already guarded the `% of baseline`
   fragment with `baselineAmount > 0` (verified, no change needed there).

Behavior is preserved when a valid amount IS present: "$4M" still shows the baseline
line and a real percentage.

## Layer Impact

- `global-control-lane`: shared Source app behavior. Two changed source files
  (`SourceOriginatePage.tsx` intake parse, `ValueWaterfall.tsx` header render). No
  route, schema, data-plane, or engine change. The affected canvas stays dark behind
  the existing `source_analytics` feature flag; un-enrolled tenants see no change.

## Client Applicability

- All clients: no. The value-analytics canvas is gated by the `source_analytics`
  feature flag and is inert for tenants without it.
- Specific clients: tenants enrolled in `source_analytics` (Lakeshore in lab).
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` (unchanged; this ships behind it).

## Changes Included

- `src/components/source/SourceOriginatePage.tsx` — rewrote and exported
  `extractEstimatedValue`: currency-signal required (`$` or `k`/`m`/`b`/`bn` magnitude
  suffix), percentages and bare numbers rejected, scans all candidates and returns the
  first currency-signalled one, adds billions support. Rounding unchanged. Function
  exported so it is unit-testable.
- `src/components/source/canvas/analytics/ValueWaterfall.tsx` — added a `hasBaseline`
  (`baselineAmount > 0`) guard: suppresses the "Value at stake: $X" baseline line and
  the "% of baseline" fragment when there is no valid amount; the classified total and
  its "classified value" label still render. No change when a real baseline is present.
- `src/__tests__/integration/source/source-originate-page.test.ts` — new
  `extractEstimatedValue` describe block covering: "15-20% run-cost reduction" →
  undefined; "15%" → undefined; "$4M savings" → 4000000; "target $500k" → 500000;
  "$1.2bn" / "$2 billion" → billions; "3 vendors" / "15" → undefined; "$4M savings,
  15% unit cost" → 4000000; bare "4M run-rate" → 4000000.
- `src/components/source/canvas/analytics/__tests__/ValueWaterfall.honesty.test.tsx` —
  new no-baseline describe block proving the "Value at stake: $X" line and "% of
  baseline" fragment are suppressed when `baselineAmount <= 0`, the classified total
  still shows, and both render when a real baseline is present.

## QA / Validation

- Unit/behavior jest: `source-originate-page.test.ts` and `ValueWaterfall.honesty.test.tsx`
  — all green (32 tests, incl. the new parse + suppression cases). `Status: pass`.
- Typecheck: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  run to completion under a tracked process (log non-empty). Net-new errors = 0: the
  branch error log matches the origin/main baseline (131 pre-existing errors from the
  6ebe6d4a9 canvas workstream); none of the changed files
  (`SourceOriginatePage.tsx`, `ValueWaterfall.tsx`, the two test files) appears in the
  error list. `Status: pass`.
- ESLint on all changed files — clean (0 errors). `Status: pass`.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass. `Status: pass`.

## Rollout Plan

Merge to main via squash PR. No migration. No runtime env/flag change: the canvas is
already gated by the pre-existing `source_analytics` flag, so the fix activates only
for tenants already enrolled. Standard ACA main deploy workflow picks up the merge; no
manual runtime mutation required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on merge to main.
- Shared runtime mutators: none — no feature-branch/local Azure commands.
- Approved image digest: produced by the main deploy workflow at merge time.
- ACA runtime invariant: unchanged by this PR; verify template image, 100%-traffic
  revision image, and worker images match the approved digest post-deploy per runbook.
- Worker image invariant: not affected (no worker job change).
- Feature/env flag update path: none — reuses existing `source_analytics`.
- Live signed-in proof required: yes, before claiming `live-proven`: as a
  `source_analytics`-enrolled tenant, create a fresh Source event whose value target is
  a percentage/bare-number phrase (e.g. "Target 15-20% run-cost reduction") and confirm
  the value-type-waterfall header shows the classified total with NO "Value at stake:
  $15" line and NO garbage "% of baseline"; then create one with "$4M savings" and
  confirm the baseline line and a real percentage render.

## Rollback Plan

Revert the squash commit. No migration to roll back and no data written by the deploy.
Note: `estimated_value_usd` is persisted per-event at creation, so events created
before the fix may still carry a bad stored baseline; the render-side guard in
`ValueWaterfall.tsx` suppresses the garbage header for those events regardless, and the
parse fix prevents new bad values. Worst case reverts to the pre-fix behavior.

## Audit Evidence

- PR URL: see the PR opened for branch `fix/source-value-at-stake-parse`.
- CI: release-check + jest + tsc as recorded in QA / Validation above.
- No deployment URL yet (candidate; not deployed by this record).

## Known Gaps

- Live signed-in browser proof for an enrolled tenant is not captured in this record
  (candidate status); it is required before `live-proven`.
- Events created before this fix may still carry a bad persisted `estimated_value_usd`;
  the render-side guard hides the garbage header for them, but a data backfill to null
  out impossible baselines is a separate follow-up, not in scope here.
