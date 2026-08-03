# 2026-08-03-tower-evidence-maturity-redesign — Tower Evidence Maturity Redesign

## Release ID

`2026-08-03-tower-evidence-maturity-redesign`

## Status

`candidate`

## Plain-English Summary

Tower now treats sparse value evidence as an executive diagnosis instead of repeating blank value funnels. The page leads with the distinction between visible investment/adoption and unproven outcome value, then organizes Value Proof, Decision Lanes, Evidence, AI Portfolio, and Recommended Actions around the proof work required before value can be claimed.

## Layer Impact

- Release lane: `global-control-lane` for the Tower UI projection and `client-data-lane` for the separately executed demo data reload proof.
- Products: Tower presentation logic changes. It reads the governed Tower read model and renders an evidence-maturity projection for sparse claim states.
- Canonical model projection: the Tower reader now carries optional claim-state counts already produced by the `tower.value_claim` projection. No schema migration is introduced by this release.
- Source adapters / intake: no new intake format is introduced in this PR. The demo current-state package was reloaded through the approved ACA operator job path after dry-run proof.

## Client Applicability

- All clients: Tower UI behavior for sparse value-proof states.
- Specific clients: current airline demo tenant data proof was refreshed through the operator loader.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Tower command-center view model now derives an evidence maturity view with stage progression, compact gap ledger, intervention lanes, and prescribed interventions.
- Command Center now leads with the sparse-state diagnosis and claim-state stats.
- Value Proof shows evidence progression and top evidence blockers when value is unknown.
- Decision Lanes switches sparse states to measurement lanes before scale/fund/freeze/stop posture.
- AI Portfolio explicitly separates usage activity from business-value proof.
- Evidence "missing" answer uses a compact gap ledger instead of repetitive unknown rows.
- Recommended Actions leads with proof interventions while preserving governed action cards.
- Operator data reload proof was generated through the approved ACA job wrapper using a digest-pinned web image.

## QA / Validation

- `npx eslint src/lib/tower/command-center/view-model.ts src/lib/tower/command-center/types.ts src/lib/cio-tower/tower-mart-view-model.ts src/lib/tower/readTowerCommandCenter.ts src/components/tower/command-center/views/CommandCenterView.tsx src/components/tower/command-center/views/ValueProofView.tsx src/components/tower/command-center/views/DecisionLanesView.tsx src/components/tower/command-center/views/AiPortfolioView.tsx src/components/tower/command-center/views/EvidenceView.tsx src/components/tower/command-center/views/RecommendedActionsView.tsx` passed.
- `npx jest src/lib/tower/command-center/__tests__/view-model.test.ts src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx --runInBand` passed. Jest reported pre-existing duplicate manual mock warnings.
- `node scripts/tower/fact-lineage-report.mjs` passed and refreshed Tower lineage reports.
- `PATH=/Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH NODE_OPTIONS='--max-old-space-size=8192' npx next build --webpack` passed with Node v24.14.0.
- `npm run build` with default Turbopack did not complete in this local linked worktree because Turbopack rejected the `node_modules` symlink outside the filesystem root. This is an environment/worktree constraint; the webpack build passed.

## Rollout Plan

Merge the PR to main. The repo-owned ACA main deploy workflow builds and deploys the image. After deployment, run signed-in `/tower` desktop and mobile proof and verify the Tower counts against the post-load readback.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: set by the main deploy workflow after merge
- ACA runtime invariant: required after deploy
- Worker image invariant: not changed by this PR
- Feature/env flag update path: none
- Live signed-in proof required: yes, `/tower`

## Rollback Plan

Revert the PR and redeploy through the ACA main workflow. The UI change does not mutate schema or tenant records. The data reload was performed by a separate ACA operator job; rollback of that dataset should use the loader/runbook path and the proof bundle for the reload run.

## Audit Evidence

- Local targeted UI tests and lint output in the Codex task log.
- Build output from Node v24.14.0 webpack build in the Codex task log.
- Tower fact-lineage outputs under `reports/tower-data-fix/fact-lineage/`.
- Dry-run loader proof: `reports/tower-delta-reload/20260803-dry-run/summary.json`.
- Successful loader apply proof: `reports/tower-delta-reload/20260803-apply-dbsecret/summary.json`.
- Successful live readback proof: `reports/tower-delta-reload/20260803-live-proof/summary.json`.

## Known Gaps

- Outcome proof remains incomplete in the demo dataset: the live readback still reports zero known value claims and zero claimable claims.
- The live product must be re-smoked after this PR deploys; local/build proof is not live signed-in proof.
