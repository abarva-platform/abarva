# 2026-08-30-source-ava-deterministic-answer-shape — Source aVa Answer Shape Guard

## Release ID

`2026-08-30-source-ava-deterministic-answer-shape`

## Status

`candidate`

## Plain-English Summary

Source aVa deterministic contract answers now keep their evidence-bound shape instead of being expanded by the generic cross-product strategy fallback. When a Source page has already built a contract-specific answer from structured context, the response stays focused on that contract, its evidence state, and its next action.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 Products: narrows the Source aVa response wrapper for deterministic Source visual answers. No canonical data, adapter, schema, loader, or projection data is changed.

## Client Applicability

- All clients: Source aVa deterministic contract visual answers.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/app/api/intelligence/ask/route.ts`: preserves deterministic Source visual packets through the product-truth safety guard without applying global CXO answer-mode fallbacks.
- `src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts`: adds a regression test proving a Source contract answer is not expanded with a generic phase plan.

## QA / Validation

- `npx jest --runTestsByPath 'src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts' --runInBand` passed.

## Rollout Plan

Merge through a protected PR. The repo-owned Azure Container Apps main deployment workflow will build and deploy the resulting main SHA.

## Deployment Authority

- Repo-owned deploy workflow: Required for production rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment if the workflow updates workers.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, ask a deterministic Source contract question and confirm the answer does not include a generic phase plan.

## Rollback Plan

Revert the PR or redeploy the previous healthy ACA revision. No data rollback is required because this is product response-shaping code only.

## Audit Evidence

- PR URL and merge SHA after merge.
- Focused Jest output for the route regression test.
- ACA main deploy run and runtime invariant evidence after rollout.
- Signed-in Source aVa proof after deploy.

## Known Gaps

None known for this response-shape guard. This does not change underlying Source data quality, contract coverage, or opportunity calculations.
