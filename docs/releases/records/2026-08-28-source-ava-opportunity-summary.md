# 2026-08-28-source-ava-opportunity-summary — Source aVa opportunity summary

## Release ID

`2026-08-28-source-ava-opportunity-summary`

## Status

`candidate`

## Plain-English Summary

This release makes the Source aVa contract answer name the top governed opportunity and value in
the plain-language response when those rows are already present in the selected contract context.
The structured table and citations remain the underlying evidence path.

## Layer Impact

- `global-control-lane`: Updates the Source aVa product answer projection for selected-contract
  actionability prompts.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/ava/source-workspace-visual-answer.ts`
- `src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts`

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts --runInBand`
- PASS: `npx eslint src/lib/source/ava/source-workspace-visual-answer.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts`
- PASS: `npx prettier --check src/lib/source/ava/source-workspace-visual-answer.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts docs/releases/records/2026-08-28-source-ava-opportunity-summary.md`

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the
new image, then rerun signed-in Source aVa proof on the affected workflow.

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
the previous Source aVa summary text without data migration or tenant-data changes.

## Audit Evidence

- PR: Pending.
- Deploy workflow: Pending.
- Live signed-in proof: Pending.

## Known Gaps

Live signed-in proof is pending deployment.
