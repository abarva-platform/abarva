# 2026-08-09-tower-boardroom-presentation-hardening — Tower Boardroom Presentation Hardening

## Release ID

`2026-08-09-tower-boardroom-presentation-hardening`

## Status

`candidate`

## Plain-English Summary

Tower's governed value model remains unchanged, but the board-facing presentation is hardened so the page no longer turns source gaps, dense inventories, or low-variance chart distributions into confusing executive visuals. The release makes missing or partial attribution explicit, keeps action inventory behind an executive campaign summary, separates explicit benefit from Finance-calculated blocked value, and makes source-authority work visible as a proof plan.

## Layer Impact

- `global-control-lane`: Updates the shared Tower command-center UI, chart rendering behavior, aVa prompt copy, and tab/accessibility labels.
- Products layer: Tower presentation changes only. Values continue to come from governed Tower read models and presentation view-model derivations.
- Canonical model: No change.
- Source adapters: No change.
- Client intake: No change.

## Client Applicability

- All clients: Tower users who can access the shared Tower route after the release is deployed.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None introduced.

## Changes Included

- Tower header becomes a compact `AI value posture` executive composition with a scope/value rail.
- AI Spend Attribution now renders chartable positive rows, attributed/unattributed completeness, or an explicit source-state panel instead of an empty chart area.
- Recommended Actions defaults to grouped executive proof campaigns and keeps the action inventory behind an expansion control.
- Decision Lanes defaults to ranked decision lanes when proof maturity is compressed and limits heatmap labels to the most material cases.
- AI Portfolio bubble labels are limited to top/selected-style labels so clustered marks do not all print centered labels.
- Value Proof labels separate explicit benefit claim-chain value from Finance-calculated value awaiting proof completion.
- Evidence now surfaces one-source facts as an action workplan showing current authority, second source needed, owner, and blocked decision.
- aVa removes hardcoded proof-gap counts from the default Tower prompt.

## QA / Validation

- `npx eslint src/components/tower/command-center/TowerCommandCenter.tsx src/components/tower/command-center/TowerCommandCenterAvaShell.tsx src/components/tower/command-center/views/AiPortfolioView.tsx src/components/tower/command-center/views/DecisionLanesView.tsx src/components/tower/command-center/views/RecommendedActionsView.tsx src/components/tower/command-center/views/ValueProofView.tsx src/components/tower/command-center/views/EvidenceView.tsx src/components/tower/command-center/charts/AiBubbleMatrixChart.tsx src/components/tower/command-center/charts/AiSpendLensChart.tsx src/components/tower/command-center/charts/PortfolioHeatmapChart.tsx src/lib/tower/command-center/view-model.ts src/lib/tower/command-center/types.ts src/lib/tower/command-center/__fixtures__/design-fixture.ts` — passed.
- `npm test -- --runTestsByPath src/lib/tower/command-center/__tests__/view-model.test.ts src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/components/tower/command-center/__tests__/TowerCommandCenterAvaShell.test.tsx src/components/tower/command-center/__tests__/css-contract.test.ts src/components/tower/command-center/charts/__tests__/AiBubbleMatrixChart.test.ts` — 71 passed.
- `TCC_HARNESS_OUT=/Users/anand/Downloads/tower-boardroom-hardening-harness-2026-08-09-v3 npx jest --runTestsByPath src/components/tower/command-center/__tests__/render-harness.test.tsx` — 2 passed.
- Browser visual harness with real React, Recharts, CSS modules, and fixture data at 1280x800, 1440x900, and 1792x1120 — all semantic visual gates passed: H1 line count, Recharts render, nonzero spend with no blank chart, spend completeness, bounded action default, one-source Evidence workplan, first analytic visibility, zero page errors, zero Recharts warnings.
- `git diff --check` — passed.

## Rollout Plan

Merge through the normal repository path. The repo-owned Azure Container Apps main deploy workflow must build and deploy the resulting main revision. After deployment, run signed-in browser proof against the shared Tower route for affected tenants before calling the presentation board-ready.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime.
- Shared runtime mutators: None in this release branch.
- Approved image digest: To be produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required before live-ready claim.
- Worker image invariant: No worker change expected; verify if deploy workflow updates worker images.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, against the shared Tower route after deploy.

## Rollback Plan

Rollback by reverting the UI release commit and redeploying through the repo-owned Azure Container Apps main deploy workflow. No schema, data, or source-adapter rollback is required.

## Audit Evidence

- Static render harness: `/Users/anand/Downloads/tower-boardroom-hardening-harness-2026-08-09-v3`
- Browser visual proof: `/Users/anand/Downloads/tower-boardroom-browser-proof-2026-08-09-v4`
- Browser proof report: `/Users/anand/Downloads/tower-boardroom-browser-proof-2026-08-09-v4/tower-browser-visual-proof-semantic.md`
- Browser proof JSON: `/Users/anand/Downloads/tower-boardroom-browser-proof-2026-08-09-v4/tower-browser-visual-proof-semantic.json`

## Known Gaps

Live signed-in shared-route proof is still required after the normal deploy path. This release does not add PDF or HTML export behavior; it prevents the default board view from exporting the full action inventory by default.
