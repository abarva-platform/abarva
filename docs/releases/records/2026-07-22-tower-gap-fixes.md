# 2026-07-22-tower-gap-fixes — Reachability, dead code, and the last 73px

## Release ID

`2026-07-22-tower-gap-fixes`

## Status

`candidate`

## Plain-English Summary

A deliberate gap audit of the Tower chaptering and density work (#5351, #5352, #5356, #5357, #5360) found four issues, two of them real defects introduced by that work.

1. **A reachability hole in the AI Portfolio — the same class of bug already fixed for Decision Lanes.** The chapters filter on money, proof, and candidate flags. Nothing guaranteed those three filters covered the set, so an item carried in the portfolio with no approved or embedded spend, no usage or finance signal, and no candidate flag appeared in **no chapter at all**. Coverage is now computed explicitly and the remainder is surfaced under "Other portfolio items", labelled for what it is rather than mislabelled as candidates.

2. **The quadrant scope caption made a false claim.** After the population fix in #5357, the unplotted count is taken from the full portfolio, but the caption still told the reader those items were "held in the Candidate pipeline chapter". Not all of them are candidates. The wording now says they are listed in the other chapters.

3. **The last 73px of the fold was structural, not density.** The page measured _exactly_ 73px over at every viewport size tested (1440x900, 1600x985, 1920x1055, 1600x900) — a constant overflow, which is the signature of a fixed layout cost rather than too much content. The cause was a footer block carrying back/forward buttons that did exactly what the segmented control at the top of the page already does. The duplicated navigation is removed; the one thing it uniquely offered — the hand-off out of the command center to Recommended Actions — is kept, on the final step where it belongs.

4. **Dead code left by the density pass.** The `Legend` import survived the removal of the budget chart legend, and the two footer ghost-button styles survived the footer removal. Both removed; the file introduces no new lint warnings against baseline.

## Layer Impact

- `global-control-lane`: `src/components/tower/TowerIndexPage.tsx` — presentation only. No data path, query, or schema change.

## Client Applicability

- All clients: yes (Tower surface presentation).
- Feature flag: none.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx` — explicit chapter-coverage computation with an "Other portfolio items" block; corrected quadrant scope caption; duplicated footer step navigation removed with the Recommended Actions hand-off retained on step 3; dead `Legend` import and dead ghost-button styles removed.

## QA / Validation

- Pass: `tsc --noEmit` — zero errors.
- Pass: `jest src/components/tower/__tests__/` — 19/19.
- Pass: `eslint` — 0 errors, and a diff against the pre-change baseline shows **no new named warnings**.
- Measured on the deployed build before this change (revision `m6b4f1777`, Playwright storage state): content 973px against a 900px viewport, and 73px over at every viewport size tested — the measurement that identified the footer as a fixed cost rather than a density problem.

## Rollout Plan

Squash-merge to `main`; `aca-main-deploy` builds the digest-pinned image and deploys. Presentation-only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- ACA runtime invariant: unaffected; verified before claiming live-proven.
- Live signed-in proof required: yes — re-measure the fold and confirm no portfolio item is unreachable.

## Rollback Plan

Revert the PR. Presentation-only.

## Audit Evidence

- Deployed-build measurements on `m6b4f1777`: `scrollHeight=973 / innerHeight=900`; constant 73px overflow across four viewport sizes; `martOffsetTop=73`, `martHeight=851`.
- Verified live on `m6b4f1777`: AI chapters `Position 11 | Funded & embedded 11 | Proof status 3 | Candidate pipeline 33 | Active tools 10` (candidate count corrected from 1 by #5357), lane chapters `All 12 | Fund 4 | Fix 1 | Freeze 7 | Stop 0` with all 7 Freeze cards rendering, and a banned-copy sweep returning none.

## Known Gaps

- The sub-tab controls expose `tablist`/`tab`/`aria-selected` but the panels they switch do not carry matching `tabpanel` roles or `aria-controls` wiring. Screen-reader navigation is therefore usable but not ideal. Worth a dedicated accessibility pass across all four chaptered sections rather than a partial fix here.
