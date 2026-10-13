# 2026-10-13 Tower schema proof state verifier

## Release ID

`2026-10-13-tower-schema-proof-state-verifier`

## Status

`candidate`

## Plain-English Summary

The Tower schema status workflow accepts a valid read-only result in its observed state and still checks every required proof field. A small verifier error previously stopped the workflow after the private operator had completed. This change lets the redacted status receipt complete while retaining the same checks on migration hashes, active Tower pages, candidate absence, and private proof readback.

## Layer Impact

- **Release lane:** `client-data-lane` operator proof verification.
- **Layers 1–3:** No intake, adapter, canonical data, or database schema change.
- **Products:** No Tower page or serving change.

## Client Applicability

- **All clients:** The exact Tower schema workflow uses this verifier.
- **Specific clients:** None.
- **Internal only:** Read-only operator proof validation.
- **Public/demo only:** No direct change.
- **Feature flag:** None.

## Changes Included

- Resolve the workflow's `any` state request into a new constant instead of assigning to its original constant.
- Add a focused regression that accepts a valid read-only `ready` proof and rejects a mismatched expected state.
- Keep the exact target SQL hashes, target ledger, private Blob readback, active selector, page fingerprints, candidate absence, and unrelated ledger checks.

## QA / Validation

- Run the focused proof verifier regression, targeted ESLint, diff hygiene, and `npm run release:check`.
- The next read-only workflow run must pass end to end with private proof and operator idle restoration before any apply is considered.

## Rollout Plan

Merge through a protected squash PR and let the repo-owned ACA main deploy workflow publish the exact image. Run a read-only Tower schema status workflow on main and review its private proof and idle receipt. Apply remains separately gated.

## Deployment Authority

- Repo-owned ACA main deploy remains the only shared web traffic authority.
- This change grants no Azure role and does not alter shared web or worker templates directly.
- Web, sole 100% revision, and required workers must match the approved digest before the operator runs.
- A signed-in product proof is required before calling any later Tower serving change live; this verifier does not change serving.

## Rollback Plan

Stop dispatches and revert the verifier through a protected PR. This release performs no database write and needs no migration rollback.

## Audit Evidence

Retain the protected PR, CI result, exact deploy SHA and digest, read-only workflow receipt, private Blob proof SHA/URI and readback, and operator idle receipt. Full tenant and schema proof stays private.

## Known Gaps

A complete read-only workflow pass is still required after deployment. This release does not authorize schema apply or data stage.
