# 2026-07-22-tower-ai-chapter-population — AI portfolio chapters draw on the real population

## Release ID

`2026-07-22-tower-ai-chapter-population`

## Status

`candidate`

## Plain-English Summary

Found during live signed-in verification of the AI Portfolio chapters shipped in #5351.

On the live Meridian Tower the **Candidate pipeline** chapter showed **1 item** while the Command Center headlines **243 candidate AI opportunities**. Neither number was wrong on its own, but sitting a chapter called "Candidate pipeline" next to a headline of 243 and having it list one item is misleading.

**Root cause.** `buildAiPortfolioDisplayRows` ranked the AI portfolio by economic weight and hard-capped the result at the top 12, and every chapter filtered that already-capped set. Candidates carry no approved funding by definition, so they lose a ranking by economic weight almost every time — practically none of them survived into the top 12. The cap is correct for the value/readiness quadrant, which becomes unreadable past a dozen or so points, but it is not correct for a chapter whose whole job is to list a named population.

This cap pre-existed the chapter work. It was invisible when the section was a single list; splitting the section into named chapters is what turned it into a misleading claim. The fix belongs with the chapters.

**Fix.** The cap is now a parameter rather than a hardcoded slice. The component builds the full set once and derives two populations from it: the ranked top slice that the quadrant and the tool trace work from, and the complete set that every named chapter filters. Funded, Proof status, and Candidate pipeline now list what they actually contain.

The Candidate chapter also states the two figures explicitly instead of letting them be conflated: how many candidate items the AI portfolio carries, and how many candidate opportunities the command center counts across the whole mart, noting that the wider figure includes ideas not promoted into the portfolio. The rendered list is capped at 60 with the truncation stated.

## Layer Impact

- `global-control-lane`: `src/components/tower/TowerIndexPage.tsx` — presentation-layer population derivation within the Tower AI Portfolio. No data path, query, or schema change; no mart figure recomputed.

## Client Applicability

- All clients: yes (Tower surface presentation).
- Feature flag: none.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx` — `buildAiPortfolioDisplayRows` takes a `limit` parameter (default unchanged at 12); the AI portfolio component derives `allRows` (uncapped) for chapters and `displayRows` (top 12) for the quadrant and tool trace; candidate chapter states both candidate figures and discloses its render cap.

## QA / Validation

- Pass: `tsc --noEmit` — zero errors.
- Pass: `jest src/components/tower/__tests__/` — 19/19.
- Live signed-in verification of the corrected counts pending this PR's deploy.

## Rollout Plan

Squash-merge to `main`; `aca-main-deploy` builds the digest-pinned image and deploys. Presentation-only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- ACA runtime invariant: unaffected; verified before claiming live-proven.
- Live signed-in proof required: yes — confirm the Candidate pipeline count is the real candidate population and that both candidate figures are stated.

## Rollback Plan

Revert the PR. Presentation-only.

## Audit Evidence

- Before: live capture on revision `ca-abarva-web-lab-eastus--md5610a73` showing sub-tab counts Position 11 / Funded & embedded 11 / Proof status 3 / **Candidate pipeline 1** / Active tools 10, against a Command Center headline of 243 candidate AI opportunities.
- PR URL: pending.

## Known Gaps

- The two candidate figures are now explained rather than reconciled. Genuinely reconciling them means deciding which mart candidates should be promoted into `mart_ai_portfolio`, which is a projection decision, not a UI one, and belongs in the mart assembler.
