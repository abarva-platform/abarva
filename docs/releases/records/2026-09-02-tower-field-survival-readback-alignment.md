# 2026-09-02-tower-field-survival-readback-alignment — Tower Field Survival Readback Alignment

## Release ID

`2026-09-02-tower-field-survival-readback-alignment`

## Status

`candidate`

## Plain-English Summary

Tower's AI initiative and AI tool field-survival gates now check the same product payload shape that the Layer 4 writer emits. The update keeps detailed AI initiative fields visible on the AI portfolio surface and aligns the tool cube readback with the cube grain used by the writer.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 products: AI initiative display payloads now carry the governed detail fields required by the field-survival contract. Tool cube readback now validates the emitted tool-rollout grain instead of looking for a non-emitted grain name.

Layer 3 canonical model: No schema or data-writing change. This release consumes the existing canonical fields.

## Client Applicability

- All clients: Applies to any tenant package using the Tower AI business-case and tool-rollout field-survival contracts.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/tower/load-healthcare-demo-layer4-products.mjs` adds missing AI initiative detail fields to the AI portfolio display payload.
- `scripts/tower/load-healthcare-demo-layer4-products.mjs` validates tool cube slices at the emitted `tool_rollout` grain.

## QA / Validation

- Pass: `node scripts/tower/load-healthcare-demo-layer4-products.mjs --out-dir /tmp/tower-layer4-readback-grain-fix-dryrun-20260902`
- Pass: `node scripts/tower/__tests__/run-ai-business-case-field-survival-tests.mjs`
- Pass: `node scripts/tower/__tests__/run-tool-rollout-field-survival-tests.mjs`

## Rollout Plan

Merge through pull request, deploy through the repo-owned Azure Container Apps main workflow, then rerun the Tower Layer 4 product/cube job for the governed assessment package. A readback-only Layer 4 proof job must pass before the product layer is considered refreshed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Determined by the main deploy workflow after merge.
- ACA runtime invariant: Required before running the operator job with the new image.
- Worker image invariant: Required by the main deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming browser-visible product proof.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main workflow. If a Layer 4 refresh has already run, rerun the previous approved Layer 4 product/cube job from the rollback image.

## Audit Evidence

- Pull request for this release.
- Local dry-run and focused field-survival test output.
- Post-merge ACA deploy evidence.
- Post-deploy Layer 4 readback-only proof bundle.

## Known Gaps

Live signed-in browser proof is separate from this release and is not claimed by local or operator-job readback.
