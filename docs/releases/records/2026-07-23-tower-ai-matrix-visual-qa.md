# 2026-07-23 Tower AI Matrix Visual QA

## Release ID

`2026-07-23-tower-ai-matrix-visual-qa`

## Status

`candidate`

## Plain-English Summary

The Tower AI Portfolio matrix rendered the correct governed counts after the reader-ordering fix, but it still failed visual QA: multiple initiatives could occupy the same or near-same value/readiness position, making the page say `10 on matrix` while only a few bubbles were visually distinguishable. This release keeps the Recharts/SVG implementation and adds deterministic display-only separation for colliding points.

The governed readiness and value scores are preserved as raw coordinates for evidence and text alternatives. Only the plotted SVG position receives a small bounded offset when bubbles would visually overlap. Constant-radius mode is also enlarged so unattributed-spend portfolios render as visible numbered decision points.

## Layer Impact

- Tower UI chart layer: improves the Recharts `ScatterChart` point layout for dense or repeated score clusters.
- Runtime data model: no data model, schema, or mart query change.
- Data plane: no mutation.

## Client Applicability

- All clients: yes, for tenants using the Tower Command Center AI Portfolio.
- Specific clients: observed on Healthcare Demo after AI portfolio rows became visible.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; `/tower` currently serves the Command Center.

## Changes Included

- `src/components/tower/command-center/charts/AiBubbleMatrixChart.tsx`
  - Adds deterministic visual collision spreading.
  - Enlarges constant-radius bubbles used when AI spend is portfolio-only.
- `src/components/tower/command-center/charts/__tests__/AiBubbleMatrixChart.test.ts`
  - Proves colliding points retain raw governed scores while receiving distinct rendered coordinates.

## QA / Validation

- `npx jest src/components/tower/command-center/charts/__tests__/AiBubbleMatrixChart.test.ts src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/lib/tower/command-center/__tests__/view-model.test.ts --runInBand`
  - Passed locally.
- `npx eslint src/components/tower/command-center/charts/AiBubbleMatrixChart.tsx src/components/tower/command-center/charts/__tests__/AiBubbleMatrixChart.test.ts`
  - Passed locally.
- Post-deploy signed-in visual proof is required before calling this visually resolved.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main workflow, verify the runtime invariant, then capture signed-in screenshots for the AI Portfolio overview/matrix views.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by ACA main deploy after merge.
- ACA runtime invariant: required after deployment.
- Worker image invariant: verify with the same invariant check.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR and deploy through ACA main. No data rollback is required.

## Audit Evidence

- User screenshot showed the visual failure despite count proof.
- Regression test: `src/components/tower/command-center/charts/__tests__/AiBubbleMatrixChart.test.ts`.
- Post-deploy screenshots to be captured after ACA deploy.

## Known Gaps

- Portfolio-only AI spend remains portfolio-only. This release improves the matrix visibility; it does not invent unsupported per-item spend attribution.
