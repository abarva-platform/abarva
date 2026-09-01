# 2026-09-01-home-metric-distance — One more chart, and two the record cannot yet support

## Release ID

`2026-09-01-home-metric-distance`

## Status

`candidate`

## Plain-English Summary

A fifty-row measures table answers "what is this measure doing". It cannot answer "is this
enterprise near or far from its own targets", which is what a reader asks of a measure set before
any individual measure. That is a distribution, and a distribution is a shape a table cannot show.

This adds it. Two other charts from the design pass are named here as blocked, with what they need.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged.
- **Layer 4 / products:** one chart on the chapter that reasons from outcome measures.

## Client Applicability

- All clients whose served record carries measures with a baseline and a target.
- Feature flag: none. The chart renders nothing where fewer than three bands are occupied — two
  occupied bands is a list, and the table beside it says a list better.

## Changes Included

- `MetricDistance.tsx` (new) — the distribution, plus `buildMetricDistribution` as a pure function
  so the banding is testable without a render.
- `ChapterPage.tsx`, `HomeV4App.tsx` — rendered only where the chapter reasons from measures, the
  same test the renewal timeline uses.
- `__tests__/metric-distance.test.tsx` (new) — 6 test cases.

### Rows that cannot be placed are counted, not dropped

A measure missing a baseline or a target cannot be given a distance. Those are counted and stated
under the chart — _"5 of 7 measures declare both a baseline and a target and are placed above"_ —
because a distribution drawn only over the complete rows describes our collection rather than their
performance, and does so without saying it has.

### Drawn at a fixed size, deliberately

`ResponsiveContainer` measures its parent and renders nothing without a layout pass, so no test and
no static render can see the chart — it ships having never been observed drawing anything. That is
how the renewal timeline on this surface originally shipped blank past a green suite. A fixed viewBox
scaled with CSS gives up per-breakpoint tick density and buys a chart that can be asserted on.

The assertion is that **bars exist**, not that the section does. Mutation-tested by swapping the
fixed size back for `ResponsiveContainer`: the draws-bars case fails, and the five around it pass —
which is exactly how the original defect hid.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — **203/203**
- PASS `tsc --noEmit` · `npx eslint` 0 errors · `npx next build` compiled
- **Mutation-tested** as above

## Rollout Plan

Merge and deploy through the repo-owned workflow. No migration, no data-plane mutation.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert the commit. The chapter keeps its measures table unchanged.

## Audit Evidence

- Mutation-test result above.

## Known Gaps

The two charts not built:

Both passed the design test and neither can be drawn from what the serving path carries:

- **Segment share against estate share.** Needs the declared business-segment spine. That family is
  not in the serving path, so the comparison cannot be built. It is the strongest of the three: a
  mismatch between a segment's share of revenue and its share of the estate exists only in the
  relation between two families and no table shows it.
- **Run, change and transform as one bar.** Needs the spend family, also not in the serving path.

Both need the same work as the intake families before them — a page key, a serving view, and an
entry in the reader union — and the contract test added with that work will hold them to it.

A third was dropped on its merits rather than on data: budget against expected value across the
programme portfolio. Expected value has no realised counterpart anywhere in the record, and a
scatter of intent read as a scatter of performance would be the layout asserting something the
record does not carry.
