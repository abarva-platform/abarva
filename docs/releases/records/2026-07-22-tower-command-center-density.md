# 2026-07-22-tower-command-center-density — Command Center fits one screen, measured not estimated

## Release ID

`2026-07-22-tower-command-center-density`

## Status

`candidate`

## Plain-English Summary

Follow-up to the Command Center work in #5356, which reduced spacing by an estimated ~130px but was never measured. It has now been measured on the live signed-in page, and the estimate was badly short: at a 1600x900 viewport the page still ran **1335px against 900px of viewport — 435px over**.

Rather than keep guessing, each block on the live page was measured, and candidate fixes were simulated against the live DOM before any code was written. That found the real cause, which was structural rather than cosmetic:

**The four metric cards beside the budget chart were stacked in a narrow column 509px tall, next to a budget card only 250px tall — 259px of empty column, and the single largest reason the page did not fit.** Spacing trims alone only reached 1197px (still 297 over); laying those four cards out two-by-two in a wider column is what actually closed the gap.

Changes, each sized against a measurement:

- metric column laid out 2x2 in a wider column (biggest single win)
- budget chart lost its built-in legend, which duplicated the labelled Run/Change row directly beneath it, and the plot area was tightened
- hero title reduced from 52px to 38px
- board card padding 24 -> 18; compact metric cards tightened
- dead page padding at the foot of the page reduced from 96px to 28px
- footer step nav margins tightened

**Measured result: 1335px -> 993px.** That fits a standard 1080p browser window (viewport ~985px) without scrolling. At an exactly 900px viewport it is ~93px over — stated honestly rather than claimed as a fit.

No data, query, or mart logic changed.

## Layer Impact

- `global-control-lane`: `src/components/tower/TowerIndexPage.tsx` — presentation only. No data path, query, or schema change.

## Client Applicability

- All clients: yes (Tower surface presentation).
- Feature flag: none.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx` — Command Center metric column laid out 2x2 in a rebalanced grid; budget chart legend removed and plot tightened; hero title, verdict card, board card padding, compact card, page padding, and footer nav margins reduced.

## QA / Validation

- Pass: `tsc --noEmit` — zero errors.
- Pass: `jest src/components/tower/__tests__/` — 19/19.
- **Measured on the live signed-in page** (Meridian, Playwright storage state, 1600x900): before 1335px, simulated after 993px. Post-deploy re-measurement required to confirm the built page matches the simulation.

## Rollout Plan

Squash-merge to `main`; `aca-main-deploy` builds the digest-pinned image and deploys. Presentation-only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- ACA runtime invariant: unaffected; verified before claiming live-proven.
- Live signed-in proof required: yes — re-measure `scrollHeight` against `innerHeight` and capture the page.

## Rollback Plan

Revert the PR. Presentation-only.

## Audit Evidence

- Live measurement on revision `md5610a73`: `scrollHeight=1335`, `innerHeight=900`, per-block heights captured, and the money-section columns measured at `[250, 509]` which identified the structural cause.

## Known Gaps

- A 900px viewport is still ~93px short of a full fit. Closing that last stretch means removing content from step 1, not spacing, and should be a deliberate product decision rather than a silent trim.
