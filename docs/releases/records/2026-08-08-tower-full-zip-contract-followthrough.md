# 2026-08-08-tower-full-zip-contract-followthrough — Tower ZIP Contract Follow-Through

## Release ID

`2026-08-08-tower-full-zip-contract-followthrough`

## Status

`candidate`

## Plain-English Summary

This release follows through on the Tower CFO audit ZIP by changing the tab defaults and page framing across the Tower module. Value Proof opens with the outcome waterfall, Decision Lanes opens on portfolio topology, Evidence opens on missing proof, and AI Portfolio / Recommended Actions carry the North Star operating narrative.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Tower presentation and tab-state defaults only. No canonical facts, mart calculations, tenant data, or runtime data loaders are changed.

## Client Applicability

- All clients: Tower users receive the revised tab defaults and page narrative.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Decision Lanes default sub-view changes from program table to portfolio heatmap/topology.
- Evidence default question changes from existing evidence to missing proof.
- Value Proof becomes waterfall-first with evidence blockers beside it.
- AI Portfolio, Evidence, and Recommended Actions receive compact North Star operating notes.
- Focused tests and visual harness expectations updated to assert the new defaults.

## QA / Validation

- `npx eslint src/components/tower/command-center/TowerCommandCenter.tsx src/components/tower/command-center/views/ValueProofView.tsx src/components/tower/command-center/views/DecisionLanesView.tsx src/components/tower/command-center/views/AiPortfolioView.tsx src/components/tower/command-center/views/EvidenceView.tsx src/components/tower/command-center/views/RecommendedActionsView.tsx src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/components/tower/command-center/__tests__/render-harness.test.tsx` passed.
- `npm test -- --runTestsByPath src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/components/tower/command-center/__tests__/css-contract.test.ts src/components/tower/command-center/__tests__/render-harness.test.tsx` passed.
- Visual harness screenshots were generated under `/Users/anand/Downloads/tower-full-zip-contract-qa-2026-08-08/harness-followup/`.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the shared web image. After deployment, verify the live Tower tabs against the ZIP-contract acceptance notes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow
- Approved image digest: assigned by the repo-owned deploy workflow
- ACA runtime invariant: verify template image and 100% traffic revision image match the deployed digest
- Worker image invariant: no worker image change expected
- Feature/env flag update path: none
- Live signed-in proof required: yes, Tower route tab proof after deployment

## Rollback Plan

Revert the merge commit or redeploy the previous known-good shared web image through the approved ACA deployment path. No data rollback is required.

## Audit Evidence

- Pull request URL after creation.
- Focused lint/test output from this branch.
- Visual harness screenshots under `/Users/anand/Downloads/tower-full-zip-contract-qa-2026-08-08/harness-followup/`.
- ACA workflow run and signed-in Tower proof after deployment.

## Known Gaps

This release still does not add new mart fields for action due windows, evidence package ids, or owner handoff readiness. It frames those gaps explicitly while leaving data-model expansion for a separate release.
