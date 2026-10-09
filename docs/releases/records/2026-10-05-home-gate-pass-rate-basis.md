# 2026-10-05-home-gate-pass-rate-basis — Home: the gate-pass-rate figure states the set it counts

## Release ID

`2026-10-05-home-gate-pass-rate-basis`

## Status

Proposed — opened as a pull request against `main`.

## Plain-English Summary

The reasoning row on Home carries a stat tile reading **Gate pass rate**, with a
percentage and the sub-label `avg across all instances`. That sub-label made
three claims the number does not support.

1. **It is not an average.** The number is a single pooled ratio — all cleared
   criteria over all evaluated criteria. An average of per-instance rates would
   weight a two-gate instance the same as a twenty-gate one; the pooled ratio
   does not. The two differ on ordinary data.
2. **It does not cover all of an instance.** Each instance contributes only the
   criteria of the stage it is currently in, because the synthesis context is
   built by evaluating the current stage rather than every stage. So a figure
   that said "across all instances" summarised a slice of each one.
3. **A gate cleared by waiver is inside the numerator.** That is correct for the
   question the underlying count answers — *can this advance?* — but it is not
   the same as *this was established*, and a tile labelled "pass rate" invites
   the second reading.

This change leaves the number alone and replaces the sub-label with a
description derived from the same counts, so the figure names its own set:
`57 of 79 current-stage gates cleared · 12 instances`. The stale doc comment on
the payload field, which also called the value an average, is corrected to say
pooled.

Deliberately **not** changed: the upstream `gatesSummary.met`, which counts
met-or-waived. Two other readers — the instance health board and the portfolio
heatmap — ask whether an instance can advance, and for that question a waiver
does clear a gate. Conflating the two questions in one number was the defect;
the fix is to let the surface state which question its number answers, not to
redefine a count three surfaces share.

## Layer Impact

Lane: `global-control-lane` — shared product copy and a widened read-model
payload, applying to every client, not gated by a feature flag.

Layer 4 (Products) only. Home renders a figure it already received; the
derivation module and the widened summary field are read-model concerns. No
layer-1 intake, no layer-2 adapter, no layer-3 canonical object, and no schema,
migration, or tenant-scoped data is touched. The figure is computed from the
demo fixture corpus that already backs this row.

## Client Applicability

All clients, on the Home reasoning row. The change is copy and a derived
description; no client sees a different percentage than before. Nothing is
enabled or disabled per tenant.

## Changes Included

- **`src/lib/reasoning/gate-pass-rate-basis.ts`** (new) — the pure derivation:
  `gatePassRatePct` (returns `null` rather than a percentage over an empty or
  negative denominator), `describeGatePassRateBasis` (the one-line statement of
  the set), and the waiver caveat constant. Documents why the count is
  current-stage-scoped and waiver-inclusive.
- **`src/lib/reasoning/dashboard-summary.ts`** — carries a `gatePassRate` basis
  (cleared / evaluated / contributing instances) beside the existing
  percentage, counts the instances that contributed a denominator, and corrects
  the field's doc comment from "Average" to pooled. The percentage itself is
  computed exactly as before.
- **`src/components/home/HomeIndexPage.tsx`** — the tile's `detail` now comes
  from `describeGatePassRateBasis` instead of the literal `avg across all
  instances`. Label, value, and colour thresholds are unchanged.
- **`src/lib/reasoning/__tests__/gate-pass-rate-basis.test.ts`** (new) — 13
  tests.

No new feature flag. No new catalog entry and no census refresh are required:
`src/lib/reasoning/__tests__` is swept wholesale by the required check
`Typecheck + reasoning-layer tests`, which runs the directory with no path
filter.

## QA / Validation

- `npx jest src/lib/reasoning/__tests__/gate-pass-rate-basis.test.ts` — **PASS**,
  13 of 13.
- `npx jest src/lib/reasoning` (the whole directory the required check sweeps) —
  **PASS**, 59 suites / 773 tests. Run in full rather than only the new suite,
  because the summary payload was widened and other readers import it.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` —
  **PASS**, exit code 0.
- `npx eslint` on the four changed files — **PASS**, exit code 0.
- **Mutation check of the new guards — PASS.** Three mutations, three deaths:
  dropping the `current-stage` qualifier from the description killed 3 tests;
  returning `0` instead of `null` on an empty denominator killed 2; describing
  the empty set as `0 of 0` instead of refusing killed 1. The restored baseline
  returned to 13 of 13, which is what says the harness was running.
- Rendered-width and signed-in verification — **NOT RUN**. See Known Gaps.

## Rollout Plan

Merges to `main` and ships on the next ordinary deploy of the shared web
runtime through the repo-owned Container Apps main deploy workflow. No flag to
flip, no data build, no migration, no ordering constraint against any other
release.

## Rollback Plan

Revert the single commit. The percentage is computed from the same inputs
before and after, so a revert restores the old sub-label and changes no number.
The new module has one consumer and the widened payload field one reader, so a
revert leaves nothing orphaned.

## Deployment Authority

No deployment is performed by this change. Shared Product/Lab web traffic is
shifted only by `.github/workflows/aca-main-deploy.yml`. No ad-hoc Azure
command, no revision weight change, no container app template mutation, and no
registry build were run from this branch.

## Known Gaps

- **The component's sub-label is not itself pinned by a test.** The guard that
  the word "average" cannot return protects the derivation module's output, not
  the prop passed in `HomeIndexPage`. A revert of just the component line would
  reintroduce the false claim without reddening a suite. Covering it needs a
  render test for that tile, which this slice does not add.
- **The waiver caveat is exported but not yet surfaced.** The tile states the
  set and the stage scope; it does not yet tell the reader that a waived gate
  sits in the numerator. That is a second line of copy on a dense stat tile and
  deserves its own design pass.
- **`waived` is construction-only today.** The evaluator reaches that status
  only from an evidence map carrying a per-criterion waiver sentinel, and the
  operated waiver route keeps a separate in-memory store that does not feed that
  map. So the waiver half of this correction is defensive: it is right about
  what the count means, and no live instance currently exercises it.
- **The instance health board and the portfolio heatmap still read the
  met-or-waived count without stating it.** Left deliberately: both ask whether
  an instance can advance, where the count is correct. The heatmap's percentage
  is additionally rendered inside the current-phase cell, so it is positionally
  scoped already.
- **The shape-only fallback context reports a denominator of 1.** When no
  lifecycle pattern resolves for an instance, the context is built with
  `total: 1` and a single boolean numerator, so a surface can render `0%` or
  `100%` with the same authority as a real ratio. Not addressed here; it is a
  builder-level concern, not a copy one.
- No signed-in walk of the Home reasoning row was performed for this change, so
  it is **not** live-proven.

## Audit Evidence

- The defect is visible in the diff itself: the removed literal
  `avg across all instances` sat directly above a value computed as
  `Math.round((totalMet / totalGates) * 100)`, a pooled ratio.
- `program-synthesis-context-builder.ts` line 176 evaluates the current stage
  only (`evaluateStage(stageId, evidenceMap)`), and line 179 counts
  `status === 'met' || status === 'waived'`. Those two lines are the whole basis
  of the claim corrected here.
- Mutation results above are the evidence that the new tests constrain the
  described behaviour rather than merely executing it.
