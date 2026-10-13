# 2026-10-13 Tower schema private proof boundary

## Release ID

`2026-10-13-tower-schema-private-proof-boundary`

## Status

`candidate`

## Plain-English Summary

The Tower schema workflow checks that its proof identity is attached to the private operator job. The job itself then proves access to private storage by writing its proof, downloading it, and checking its hash. The GitHub runner no longer needs to inspect private storage account permissions through the Azure control plane.

## Layer Impact

- **Release lane:** `client-data-lane` operator orchestration.
- **Layers 1–3:** No intake, adapter, canonical data, or database schema change.
- **Products:** No Tower page or serving change.

## Client Applicability

- **All clients:** The exact Tower schema operator workflow uses this proof boundary.
- **Specific clients:** None.
- **Internal only:** Runner and private operator proof verification.
- **Public/demo only:** No direct change.
- **Feature flag:** None.

## Changes Included

- Keep the exact attached managed identity and client ID checks on the private operator.
- Remove runner-side enumeration of private storage account and role assignments. The private operator's proof upload, download, and SHA-256 readback remain mandatory for read-only status, pre-apply status, and post-apply verification.
- Retain exact migration hashes, ledger checks, active-selection and page checks, digest parity, operator idle restoration, and explicit apply confirmation.

## QA / Validation

- Parse the workflow YAML, inspect the status-before-apply ordering and private proof verifier, run diff hygiene, and run `npm run release:check`.
- A new read-only status run must pass from the deployed workflow before any schema apply is considered. Local checks do not prove private Blob access or database state.

## Rollout Plan

Merge through a protected squash PR and let the repo-owned ACA main deploy workflow publish the exact main image. Dispatch only a read-only Tower schema status run after digest, deploy artifact, and operator idle checks. Review its private Blob proof and idle receipt before any separate apply decision.

## Deployment Authority

- Repo-owned ACA main deploy remains the only shared web traffic authority.
- This change grants no new Azure role and does not alter shared web or worker templates directly.
- Web, sole 100% revision, and required workers must match the approved digest before the operator runs.
- A signed-in product proof is required before calling any later Tower serving change live; this workflow does not change serving.

## Rollback Plan

Stop dispatches and revert this workflow change through a protected PR. This release performs no database write and needs no migration rollback.

## Audit Evidence

Retain the protected PR and CI checks, exact deployment SHA and digest, read-only workflow run, redacted receipt, private Blob proof URI and SHA-256 readback, and operator idle receipt. Full tenant and schema proof stays in private Blob.

## Known Gaps

The read-only status run and private proof must pass after deployment. This release does not authorize a schema apply or data stage.
