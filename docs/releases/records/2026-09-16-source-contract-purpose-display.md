# 2026-09-16-source-contract-purpose-display — Guard contract title and purpose prose

## Release ID

`2026-09-16-source-contract-purpose-display`

## Status

`candidate`

## Plain-English Summary

Contract 360 no longer appends an unreviewed-purpose status to the contract title or presents concatenated clause-state fields as reviewed service scope. When a purpose has not been reviewed, the page uses the declared agreement identity and keeps the limitation visible.

## Layer Impact

- `global-control-lane`, Layer 4 Source presentation only. Intake, adapters, canonical records, and data values remain unchanged.

## Client Applicability

- All clients using Source Contract 360.
- No tenant-specific data mutation or feature flag.

## Changes Included

- Contract 360 heading guard for short fallback headlines.
- Contract purpose summary guard for stitched clause-state strings.
- Focused tests for both observed failure shapes and existing purpose behavior.

## QA / Validation

- New regression tests failed before the implementation and pass afterward.
- Focused Jest: 9 tests passed.
- Scoped ESLint: passed.
- TypeScript `--noEmit`: passed.
- Live signed-in content proof: pending deployment.

## Rollout Plan

Merge through a reviewed PR and deploy only through the repo-owned ACA main workflow after the applicable approval. No migration or data build is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the deploy workflow.
- ACA runtime invariant: verify after deploy.
- Worker image invariant: verify after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: inspect the H1 and Story paragraph for a contract carrying an unreviewed-purpose status and stitched clause states.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. No data or schema rollback is needed.

## Audit Evidence

PR diff, local test output, release gate, ACA deploy readback, and signed-in Contract 360 content proof when available.

## Known Gaps

The contract's purpose still requires a reviewed extraction to become a source-backed narrative. This release does not create or approve that evidence.
