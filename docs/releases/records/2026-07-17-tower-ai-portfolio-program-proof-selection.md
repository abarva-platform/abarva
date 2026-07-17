# 2026-07-17-tower-ai-portfolio-program-proof-selection — Tower AI Portfolio Program Proof Selection

## Release ID

`2026-07-17-tower-ai-portfolio-program-proof-selection`

## Status

`candidate`

## Plain-English Summary

Tower's AI Portfolio canvas now tells the investment-control story instead of
only showing candidate AI inventory. It composes the portfolio exhibit from both
candidate AI rows and AI-related program decision lanes, so approved or embedded
AI programs with usage and finance-validation evidence, such as Copilot or
ServiceNow AI, remain visible even when candidate opportunity rows dominate the
AI portfolio mart table.

## Layer Impact

- `global-control-lane`: shared Tower UI behavior changes for the command-center
  mart view.
- Product UI layer: the Tower AI Portfolio section reads existing mart
  view-model fields and changes how they are selected for display.
- Data layer: no schema change, no data load, no production write, no candidate
  promotion, and no Active Tenant Access update.

## Client Applicability

- All clients: Tower tenants using the command-center mart receive the safer
  portfolio composition.
- Specific clients: Healthcare Demo is the live proof target because it exposed
  the defect.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`: AI Portfolio now joins
  `model.aiPortfolio` with AI-related `model.programLanes` before ranking and
  rendering the executive watchlist.
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`: regression
  test now simulates the live failure where candidate rows fill the AI portfolio
  table and Copilot exists only in program lanes.
- `src/lib/tower/portfolio-sequence-view.ts`: replaces one stale control-plane
  default display label with the current Healthcare Demo cover name to keep the
  tenant-purity gate from regressing.
- `docs/releases/records/2026-07-17-tower-ai-portfolio-program-proof-selection.md`:
  release record.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand`
- PASS: `npx eslint src/components/tower/TowerIndexPage.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`
  - Result: 0 errors, existing Tower unused-code warnings remain.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `git diff --check`
- PASS: `npm run audit:control-plane-purity:check`
- PASS: `npm run release:check`
- PENDING: signed-in Healthcare Demo Tower browser proof after ACA deployment.

## Rollout Plan

Merge through the protected PR lane. The change becomes active only after the
repo-owned ACA main deploy workflow builds and deploys the merged main SHA, the
new revision receives 100% traffic, and signed-in Tower proof passes.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: not used.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, Healthcare Demo Tower AI Portfolio and
  Value Proof Funnel.

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy workflow. Tower will
return to rendering AI Portfolio rows directly from the `mart_ai_portfolio`
slice only.

## Audit Evidence

Before this release, signed-in proof showed Copilot and ServiceNow in the Value
Proof Funnel while the AI Portfolio canvas showed only candidate/proof-gap rows.
This release adds a regression that fails if funded/proof-bearing AI program rows
are not included in the AI Portfolio watchlist. Final audit evidence will include
the PR, validation logs, ACA revision/digest, runtime invariant, and signed-in
browser screenshots after deployment.

## Known Gaps

- The Tower data mart still needs broader product work to turn every page into a
  fully polished CXO command center. This release only fixes the AI Portfolio
  row-selection story.
