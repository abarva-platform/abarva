# 2026-09-15-source-contract-intelligence-migration-repair

## Release lane

- Lane: `client-data-lane`
- Layers: Layer 3 canonical/read model and Layer 4 Source projections
- Client applicability: synthetic lab tenant only; no real client data is included

## What changed

The follow-up corrects the SQL expression used to build the hardened contract-intelligence JSON projection. The projection remains additive, explicit-archetype-only, and fail-closed for missing purpose or benchmark evidence. No data contract or UI behavior is intentionally changed.

## Validation

- Local diff and source validation passed.
- The migration will be replayed in CI and applied through the approved ACA operator Job after deployment.
- The operator job must verify both migration records before any Source package reload begins.

## Rollout and rollback

Merge through protected `main`, deploy through the repository-owned ACA workflow, apply the pending migration through the digest-pinned ACA operator Job, and verify the schema readback. Roll back by reverting the migration repair and redeploying the prior approved web image; the additive read model remains removable through the migration rollback procedure.

## Data-plane boundary

This release record does not claim that a contract package was reloaded. Source data reload remains a separate governed ACA Job with package manifest, row-count reconciliation, quality gate, proof bundle, and live readback.
