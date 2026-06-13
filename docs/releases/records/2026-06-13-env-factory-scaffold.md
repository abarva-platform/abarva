# 2026-06-13-env-factory-scaffold — Azure Environment Factory Scaffold

## Release ID

`2026-06-13-env-factory-scaffold`

## Status

`candidate`

## Plain-English Summary

This release adds the first machine-checkable baseline for AbarVa's Azure environment factory. It defines the three product-development subscriptions (Product Dev, Product Preview, Product Prod), the client private data-plane pattern (Client Preprod and Client Prod per client), and the hard data/governance rules that must hold before subscription vending begins.

## Layer Impact

- `global-control-lane`: adds repo-enforced environment governance for all product and client environment work.
- `internal-admin`: supports AbarVa-only environment cutover planning and subscription factory execution.

## Client Applicability

- All clients: indirectly protected because future client private data-plane subscriptions must follow the same pattern.
- Specific clients: none.
- Internal only: applies to AbarVa environment factory readiness.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `docs/azure/ABARVA_ENVIRONMENT_FACTORY_2026-06.md`.
- Adds `docs/azure/ENVIRONMENT_FACTORY_MANIFEST_2026-06.json`.
- Adds `scripts/azure/verify-environment-factory-scaffold.mjs`.
- Adds `npm run azure:environment-factory:verify`.
- Wires the environment-factory verifier into `.github/workflows/production-readiness-gate.yml`.

## QA / Validation

- `npm run azure:environment-factory:verify` must pass.
- `npm run release:check -- --base origin/main --head HEAD` must pass.
- Production-readiness CI must pass after the new verifier is wired.

## Rollout Plan

Merge to main. This is documentation and CI verification only. It does not create Azure subscriptions, deploy resources, run migrations, change DNS, or shift traffic.

## Rollback Plan

Revert this PR to remove the environment-factory manifest, verifier, and production-readiness workflow step. Because this is additive governance only, rollback has no runtime or data impact.

## Audit Evidence

- Machine-readable manifest at `docs/azure/ENVIRONMENT_FACTORY_MANIFEST_2026-06.json`.
- Human-readable baseline at `docs/azure/ABARVA_ENVIRONMENT_FACTORY_2026-06.md`.
- Verifier output from `npm run azure:environment-factory:verify`.
- Pull request CI after opening the PR.

## Known Gaps

- This does not yet vend subscriptions.
- This does not yet apply Azure Policy assignments.
- This does not yet clean or migrate the existing lab resources.
- This does not yet define per-client Bicep parameter files for specific future clients.
