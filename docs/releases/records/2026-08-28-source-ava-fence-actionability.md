# 2026-08-28-source-ava-fence-actionability — Source aVa fence and actionability routing

## Release ID

`2026-08-28-source-ava-fence-actionability`

## Status

`candidate`

## Plain-English Summary

This release makes Source aVa handle contract actionability and value-readiness questions through
the governed Source contract answer path. It also turns explicit foreign-tenant questions into a
clean blocked answer before retrieval, instead of allowing the request to reach later safety gates
and surface as a generic error.

## Layer Impact

- `global-control-lane`: Updates aVa request routing and tenant-fence answer behavior for product
  surfaces that call the shared Ask API.
- `global-control-lane`: Expands Source contract-answer routing so Source can answer actionability,
  optimization, opportunity, and value-readiness prompts from the selected contract context.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/intelligence/ask/route.ts`
- `src/lib/intelligence/ask/tenant-fence-answer.ts`
- `src/lib/intelligence/ask/__tests__/tenant-fence-answer.test.ts`
- `src/lib/source/ava/source-workspace-visual-answer.ts`
- `src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts`

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts src/lib/intelligence/ask/__tests__/tenant-fence-answer.test.ts --runInBand`
- PASS: `npx eslint src/app/api/intelligence/ask/route.ts src/lib/intelligence/ask/tenant-fence-answer.ts src/lib/intelligence/ask/__tests__/tenant-fence-answer.test.ts src/lib/source/ava/source-workspace-visual-answer.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts`
- PASS: `npx prettier --check src/app/api/intelligence/ask/route.ts src/lib/intelligence/ask/tenant-fence-answer.ts src/lib/intelligence/ask/__tests__/tenant-fence-answer.test.ts src/lib/source/ava/source-workspace-visual-answer.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts docs/releases/records/2026-08-28-source-ava-fence-actionability.md`

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the
new image, then run signed-in Source aVa proof on the affected workflow.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending main deploy.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the same Azure Container Apps main workflow. The rollback restores
the previous aVa routing behavior without data migration or tenant-data changes.

## Audit Evidence

- PR: Pending.
- Deploy workflow: Pending.
- Live signed-in proof: Pending.

## Known Gaps

Live signed-in proof is pending deployment.
