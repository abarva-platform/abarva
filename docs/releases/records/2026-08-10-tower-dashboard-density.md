# 2026-08-10-tower-dashboard-density — Tower Dashboard Density

## Release ID

`2026-08-10-tower-dashboard-density`

## Status

`candidate`

## Plain-English Summary

This release removes always-visible explanatory bands from the Tower cockpit so dashboards and operating queues appear before supporting narrative. It keeps the same governed values, source states, chart data, tabs, and evidence model, but makes the default executive experience denser: short header chips, compact AI controls, collapsed source-authority detail, and no full-width North Star strips blocking the first analytical panel.

## Layer Impact

- Release lane: `global-control-lane`.
- Products layer: Updates Tower command-center presentation, spacing, labels, and default disclosure behavior.
- Canonical model: No change.
- Source adapters: No change.
- Client intake: No change.
- Cube/read model: No change.

## Client Applicability

- All clients: Applies to tenants using the shared Tower route after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None introduced.

## Changes Included

- Tower header scope chips use compact visible labels while retaining descriptive `aria-label` and `title` text.
- AI Portfolio removes the always-visible North Star and warning strips from the page flow.
- AI Portfolio search, filters, population counts, and the usage-value guardrail collapse into one compact control row.
- AI Portfolio hides search and type filters on views where those controls do not apply.
- Evidence removes the always-visible North Star strip and collapses the source-authority workplan by default.
- Value Proof, Decision Lanes, and Recommended Actions remove full-width explanatory strips above the dashboards.
- Tower spacing, tab padding, body gaps, and panel margins are tightened so the first analytical panel appears higher in the viewport.
- Command Center compresses the board-posture card, read-model scope band, and first chart row so the conversion and trajectory dashboards appear in the initial viewport.

## QA / Validation

- `npx eslint src/components/tower/command-center/TowerCommandCenter.tsx src/components/tower/command-center/views/AiPortfolioView.tsx src/components/tower/command-center/views/EvidenceView.tsx src/components/tower/command-center/views/ValueProofView.tsx src/components/tower/command-center/views/DecisionLanesView.tsx src/components/tower/command-center/views/RecommendedActionsView.tsx` — passed.
- `npm test -- --runTestsByPath src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx` — passed, 24 tests.
- `TCC_HARNESS_OUT=/Users/anand/Downloads/tower-density-visual-proof-2026-08-10-v4/html npm test -- --runTestsByPath src/components/tower/command-center/__tests__/render-harness.test.tsx` — passed, 2 tests.
- Local visual density proof at 1792x1120 showed first analytical panels above the fold for AI Portfolio, Value Proof, Decision Lanes, Evidence, and AI Spend Attribution with zero horizontal overflow in the harness.
- Command Center follow-up density proof moved the first chart row to y=263 in the local harness with zero horizontal overflow.
- `git diff --check` — passed.

## Rollout Plan

Merge through the protected GitHub PR lane. The repo-owned Azure Container Apps main deployment workflow builds and deploys the resulting main revision. After deployment, run signed-in browser proof against the shared Tower route before calling the density change live-ready.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this branch.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: No worker change expected; verify if the deploy workflow updates worker images.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, against the shared Tower route after deployment.

## Rollback Plan

Rollback by reverting the UI release commit and redeploying through the repo-owned Azure Container Apps main deployment workflow. No schema, data, source-adapter, Cube, or mart rollback is required.

## Audit Evidence

- Local density proof report: `/Users/anand/Downloads/tower-density-visual-proof-2026-08-10-v4/tower-density-visual-proof.md`
- Local density proof JSON: `/Users/anand/Downloads/tower-density-visual-proof-2026-08-10-v4/tower-density-visual-proof.json`
- Local density screenshots: `/Users/anand/Downloads/tower-density-visual-proof-2026-08-10-v4/screens`
- Command Center density proof: `/Users/anand/Downloads/tower-command-center-density-proof-2026-08-10/command-center-density-proof.md`
- PR URL, ACA deploy workflow run, runtime invariant, and signed-in shared-route proof to be captured after publication.

## Known Gaps

The static harness confirms density and overflow behavior but does not prove live Recharts rendering. Signed-in shared-route browser proof is required after deployment.
