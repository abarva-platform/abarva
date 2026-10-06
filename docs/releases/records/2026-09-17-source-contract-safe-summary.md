# 2026-09-17-source-contract-safe-summary - Contract-scoped executive answer

## Release ID

`2026-09-17-source-contract-safe-summary`

## Status

`candidate`

## Plain-English Summary

An executive-summary question from an open Contract 360 page now uses the authorized contract answer path. It cannot fall through to an unrelated general answer.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source answer routing only. Canonical facts, adapters, data, and approval states are unchanged.

## Client Applicability

- All clients: Shared Source Contract 360 aVa route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/ava/source-workspace-visual-answer.ts`: recognize executive-safe summary wording as a contract-context question.
- `src/app/api/intelligence/ask/__tests__/route.source-contract-authority.test.ts`: prove that the answer uses the server-rehydrated selected contract, not general retrieval or another contract.

## QA / Validation

- New route regression failed before the matcher change and passed after it.
- Focused route and visual-answer suites: 29 passed.
- Scoped lint, TypeScript no-emit, and release gate: passed.
- Signed-in answer proof: pending deployment.

## Rollout Plan

Merge by PR and deploy through the repo-owned ACA main deploy workflow. No migration or data job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded by the deploy workflow.
- ACA runtime invariant: Check template, 100% traffic revision, and required worker images after deploy.
- Worker image invariant: Unchanged.
- Feature/env flag update path: None.
- Live signed-in proof required: Ask the executive-summary question from a selected Contract 360 page and inspect contract ID, citations, and excluded unsupported value.

## Rollback Plan

Revert this PR and redeploy through the repo-owned main workflow. No data rollback is involved.

## Audit Evidence

PR and CI URLs, deploy SHA/digest, and signed-in answer check to be attached after rollout.

## Known Gaps

This narrow routing fix does not prove every free-form contract question is grounded. Broader contract-chat acceptance remains separate.
