# 2026-08-29-tower-layer4-reviewed-project-count — Tower Reviewed Project Count

## Release ID

`2026-08-29-tower-layer4-reviewed-project-count`

## Status

`candidate`

## Plain-English Summary

Tower now carries the reviewed project population from the Layer 4 executive summary instead of borrowing the decision-lane count. This keeps the approved portfolio count separate from the subset of AI business cases that need value-proof action.

## Layer Impact

Layer 4 Products, `global-control-lane`: adds `reviewed_project_count` to the Tower Layer 4 executive summary payload and readback output. The Tower reader uses that value for the approved portfolio count while keeping active decision lanes, AI business cases, tools, and evidence actions as separate populations.

Layers 1-3: no source, adapter, canonical identity, measure, relationship, or semantic-type changes.

## Client Applicability

- All clients: Tower users on the shared Product/Lab runtime receive the corrected Layer 4 read behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Layer 4 Tower product loader writes `reviewed_project_count` into the executive summary payload and validation readback.
- Tower command-center reader prefers the executive reviewed project count over the decision-lane row count for `totalProgramSubjectCount`.
- Reader regression tests assert that the approved portfolio count can differ from the AI decision-lane count.

## QA / Validation

- PASS: `npx jest src/lib/tower/__tests__/readTowerCommandCenter.test.ts --runInBand`
- PASS: `npx jest src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx --runInBand`
- PASS: `npx eslint src/lib/tower/readTowerCommandCenter.ts scripts/tower/load-healthcare-demo-layer4-products.mjs src/components/tower/command-center/views/CommandCenterView.tsx`
- PASS: `git diff --check`
- PASS: `npm run release:check`
- NOT RUN locally: `npm run tower:healthcare-demo-layer4-products:validate` requires `DATABASE_URL`; Azure readback will run through the approved ACA data-build job after deploy.

## Rollout Plan

Merge by pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned web image. After deploy, rerun the approved ACA data-build job for the Tower Layer 4 product projection so the refreshed executive summary payload is written to Azure. Then run signed-in Tower proof against the deployed runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: approved ACA data-build job for the Layer 4 product projection after merge
- Approved image digest: populated by the main deploy workflow after merge
- ACA runtime invariant: required before live claim
- Worker image invariant: required before live claim
- Feature/env flag update path: none
- Live signed-in proof required: yes, `/tower` with an authenticated tenant session

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. If the Layer 4 product projection has already been refreshed, rerun the previous approved Layer 4 product build or restore the prior active projection version through the same ACA job path.

## Audit Evidence

- Pull request and CI checks for this release.
- Main deploy workflow run after merge.
- ACA runtime invariant proof after deploy.
- ACA Layer 4 product job proof bundle after refresh.
- Signed-in Tower browser proof after deploy and data refresh.

## Known Gaps

None known for this Layer 4 count correction.
