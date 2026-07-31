# 2026-07-31-home-knowledge-suggested-questions-models-off — Home Knowledge Suggested Questions Visibility

## Release ID

`2026-07-31-home-knowledge-suggested-questions-models-off`

## Status

`candidate`

## Plain-English Summary

Home Knowledge now keeps deterministic suggested questions visible when model reasoning is disabled. The questions still come from the governed Knowledge consumption projection, while answer submission remains disabled for model-dependent prompts until the governed reasoning provider is enabled.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Updates the Home Knowledge aVa dock rendering so a data-backed prompt list is visible independently from the reasoning provider state.
- Products / tests: Extends the Knowledge shell smoke test to prove the suggested-question reader is called and model-dependent questions are disabled rather than hidden when reasoning is unavailable.

## Client Applicability

- All clients: Applies to the shared Home Knowledge product shell when it receives suggested questions from the consumption API.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/knowledge/ava/AvaDock.tsx`
- `src/components/knowledge/__tests__/knowledge-shell-smoke.test.tsx`

## QA / Validation

- `npm test -- --runTestsByPath src/components/knowledge/__tests__/knowledge-shell-smoke.test.tsx` passed.
- `npx eslint src/components/knowledge/ava/AvaDock.tsx src/components/knowledge/__tests__/knowledge-shell-smoke.test.tsx` passed.

## Rollout Plan

Merge through a pull request to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow. After deployment, rerun signed-in Home Knowledge proof for the authorized tenant route and verify suggested questions are visible while model-dependent ask controls remain disabled when reasoning is unavailable.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this release.
- Approved image digest: Resolved by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: No worker job change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this product-shell change and redeploy through the repo-owned Azure Container Apps main deploy workflow. No data rollback is required.

## Audit Evidence

- Pull request and CI checks for this release candidate.
- Signed-in Home Knowledge browser proof after deployment.
- Consumption projection readback showing `consumption.module_knowledge_packet_v1` is present for the active baseline.

## Known Gaps

This does not enable model reasoning, create new suggested-question content, change baselines, or modify governed data.
