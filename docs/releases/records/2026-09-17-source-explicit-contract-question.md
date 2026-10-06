# 2026-09-17-source-explicit-contract-question

## Release ID

`2026-09-17-source-explicit-contract-question`

## Status

`candidate`

## Plain-English Summary

Source chat can use a single contract ID typed in a question to retrieve the same governed contract evidence used by a selected contract page. It does not guess a contract from a supplier name or choose one side of a multi-contract question.

## Layer Impact

Layer 4 Source answer routing only. The canonical facts, read model, tenant authorization, and data-plane rows are unchanged.

## Client Applicability

- All clients: Source chat surfaces with a governed contract read path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source chat availability.

## Changes Included

An exact contract-ID question resolver, its behavior tests, and wiring into the existing Source contract-grounding path.

## QA / Validation

PASS: 29 focused behavior and route-wiring tests, scoped ESLint, and TypeScript. PASS: release check after this record update. NOT RUN: signed-in production answer check, required after deployment; local validation is not live proof.

## Rollout Plan

Squash merge through a PR; use the repo-owned ACA main deployment workflow. No migration, tenant-data build, or flag update.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: To be recorded by the workflow.
- ACA runtime invariant: Verify template, traffic revision, and workers against the approved digest.
- Worker image invariant: Verify in the deployment workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a Source workspace question containing one contract ID.

## Rollback Plan

Revert the PR and redeploy via the same workflow, or roll back to the previous approved digest through repo governance. No data rollback is needed.

## Audit Evidence

PR and CI links, deployment workflow run and digest readback, then a signed-in response transcript.

## Known Gaps

Supplier-name-only and multi-contract questions are not resolved by this change. The answer model must still be checked live against a contract with governed rows.
