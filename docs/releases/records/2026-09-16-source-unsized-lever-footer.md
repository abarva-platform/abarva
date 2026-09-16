# 2026-09-16-source-unsized-lever-footer — State when no candidate value is sized

## Release ID

`2026-09-16-source-unsized-lever-footer`

## Status

`candidate`

## Plain-English Summary

When a contract has negotiation asks but no evidence-backed amount, the Optimize footer now says that no candidate value is sized. It no longer describes a nonexistent zero-lever total as sourced numeric value.

## Layer Impact

- `global-control-lane`, Layer 4 Source presentation only. No canonical fact, adapter, intake, or schema change.

## Client Applicability

- All clients using Source Contract 360 Optimize.
- No tenant-specific data mutation or feature flag.

## Changes Included

- Conditional zero-sized footer in the Contract 360 lever table.
- Rendered regression for a contract with only unsized and signal-stage asks.

## QA / Validation

- The new test failed before the fix and passed afterward; focused suite: 3 tests passed.
- Scoped ESLint: passed.
- TypeScript `--noEmit`: passed.
- Signed-in content proof: pending deployment.

## Rollout Plan

Merge through a reviewed PR and deploy through the repo-owned ACA main workflow after separate approval. No migration or data build is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the deploy workflow.
- ACA runtime invariant: verify after deployment.
- Worker image invariant: verify after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: an unsized contract Optimize view must state the empty amount condition without a numeric-total claim.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. No data or schema rollback is needed.

## Audit Evidence

PR diff, local tests, release gate, deploy readback, and signed-in Optimize footer proof when available.

## Known Gaps

This is a wording guard. It does not establish a sizing claim or add underlying evidence.
