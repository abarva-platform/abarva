# 2026-09-09-source-contract-summary-determinism - Source Contract Summary Determinism

## Release ID

`2026-09-09-source-contract-summary-determinism`

## Status

`candidate`

## Plain-English Summary

Source aVa contract summary prompts now use the deterministic selected-contract answer path when a Source contract is selected or explicitly requested. This closes a simple-summary path that could allow generated opener prose to omit the contract identifier even though the structured Source facts were present below it.

## Layer Impact

Layer 4 - Products, `global-control-lane`: updates Source aVa answer routing only. No tenant intake, adapter, canonical model, schema, migration, or data-plane mutation is included.

## Client Applicability

- All clients: Source Workspace and Contract 360 aVa users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/ava/source-workspace-visual-answer.ts`
- `src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts`
- `docs/releases/records/2026-09-09-source-contract-summary-determinism.md`

## QA / Validation

Status: pass for local candidate validation.

- `npm test -- --runTestsByPath src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts` - pass.
- `npx eslint src/lib/source/ava/source-workspace-visual-answer.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts` - pass.
- `npm run release:check` - pass.

Post-deploy proof required before this record can be marked released:

- ACA main deploy run for the merged SHA.
- Direct ACA runtime invariant proving the web template image, 100%-traffic revision image, and required worker job images match the approved digest.
- Signed-in Source aVa repeat proof across at least five contract-summary and optimization-lever prompts showing the full selected public contract ID, selected vendor, renewal facts, value facts, opportunity rationale, and no empty contract parentheses, fallback copy, or missing-notice-period claim.

## Rollout Plan

Merge through PR and deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow
- Approved image digest: pending post-deploy proof
- ACA runtime invariant: pending post-deploy proof
- Worker image invariant: pending post-deploy proof
- Feature/env flag update path: none
- Live signed-in proof required: yes, including repeated aVa prompt proof.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow. There are no schema, data, or migration rollback steps.

## Audit Evidence

- Pending PR, deploy, runtime invariant, and signed-in browser proof.

## Known Gaps

This release does not attach governed source document files to contracts or change Source Evidence tab document-file coverage.
