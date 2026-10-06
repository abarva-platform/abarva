# 2026-09-09-source-contract-summary-determinism - Source Contract Summary Determinism

## Release ID

`2026-09-09-source-contract-summary-determinism`

## Status

`released`

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

Status: pass for local candidate validation and post-deploy live proof.

- `npm test -- --runTestsByPath src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts` - pass.
- `npx eslint src/lib/source/ava/source-workspace-visual-answer.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts` - pass.
- `npm run release:check` - pass.
- PR check suite for PR `#7453` - pass.
- ACA main deploy run `34308696094` - pass.
- Direct ACA runtime invariant - pass. Web template image, 100%-traffic revision image, and both required worker job images matched digest `sha256:5eb536d8b0087bfba4ae2075d729ad9d3c145b39093a892a729e0d281cfda108`.
- Signed-in Source aVa repeat proof - pass. Five contract-summary and optimization-lever prompts preserved the full selected public contract ID, selected vendor, renewal facts, value facts, opportunity rationale, and did not render empty contract parentheses, fallback copy, or a missing-notice-period claim.

## Rollout Plan

Merge through PR and deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow
- Approved image digest: `sha256:5eb536d8b0087bfba4ae2075d729ad9d3c145b39093a892a729e0d281cfda108`
- ACA runtime invariant: passed; web template image and 100%-traffic revision image matched the approved digest.
- Worker image invariant: passed; `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event` matched the approved digest.
- Feature/env flag update path: none
- Live signed-in proof required: passed, including repeated aVa prompt proof.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow. There are no schema, data, or migration rollback steps.

## Audit Evidence

- PR `#7453`.
- ACA main deploy run `34308696094`.
- Direct Azure runtime invariant query captured released revision `ca-abarva-web-lab-eastus--m40633a89` at 100% traffic with the web template, traffic revision, and required worker jobs on digest `sha256:5eb536d8b0087bfba4ae2075d729ad9d3c145b39093a892a729e0d281cfda108`.
- Signed-in browser proof captured five live Source aVa responses using contract-summary and optimization-lever phrasing; all preserved the selected public contract ID and governed contract facts without empty parentheses or fallback language.

## Known Gaps

This release does not attach governed source document files to contracts or change Source Evidence tab document-file coverage.
