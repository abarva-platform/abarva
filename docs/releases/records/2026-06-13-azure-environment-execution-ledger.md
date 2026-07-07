# 2026-06-13-azure-environment-execution-ledger — Azure Environment Execution Ledger

## Release ID

`2026-06-13-azure-environment-execution-ledger`

## Status

`candidate`

## Plain-English Summary

This change turns the Azure environment setup plan into a stricter execution
ledger and command packet. It does not create Azure subscriptions or resources.
It makes the product-dev, product-preview, product-prod, client-preprod, and
client-prod environment classes explicit in the ledger, keeps subscription ids
empty until approved creation, and documents the command shape for the future
product subscription vending run.

## Layer Impact

- `internal-admin`: improves AbarVa's internal environment setup controls and
  evidence trail.
- `global-control-lane`: strengthens release-governance expectations before
  Product Prod exists as a dedicated subscription.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: none.
- Internal only: Azure environment setup operators and release owners.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Expanded `docs/azure/ENVIRONMENT_EXECUTION_LEDGER_TEMPLATE_2026-06.json` to
  cover all five environment classes.
- Added `docs/azure/ENVIRONMENT_SETUP_EXECUTION_STATUS_2026-06.md`.
- Added `docs/azure/PRODUCT_SUBSCRIPTION_COMMAND_PACKET_2026-06.md`.
- Strengthened `scripts/azure/verify-environment-vending-ledger.mjs` so the
  ledger must include all factory environment keys and preserve explicit
  approval gates.

## QA / Validation

Validation status:

- Pass — `npm run azure:environment-factory:verify`
- Pass — `npm run azure:environment-vending:verify`
- Pass — `npm run azure:environment-rbac:verify`
- Pass — `npm run azure:environment-cost-controls:verify`
- Pass — `npm run release:check`

## Rollout Plan

Docs and verifier only. Merge through the protected PR path. No Azure runtime
rollout, no Container Apps deployment, no DNS, no subscription creation, no
RBAC mutation, no budgets, and no data-plane action.

## Rollback Plan

Revert the PR. Because this is non-mutating documentation and verifier logic,
there is no Azure rollback.

## Audit Evidence

- PR diff and CI checks.
- Azure environment verifier command output.
- Release record in this file.

## Known Gaps

- Actual subscription creation remains explicit-approval gated.
- Billing scope, management group, cost center, and budget owner values still
  need to be filled in before the first subscription creation run.
