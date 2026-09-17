# 2026-09-17-source-empty-opportunity-answer - Refuse unsupported actionability

## Release ID

`2026-09-17-source-empty-opportunity-answer`

## Status

`candidate`

## Plain-English Summary

When the current contract packet contains no governed opportunity rows, Source aVa now says that actionability and value are not established. It no longer describes the contract as an optimization case, recommends opening an action, or repeats a portfolio posture as if it were supported by this contract's opportunity rows.

## Layer Impact

`global-control-lane`: Layer 4 answer presentation for all Source clients only. No intake, adapter, canonical fact, schema, or data mutation.

## Client Applicability

- All clients: Source aVa contract answers using this builder.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

The Source workspace visual answer builder and its behavior test.

## QA / Validation

PASS: focused answer behavior test (15/15), scoped ESLint, TypeScript and release gate. The Source aVa cluster has 7 pre-existing failures in three unrelated suites on both this branch (294/301 passing) and untouched main (293/300 passing); cluster acceptance remains BLOCKED on those baseline failures. NOT RUN: CI and signed-in answer check; those remain separate gates.

## Rollout Plan

Squash merge through a PR. The repo-owned ACA main deploy workflow builds and deploys the exact main SHA; no migration or data job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Recorded by the deploy workflow.
- ACA runtime invariant: Verify after deploy.
- Worker image invariant: Verify through the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Ask about a contract with no opportunity rows and confirm the refusal, graph, and next action.

## Rollback Plan

Revert this presentation change in a new PR and redeploy via the repo-owned workflow; no data rollback.

## Audit Evidence

PR diff, focused/cluster test results, release check, ACA deploy run and signed-in answer capture when available.

## Known Gaps

Other open aVa contract-answer PRs require separate re-integration against current main. No signed-in answer proof is claimed by this record.
