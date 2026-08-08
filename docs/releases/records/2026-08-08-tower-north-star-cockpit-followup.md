# 2026-08-08-tower-north-star-cockpit-followup — Tower North Star Cockpit Follow-Up

## Release ID

`2026-08-08-tower-north-star-cockpit-followup`

## Status

`candidate`

## Plain-English Summary

This release tightens the Tower Command Center into a clearer CFO operating room. It adds an aVa synthesis strip, makes source trust visible in the first-screen narrative, explains the portfolio decision matrix, fixes compact chart sizing, and clarifies heatmap labels when proof maturity is concentrated near zero.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Tower presentation changes only. The release changes how governed mart values are narrated and visualized; it does not introduce new facts, mutate tenant data, or change canonical calculations.

## Client Applicability

- All clients: Tower users receive the improved Command Center and Decision Lanes presentation.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Tower Command Center first-screen synthesis, lineage posture, and matrix explanation.
- Compact chart sizing for the outcome waterfall and portfolio decision matrix.
- Decision Lanes heatmap copy and axis labels that distinguish program-level promised value from portfolio totals.
- Focused component tests updated for the revised cockpit narrative.

## QA / Validation

- `node scripts/tower/fact-lineage-report.mjs` passed before quoting Tower figures.
- `npx eslint src/components/tower/command-center/views/CommandCenterView.tsx src/components/tower/command-center/views/DecisionLanesView.tsx src/components/tower/command-center/charts/PortfolioHeatmapChart.tsx src/components/tower/command-center/charts/OutcomeDecisionMatrixChart.tsx src/components/tower/command-center/charts/ValueWaterfallChart.tsx src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx` passed.
- `npm test -- --runTestsByPath src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/components/tower/command-center/__tests__/css-contract.test.ts src/components/tower/command-center/__tests__/render-harness.test.tsx` passed.
- Visual harness screenshots were generated under `/Users/anand/Downloads/tower-cxo-height-fix-2026-08-08/harness-northstar/`.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the shared web image. After deployment, verify the Tower route in a signed-in browser session.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow
- Approved image digest: assigned by the repo-owned deploy workflow
- ACA runtime invariant: verify template image and 100% traffic revision image match the deployed digest
- Worker image invariant: no worker image change expected
- Feature/env flag update path: none
- Live signed-in proof required: yes, Tower route visual proof after deployment

## Rollback Plan

Revert the merge commit or redeploy the previous known-good shared web image through the approved ACA deployment path. No data rollback is required.

## Audit Evidence

- Pull request URL after creation.
- Focused lint/test output from this branch.
- Visual harness screenshots in `/Users/anand/Downloads/tower-cxo-height-fix-2026-08-08/harness-northstar/`.
- ACA workflow run and signed-in Tower proof after deployment.

## Known Gaps

This release does not add new mart fields for action due windows, evidence package ids, or owner handoff readiness. Those remain data-model follow-ups.
