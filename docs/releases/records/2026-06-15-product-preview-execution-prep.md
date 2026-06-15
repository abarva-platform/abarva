# 2026-06-15-product-preview-execution-prep — Product Preview Execution Prep

## Release ID

`2026-06-15-product-preview-execution-prep`

## Status

`candidate`

## Plain-English Summary

Product Preview execution is ready to continue, but Azure throttled subscription
creation twice. This slice records the approval addendum, standardizes the
planning budget model to USD 500/month per environment, prepares the Product
Preview runtime parameter file, and captures the throttle evidence. No Product
Preview subscription or resources were created.

## Layer Impact

- `global-control-lane`: Updates the AbarVa product/control-plane environment
  setup packet and IaC parameters for Product Preview.
- `internal-admin`: Records the Azure subscription-creation throttle and next
  retry action.

## Client Applicability

- All clients: No direct client impact.
- Specific clients: None.
- Internal only: Product Preview environment setup only.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Product Preview approval addendum:
  `docs/approvals/AZURE_MUTATION_APPROVED.md`
- Environment budget normalization to USD 500/month in planning packets:
  - `docs/azure/PRODUCT_PREVIEW_PROVISIONING_PACKET_2026-06.md`
  - `docs/azure/PRODUCT_PREVIEW_PROVISIONING_PACKET_2026-06.json`
  - `docs/azure/PRODUCT_PROD_PROVISIONING_PACKET_2026-06.md`
  - `docs/azure/PRODUCT_PROD_PROVISIONING_PACKET_2026-06.json`
  - `docs/azure/PRODUCT_BASELINE_WHATIF_PACKET_2026-06.json`
  - `docs/azure/ENVIRONMENT_NAMING_TAGGING_BUDGETS_2026-06.md`
  - `docs/azure/ENVIRONMENT_NAMING_TAGGING_BUDGETS_2026-06.json`
  - `docs/environments/product-preview/azure-parameters.example.json`
- Product Preview runtime parameters:
  `infra/azure/parameters/product-preview-runtime.bicepparam`
- Product Preview execution evidence:
  `docs/build/azure/2026-06-15-product-preview-execution/summary.md`

## QA / Validation

- pass: `az bicep build --file infra/azure/product-dev-containerapps-smoke.bicep`
- pass: `az bicep build --file infra/azure/product-dev-runtime-foundation.bicep`
- blocked: `az account alias create` for
  `sub-abarva-product-preview-eus-001` returned `TooManyRequests` twice.
- not-run: Product Preview tag, budget, provider, Key Vault, runtime, and smoke
  steps were not run because subscription creation did not complete.
- not-run: Product Prod, Client Preprod, Client Prod, DNS, traffic shifts,
  secrets, PHI, and PII were not touched.

## Rollout Plan

After Azure subscription API throttling clears, retry Product Preview
subscription alias creation. If it succeeds, continue with tags, budget, provider
registration, secured placeholder Key Vault, runtime smoke baseline, and exports.

## Rollback Plan

No Product Preview resources were created in this slice. If a later retry creates
the subscription and then must stop, export evidence first, then follow the
subscription/resource cleanup runbook under a separate approval.

## Audit Evidence

- `docs/build/azure/2026-06-15-product-preview-execution/summary.md`
- `docs/build/azure/2026-06-15-product-preview-execution/subscription/alias-create.json`
- `docs/build/azure/2026-06-15-product-preview-execution/subscription/alias-create-retry.json`

## Known Gaps

- Product Preview subscription creation is blocked by Azure `TooManyRequests`.
- Product Preview baseline provisioning is not started.
- Product Preview release candidate deployment is not started.
