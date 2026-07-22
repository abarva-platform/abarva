# 2026-07-22-tower-cxo-ux-portfolio-legibility — AI Portfolio quadrant reads as a decision instrument

## Release ID

`2026-07-22-tower-cxo-ux-portfolio-legibility`

## Status

`candidate`

## Plain-English Summary

Second slice of the Tower CXO UX work. The AI Portfolio quadrant plotted every display row — 80 points for Meridian once AI use-case candidates were restored — which produced an unreadable cloud of overlapping labels. A CXO could not tell which bets mattered.

The quadrant is a capital-control instrument, not an inventory. It now plots only items that carry **real economics** (AI-tagged spend, approved funding, or promised value), ordered by economic weight so the largest bets read first, capped at 14 points for legibility. A candidate idea with no money attached has no defensible position on a value/readiness axis, so plotting hundreds of them was misleading as well as unreadable.

Nothing is silently truncated. A caption states exactly how many items are plotted and how many are not, and why — and every excluded row remains listed in the watchlist/candidate sections below. The existing numbered points, four-lane legend (scale with proof / fix / hold / stop), and funded-vs-partial-proof-vs-candidate grouping are unchanged.

## Layer Impact

- `global-control-lane`: `src/components/tower/TowerIndexPage.tsx` — presentation only. No data, query, or mart change; the same rows are still loaded and still listed.

## Client Applicability

- All clients: yes (Tower surface presentation).
- Feature flag: none.

## Changes Included

- `TowerIndexPage.tsx` — `TowerMartAiPortfolioDesign` computes `plottedRows` (economics-bearing, weight-ordered, capped at 14) and `unplottedCount`; the quadrant receives `plottedRows`; an honest scope caption discloses what is not plotted and why.

## QA / Validation

- Pass: `tsc --noEmit` — zero errors in `TowerIndexPage.tsx`.
- Pass: `jest src/components/tower src/lib/cio-tower` — 112/112 across 12 suites.
- Live signed-in visual verification pending this PR's deploy.

## Rollout Plan

Merge via squash to `main`; aca-main-deploy builds and deploys. Presentation-only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- ACA runtime invariant: unaffected.
- Live signed-in proof required: yes — confirm the quadrant renders a legible set with the scope caption, and the watchlist/candidate lists still carry every row.

## Rollback Plan

Revert the PR. Presentation-only; no data dependency.

## Audit Evidence

- Before: 80 plotted points with overlapping labels (captured in-session after candidates were restored).
- PR URL: pending.

## Known Gaps

- Remaining CXO UX slices: Decision Lanes as per-program executive cards (spend, owner, proof status, usage signal, next action) and Evidence/Gaps reframed as "what exists / what's missing / who provides it / which decisions are blocked".
