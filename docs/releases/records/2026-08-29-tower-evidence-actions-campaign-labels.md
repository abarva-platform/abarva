# 2026-08-29-tower-evidence-actions-campaign-labels — Tower Evidence Campaign Labels

## Release ID

`2026-08-29-tower-evidence-actions-campaign-labels`

## Status

`candidate`

## Plain-English Summary

Tower Evidence & Actions now separates assignable task counts from the larger populations affected by each campaign. The tab still shows the open task queue count, while each campaign labels its metric as assets, claims, actions, evidence, or rows instead of presenting every population as tasks.

## Layer Impact

Layer 4 Products only.

- Lane: `global-control-lane`
- Impact: Tower presentation copy and tab rendering change for the Evidence & Actions view. This does not change intake, adapters, canonical objects, serving data, migrations, loaders, or generated values.

## Client Applicability

- All clients: Tower users receive the clearer Evidence & Actions labeling.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Tower command-center Evidence & Actions campaign metric labels.
- Tower command-center regression test for the campaign-count wording.

## QA / Validation

- PASS: `npx jest src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx --runInBand`
- PASS: `npx eslint src/components/tower/command-center/views/ContractTabs.tsx src/components/tower/command-center/TowerCommandCenter.tsx`
- PASS: `npm run release:check`
- PASS: `git diff --check`

## Rollout Plan

Merge to main through a pull request. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image to the shared product runtime.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None in this change.
- Approved image digest: Captured by the deploy workflow.
- ACA runtime invariant: Verify after deployment.
- Worker image invariant: Verify after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower Evidence & Actions tab.

## Rollback Plan

Revert the pull request and redeploy through the repo-owned main deploy workflow.

## Audit Evidence

Pull request, validation output, release check output, Azure Container Apps deployment evidence, and signed-in Tower browser proof.

## Known Gaps

This is a presentation-only clarification. It assumes the existing Layer 4 serving data remains the source for open task counts and affected-record populations; it does not rebuild or reclassify those records.
