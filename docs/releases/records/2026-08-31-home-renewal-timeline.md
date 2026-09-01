# 2026-08-31-home-renewal-timeline — When the renewal decisions arrive

## Release ID

`2026-08-31-home-renewal-timeline`

## Status

`candidate`

## Plain-English Summary

The contracts table already reports how many agreements end in each year. What it cannot show is the
shape: that a stretch of term ends is already behind the record, and that the decisions ahead arrive
in a wall rather than evenly. Clustering is a property of a time axis, not of rows.

This adds that one chart. It is the only place on these surfaces where a chart does something the
table beside it cannot.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 3 / canonical model:** unchanged.
- **Layer 4 / products:** one chart on the chapter that reads vendor rows.

## Client Applicability

- All clients: yes, wherever the bundle carries contract rows with a term end
- Feature flag: none

## Changes Included

- `src/components/home/v4/RenewalTimeline.tsx` (new) — buckets contracts by term-end year, split by
  whether renewal needs a decision, with years behind the record marked.
- `src/components/home/v4/ChapterPage.tsx`, `HomeV4App.tsx` — render it where contract rows exist.
- 8 test cases.

### Two silent failures found by looking

Built initially with a responsive container, it rendered **zero SVG** — that component measures its
parent in the browser and draws nothing without a layout pass. Seven tests passed: they covered the
header, the legend and the caption, which is everything except the chart.

Redrawn at a fixed size, the axes appeared and the bars did not, because the bar series animates in
on mount and nothing triggers that in a static render.

Both failures leave a chart that looks deliberate — labelled axes, a legend, a caption — with an
empty plot, and a green suite either way. The chart is now drawn at a fixed size with animation off,
and a test asserts that bars exist rather than only that the section does.

That trade is deliberate: per-breakpoint tick density for a chart that can be rendered,
screenshotted and asserted on. On a governed surface that is the right way round, and an animated
mount was decoration on a page read for decisions.

### Time is measured against the record

A year is marked as behind using the bundle's own `generated_at`, never the clock. A chart whose
meaning changes with the day it is opened is not reproducible, and without an as-of date nothing is
marked rather than a reference point being guessed.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — 103/103, twelve suites
- PASS `tsc --noEmit -p tsconfig.json` · `npx eslint` (0 errors)
- Rendered against the live snapshot and inspected in a browser

### What it shows

```
2022 ▮  2023 ▮  2024 ▮  2025 ▮▮      already behind the record
2026 ████████████████  16            the wall
2027 ███████████ 11 · 2028 ████████████ 12 · 2029 █████████ 9
```

Sixteen term ends already passed, and sixteen more arriving in one year against notice periods of
thirty to ninety days.

## Rollout Plan

Merge to main. No migration, no data-plane mutation, no traffic change.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none in this change
- ACA runtime invariant: not affected
- Worker image invariant: not affected
- Feature/env flag update path: none
- Live signed-in proof required: yes, before this is called live-proven

## Rollback Plan

Revert the commit. The chart disappears; the table beside it is unaffected.

## Audit Evidence

- Test output including the assertion that bars are drawn, not only the section.

## Known Gaps

- **Two of the three designed charts remain unbuilt** — segment gap and cost concentration. The
  segment spine is not carried in the Home bundle, so that one needs a data change rather than a
  component.
- Verified by component render in a browser; a signed-in product proof is still owed.
