# 2026-09-27-p3-approved-approach-prompt-sanitize — Sanitize P3 Approved Approach Prompt Context

## Release ID

`2026-09-27-p3-approved-approach-prompt-sanitize`

## Status

`candidate`

## Plain-English Summary

P3 architecture generation now receives the approved solution approach without internal audit identifiers, hashes, selected-option version strings, or approval timestamps in the model-facing prompt block. Structured lineage remains stored separately for validation, but client artifact generation no longer has to filter out operational metadata that should never appear in executive deliverables.

## Layer Impact

- Release lane: `global-control-lane`
- Canonical model: No schema or data contract change. Existing approved-solution lineage stays structured and load-bearing.
- Products: Moves P3 generation receives a cleaner approved-approach context block.
- Agent/model context: The model-facing prompt removes audit-only lineage while preserving the approved option, rationale, scope, exclusions, assumptions, constraints, unresolved decisions, and rejected alternatives.

## Client Applicability

- All clients: Applies wherever Moves P3 approved-solution generation is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Moves generation flags and access controls continue to apply.

## Changes Included

- `src/lib/programs/approved-solution-approach.ts`
- `src/lib/programs/__tests__/approved-solution-approach.test.ts`

## QA / Validation

- Pass: `./node_modules/.bin/jest --runTestsByPath src/lib/programs/__tests__/approved-solution-approach.test.ts --runInBand`
- Pass: `npx eslint src/lib/programs/approved-solution-approach.ts src/lib/programs/__tests__/approved-solution-approach.test.ts`
- Pass: `npm run typecheck`

## Rollout Plan

Merge to `main`, then deploy through the repo-owned ACA main deploy workflow. No migration or environment-variable change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be captured after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, re-run the P3 package build from the signed-in Moves workspace and verify it advances past the prior quality blocker or reports a different actionable gate.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. Existing approved-solution records remain valid because this changes only prompt formatting.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/8583
- Local test output: focused unit test listed above.
- Deploy run and runtime invariant: To be captured after merge/deploy.
- Signed-in product proof: To be captured after deploy.

## Known Gaps

This does not weaken the quality gate. If generated content still contains unsupported figures, the gate should continue to block and surface the specific missing evidence.
