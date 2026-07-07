# 2026-06-13-env-identity-rbac-model — Environment Identity/RBAC Model

## Release ID

`2026-06-13-env-identity-rbac-model`

## Status

`candidate`

## Plain-English Summary

Adds the enforceable identity and RBAC model for AbarVa's three product-development environments and future client private data-plane environments. It defines who can operate Product Dev, Product Preview, Product Prod, Client Preprod, and Client Prod; where agents are allowed; and where explicit human approval is mandatory.

## Layer Impact

- `global-control-lane`: Adds environment governance for Azure subscription vending and operator access.
- `internal-admin`: Defines safe operator/agent access boundaries before actual Azure RBAC assignment.

## Client Applicability

- All clients: Applies to the future client environment factory pattern.
- Specific clients: None.
- Internal only: Applies immediately to AbarVa product-development environment planning.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/azure/ENVIRONMENT_IDENTITY_RBAC_MODEL_2026-06.md`
- `docs/azure/ENVIRONMENT_IDENTITY_RBAC_MODEL_2026-06.json`
- `scripts/azure/verify-environment-rbac-model.mjs`
- `npm run azure:environment-rbac:verify`
- Production-readiness CI gate now verifies the RBAC model.

## QA / Validation

- PASS — `npm run azure:environment-rbac:verify`
- PASS — `npm run azure:environment-factory:verify`
- PASS — `npm run azure:environment-vending:verify`
- PASS — `npm run release:check`

## Rollout Plan

Merge to main. No Azure role assignments, subscription changes, DNS changes, data loads, or runtime deployments occur in this slice.

Future Azure execution must use this model before assigning human, agent, or managed identity access.

## Rollback Plan

Revert this PR to remove the RBAC model and CI verifier. No Azure rollback is required because this slice is non-mutating.

## Audit Evidence

- PR diff and CI output.
- Verifier output from `npm run azure:environment-rbac:verify`.
- This release record.

## Known Gaps

Actual Azure RBAC assignments are not created in this slice. Subscription creation and broad RBAC assignment remain explicit human approval gates.
