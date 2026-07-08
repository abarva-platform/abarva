# 2026-07-07-source-baseline-credibility-guard — Value-waterfall baseline credibility guard (finish the #4555 fix)

## Release ID

`2026-07-07-source-baseline-credibility-guard`

## Status

`candidate`

## Plain-English Summary

A follow-up to PR #4555, driven by a defect found in live testing. #4555 added a
guard so the value-type-waterfall header hides the "Value at stake (event
estimate): $X" line and the "…% of baseline" fragment when the stored baseline
amount is `<= 0` — the case where a fresh event carries no real baseline.

That guard is incomplete. An event created **before** the parse fix can carry a
POSITIVE-but-garbage stored `estimated_value_usd` — e.g. `15`, mis-parsed from an
intake string like "15-20%". Because `15 > 0`, it slips through the old
`baselineAmount > 0` guard and the header still renders "Value at stake: $15" plus
a nonsense "305,654,347–436,649,067% of baseline" (a classified value of ~$46M–$65M
divided by a denominator of 15).

The fix is a **credibility** guard, not a blanket suppression. A legitimate
baseline can be smaller than the classified value — a seeded event shows a baseline
of $15,000,000 against $30M–$43M of classified value, i.e. "199–285% of baseline",
which is intended and must keep rendering. What is not credible is a baseline
orders of magnitude smaller than the value it is measured against.

A single shared predicate, `isCredibleBaseline(baselineAmount, classifiedTotalHigh)`,
now decides both render sites: a baseline is credible only when it is positive AND
`classifiedTotalHigh / baselineAmount <= MAX_VALUE_TO_BASELINE_RATIO` (50). The
seeded event's ratio (~2.9) passes; the bug's ratio (~4,300,000) fails and is
suppressed. When the baseline is not credible, the "Value at stake" line and the
"% of baseline" fragment are both omitted; the classified total and its "classified
value" label still render exactly as the `<= 0` path already does. No baseline is
ever fabricated or derived — the incredible one is only suppressed. No value-lever
math or the `extractEstimatedValue` parse was touched.

## Layer Impact

- `global-control-lane`: shared Source app behavior. A new pure predicate
  `isCredibleBaseline` + documented constant `MAX_VALUE_TO_BASELINE_RATIO` in
  `waterfall-view-adapter.ts`, applied at the two existing render sites (the
  `ValueWaterfall` header and the value-bridge headline builder) that previously
  keyed off `baselineAmount > 0`. Everything rides the existing `source_analytics`
  feature flag; un-enrolled tenants see no change. No schema, no data, no runtime
  image, no flag, no migration.

## Client Applicability

- All clients: no. Rides the `source_analytics` feature flag; inert for tenants
  without it.
- Specific clients: tenants enrolled in `source_analytics` (Lakeshore in lab) —
  specifically events created before the `extractEstimatedValue` parse fix that
  hold a positive-but-garbage stored baseline.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` (unchanged; this ships behind it).

## Changes Included

- `src/lib/source/facts/view/waterfall-view-adapter.ts` — new exported
  `MAX_VALUE_TO_BASELINE_RATIO = 50` (documented: no genuine "value at stake"
  estimate is 50×+ smaller than the classified value it is measured against) and
  new pure predicate `isCredibleBaseline(baselineAmount, classifiedTotalHigh)`.
- `src/components/source/canvas/analytics/ValueWaterfall.tsx` — the `hasBaseline`
  guard (added by #4555) now calls `isCredibleBaseline(baselineAmount, totalHigh)`
  instead of `baselineAmount > 0`; an incredible baseline suppresses both the
  "Value at stake" line and the "% of baseline" fragment while keeping the
  classified total + "classified value" label.
- `src/lib/source/facts/view/step-insight-builder.ts` — the value-bridge headline's
  `pctFrag` (previously guarded by `baselineAmount > 0`) now uses the same
  `isCredibleBaseline(baselineAmount, totalHigh)` check, so the headline's
  "…% of baseline" fragment is omitted for an incredible baseline.
- Tests: `ValueWaterfall.honesty.test.tsx` — added a credible-baseline case
  (ratio ~2.9: baseline $15M vs $30M–$43M → line + "% of baseline" both render) and
  an incredible-baseline case (baseline $15 vs ~$65M → both suppressed, classified
  total still renders); the existing `baselineAmount: 0` case is unchanged.
  `step-insight-builder.test.ts` — added credible / incredible / zero baseline
  cases against `buildValueBridgeInsight`'s headline `% of baseline` fragment.

## QA / Validation

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — ran
  to completion under a tracked background process (non-empty 167-line log, 131
  pre-existing `error TS` lines matching the main baseline). **Net-new = 0**:
  grepping the error log for every file changed on this branch
  (`waterfall-view-adapter.ts`, `step-insight-builder.ts`, `ValueWaterfall.tsx`,
  `ValueWaterfall.honesty.test.tsx`, `step-insight-builder.test.ts`) returns no
  matches. **Status: pass.**
- `npx eslint` on all changed files — clean, no warnings or errors. **Status: pass.**
- `npx jest` on `ValueWaterfall.honesty.test.tsx` and `step-insight-builder.test.ts`
  — 50 tests, all green (includes the three new baseline-credibility cases per
  suite). **Status: pass.**
- `node scripts/release-check.mjs --base origin/main --head HEAD` — **Status: pass.**

## Rollout Plan

Merge to `main` via squash. No DB migration, no traffic shift, no runtime image
change, no flag change — the fix rides the existing `source_analytics` flag. No
deploy is performed by this change. The fix becomes active for enrolled tenants
when the next `main` image rolls through the standard repo-owned deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged;
  not invoked by this PR).
- Shared runtime mutators: none. This PR does not mutate shared web traffic,
  revision weights, env vars, or the web Container App template.
- Approved image digest: n/a (no runtime image change in this PR).
- ACA runtime invariant: unaffected — no image or template mutation.
- Worker image invariant: unaffected — no worker job change.
- Feature/env flag update path: none — reuses the existing `source_analytics` flag.
- Live signed-in proof required: yes, before claiming `live-proven` — a signed-in
  Lakeshore view of a pre-fix event whose header previously printed
  "Value at stake: $15" now suppresses the line and the "% of baseline" fragment
  while keeping the classified total. Not claimed in this record.

## Rollback Plan

Revert the PR. There is no schema or data change — reverting the app code alone
fully restores the prior (incomplete) `baselineAmount > 0` behavior with no data
cleanup. The change is a pure render-guard refinement.

## Audit Evidence

- PR URL: see the branch `fix/source-baseline-credibility-guard` PR on
  `abarva-platform/abarva`.
- Prior fix: PR #4555 (added the `baselineAmount <= 0` guard this completes).
- tsc / eslint / jest output captured in the PR description and this record's QA
  section.

## Known Gaps

- This suppresses an incredible stored baseline at render time; it does not
  back-fill or correct the garbage `estimated_value_usd` values persisted on
  pre-parse-fix events. A separate data-repair pass (or re-derive from the corrected
  parse) would be needed to give those events a credible baseline rather than none.
- Live signed-in Lakeshore proof is pending — this record is `candidate`, not
  `live-proven`.
