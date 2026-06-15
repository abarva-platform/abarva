# Product Preview Azure Execution Summary

Status date: 2026-06-15 CDT

## Result

Product Preview setup was prepared, but Azure subscription creation did not
complete because Azure returned `TooManyRequests` twice for subscription alias
creation.

No Product Preview subscription or resources were created.

## Prepared

- Product Preview approval added to `docs/approvals/AZURE_MUTATION_APPROVED.md`
  for the current time-boxed execution window.
- Product Preview budget model corrected to USD 500/month across the Preview
  packet, baseline what-if packet, naming/budget model, and environment example
  parameters.
- Product Preview runtime parameter file added:
  `infra/azure/parameters/product-preview-runtime.bicepparam`.
- Runtime smoke module updated so the same template can emit correct
  `product-dev` or `product-preview` environment labels.

## Attempted

Command attempted twice:

```bash
az account alias create \
  --name sub-abarva-product-preview-eus-001 \
  --display-name sub-abarva-product-preview-eus-001 \
  --workload Production
```

Both attempts returned:

```text
TooManyRequests: Subscription is not created. Please try again later.
```

Evidence:

- `subscription/account-list-preview-before.json`
- `subscription/alias-create.json`
- `subscription/alias-show-after-throttle.err`
- `subscription/account-list-preview-after-throttle.json`
- `subscription/alias-create-retry.json`

## Current Blocker

Azure subscription creation is throttled. The next safe step is to retry Product
Preview subscription creation after the Azure billing/subscription API throttle
clears.

## Not Run

- No management-group placement.
- No Product Preview tags.
- No Product Preview budget.
- No Product Preview provider registration.
- No Product Preview Key Vault.
- No Product Preview runtime deploy.
- No Product Preview smoke proof.
- No Product Prod, Client Preprod, or Client Prod actions.
- No DNS or traffic changes.
- No secrets, PHI, or PII.
