# 2026-08-16-source-ava-hard-qa-final-pass — Source aVa Hard-QA Final Pass

## Release ID

`2026-08-16-source-ava-hard-qa-final-pass`

## Status

`candidate`

## Plain-English Summary

This release tightens Source aVa prompt instructions for the final hard-QA edge cases: unquoted values without calculation runs, workshop answers for the viewed event stage, and pending-value chart wording.

## Layer Impact

- Lane: `global-control-lane`
- PRODUCTS: Source aVa answer generation is refined for Optimize Contract and New Sourcing Event questions. No data model, parser, workflow, or entitlement rule changes are included.
- CANONICAL MODEL: No change.
- SOURCE ADAPTERS: No change.
- CLIENT INTAKE: No change.

## Client Applicability

- All clients: Yes, for Source aVa responses.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/chat/agent/route.ts`
- `src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts`

## QA / Validation

- PASS: Focused Source aVa prompt regression test.
- PASS: ESLint on touched files.
- PASS: TypeScript compile.
- PASS: Release check.
- NOT RUN YET: Live signed-in hard-QA must be rerun after deployment before marking this release live-proven.

## Rollout Plan

Merge to main and deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: Not allowed.
- Approved image digest: To be captured from the ACA deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required before claiming live.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, rerun Source aVa hard-QA.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow.

## Audit Evidence

- PR URL and merge commit.
- GitHub Actions deploy run.
- ACA runtime invariant proof.
- Live Source aVa hard-QA capture and score report.

## Known Gaps

- This release does not perform production data-plane uploads or parser readback.
