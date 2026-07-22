# 2026-07-22-tower-lanes-evidence-chapters — Decision Lanes and Evidence told in chapters

## Release ID

`2026-07-22-tower-lanes-evidence-chapters`

## Status

`candidate`

## Plain-English Summary

Second slice of the Tower chaptering work. The AI Opportunity Portfolio was restructured in the previous slice; this applies the same reusable `TowerSubTabs` pattern to the two remaining long-scroll analyses.

1. **Decision Lanes** now opens on the four-lane board (**All lanes**) and offers **Fund**, **Fix**, **Freeze**, and **Stop** as chapters. This fixes a real reachability problem, not just density: the board renders at most four cards per lane because four narrow columns cannot carry a dozen programs legibly, and the remainder were labelled "+N more in this lane" with **no way to open them**. On Meridian the Freeze lane holds 7 programs and only 4 were reachable. That label is now a button that opens the lane's own chapter, where every program in the lane renders full-width.

   The program card was extracted into a shared `TowerLaneCard`, so the compact board and the full-width chapter render the same anatomy — money, owner, proof status, usage signal, next action — rather than drifting into two versions of the truth.

2. **Evidence** now opens on **Posture** (what exists / what is missing / who must provide it / what stays blocked) and offers **What is missing** and **Full trace** as chapters. Previously a CXO had to scroll past a 267-row lineage table to reach the gap list. The audit table is not removed or hidden — it is one click away, which is the correct weighting for a surface whose first job is to say what is known and what is not.

   The "no gaps" case now states the result plainly rather than rendering nothing.

No data, query, or mart logic changed. Every figure still comes from `cio_tower.mart_*`.

## Layer Impact

- `global-control-lane`: `src/components/tower/TowerIndexPage.tsx` — presentation only within the Tower surface. No data path, query, or schema change.

## Client Applicability

- All clients: yes (Tower surface presentation).
- Feature flag: none.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx` — new `TowerLaneCard` (shared by board and lane chapters), `TOWER_DECISION_LANES` hoisted to a module constant, `TowerMartDecisionLanesDesign` restructured into board + four lane chapters with the "+N more" label promoted to a working button, `TowerMartEvidenceDesign` restructured into posture / gaps / trace chapters with an honest empty state.
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx` — coverage for both new navigations, asserting the chapter intro changes and that each chapter renders its own population.

## QA / Validation

- Pass: `tsc --noEmit` — zero errors.
- Pass: `jest src/components/tower/__tests__/` — 19/19 including the new Decision Lanes and Evidence chapter assertions.
- Live signed-in verification on Meridian Tower pending this PR's deploy.

## Rollout Plan

Squash-merge to `main`; `aca-main-deploy` builds the digest-pinned image and deploys. Presentation-only; no migration, no job, no data change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- ACA runtime invariant: unaffected by this change; still verified before claiming live-proven.
- Live signed-in proof required: yes — confirm the Freeze lane's 7 programs are all reachable through its chapter, and that Evidence opens on posture rather than the lineage table.

## Rollback Plan

Revert the PR. Presentation-only; nothing else depends on the new components.

## Audit Evidence

- Before: live signed-in capture of the current revision showing Decision Lanes with Freeze at 7 and only 4 cards rendered behind an inert "+3 more in this lane" label; captured in-session.
- PR URL: pending.

## Known Gaps

- Value Proof Funnel and Recommended Actions are deliberately left as single views. A five-stage funnel and a three-action list are already short enough that chaptering them would add navigation without adding clarity.
- Usage/adoption signal remains genuinely absent: `tower_*` operational telemetry is empty for every tenant because the ingest connectors have never run. Lane cards continue to report "usage not loaded" rather than implying zero adoption.
