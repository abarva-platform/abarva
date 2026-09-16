# 2026-09-16-source-ava-financial-semantics — Distinguish contract financial measures

## Release ID

`2026-09-16-source-ava-financial-semantics`

## Status

`candidate`

## Plain-English Summary

The deterministic Source contract answer now keeps annual contract value, total committed value, and actual annual spend separate. It states that spend alone does not prove invoice payment, and includes the committed value in cited metrics when available.

## Layer Impact

- `global-control-lane`, Layer 4 Source aVa answer presentation only. No canonical fact, adapter, intake, or schema change.

## Client Applicability

- All clients using the Source contract answer packet.
- No tenant-specific data mutation or feature flag.

## Changes Included

- Distinct committed-value fact and metric in the contract answer.
- Explicit payment-status and annual-versus-total commitment caveats.
- Focused answer-contract regression.

## QA / Validation

- The regression failed before the implementation and passed afterward; focused suite: 13 tests passed.
- Scoped ESLint, TypeScript `--noEmit`, and release gate: passed.
- Signed-in proof: pending deployment.

## Rollout Plan

Merge through a reviewed PR and deploy through the repo-owned ACA main workflow after separate approval. No migration or data build is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the deploy workflow.
- ACA runtime invariant: verify after deployment.
- Worker image invariant: verify after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: a contract answer must label the three measures distinctly and avoid an unsupported payment claim.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. No data or schema rollback is needed.

## Audit Evidence

PR diff, local tests, release gate, deploy readback, and signed-in answer proof when available.

## Known Gaps

This is an answer-semantics guard. It does not create payment evidence or alter the underlying financial values.
