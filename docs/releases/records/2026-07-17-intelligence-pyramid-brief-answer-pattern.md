# 2026-07-17-intelligence-pyramid-brief-answer-pattern — Intelligence Pyramid Brief Answer Pattern

## Release ID

`2026-07-17-intelligence-pyramid-brief-answer-pattern`

## Status

`candidate`

## Plain-English Summary

This release tightens the Intelligence aVa answer contract so normal CXO chat answers follow a concise consultant-style pattern instead of drifting into multiple paragraphs. The default pattern is now the AbarVa Pyramid Brief: answer first, give compact proof, end with the executive move, and queue exactly three grounded follow-up questions for deeper cuts.

## Layer Impact

- `global-control-lane`: Updates the shared Intelligence prompt contract and answer-only streaming instructions used by all tenants.
- `product-experience`: Changes the visible answer shape for aVa chat so broad strategy questions prompt follow-up depth instead of dumping long narrative in the first response.

## Client Applicability

- All clients: Yes, for Intelligence aVa answers.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/response-policy.ts`: Adds the AbarVa Pyramid Brief contract and 90-160 word default target.
- `src/lib/intelligence/ask/synthesizer.ts`: Aligns the core system prompt, rich-text override, universal visual contract, and answer-only streaming directive to the same answer pattern.
- `src/lib/intelligence/ask/response-policy.test.ts`: Adds regression coverage for the Pyramid Brief, word target, and exactly three queued follow-ups.

## QA / Validation

- `npx jest src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts --runInBand` passed: 2 suites, 26 tests. Jest printed pre-existing duplicate manual mock warnings for GFM parser mocks.

## Rollout Plan

Merge through PR to `main`. The normal Azure Container Apps main deploy workflow builds and deploys the updated web image to `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by the ACA deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by the ACA deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, ask a broad strategy question and verify the answer follows Answer / Proof / Move with exactly three queued follow-ups.

## Rollback Plan

Revert the PR and redeploy through the normal ACA main workflow. No migrations or data changes are involved.

## Audit Evidence

- PR URL: pending.
- Focused Jest command above.
- Post-merge ACA deploy evidence and signed-in proof should be attached to the PR/release trail.

## Known Gaps

This release changes the answer contract, not streaming latency. Perceived response speed should be handled in a separate streaming/latency pass.
