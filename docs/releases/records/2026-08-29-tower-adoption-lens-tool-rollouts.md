# 2026-08-29-tower-adoption-lens-tool-rollouts — Tower Adoption Lens Scope

## Release ID

`2026-08-29-tower-adoption-lens-tool-rollouts`

## Status

`candidate`

## Plain-English Summary

Tower now keeps adoption evidence scoped to rows that actually carry rollout usage. Business-case rows without loaded usage no longer display as `active users` with a zero count or as fully adopted; the Adoption Lens is labeled as tool rollouts and only ranks records with recorded usage evidence.

## Layer Impact

Layer 4 Products, `global-control-lane`: corrects the Tower read model and presentation logic for adoption evidence. It does not change source files, adapter emissions, canonical objects, cube rows, or serving-row counts.

Layers 1-3: no source, adapter, canonical identity, measure, relationship, or semantic-type changes.

## Client Applicability

- All clients: Tower users on the shared Product/Lab runtime receive the corrected adoption-lens behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Tower reader preserves missing usage as `null` instead of defaulting to `active users` with zero actuals.
- Adoption Lens filters to portfolio rows with recorded usage/adoption evidence.
- Adoption Lens copy now says tool rollouts ranked by recorded usage evidence.
- Regression tests assert business cases without loaded usage do not manufacture adoption values.

## QA / Validation

- PASS: `npx jest src/lib/tower/__tests__/readTowerCommandCenter.test.ts --runInBand`
- PASS: `npx jest src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx --runInBand`
- PASS: `npx eslint src/lib/tower/readTowerCommandCenter.ts src/components/tower/command-center/views/ContractTabs.tsx src/components/tower/command-center/TowerCommandCenter.tsx`
- PASS: `npm run release:check`
- PASS: `git diff --check`

## Rollout Plan

Merge by pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned web image. No data rebuild is required for this presentation/read-path correction, but signed-in Tower proof is required after deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change
- Approved image digest: populated by the main deploy workflow after merge
- ACA runtime invariant: required before live claim
- Worker image invariant: required before live claim
- Feature/env flag update path: none
- Live signed-in proof required: yes, `/tower` with an authenticated tenant session

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required because the change does not mutate persisted product projection rows.

## Audit Evidence

- Pull request and CI checks for this release.
- Main deploy workflow run after merge.
- ACA runtime invariant proof after deploy.
- Signed-in Tower browser proof after deploy.

## Known Gaps

None known for this adoption-lens correction.
