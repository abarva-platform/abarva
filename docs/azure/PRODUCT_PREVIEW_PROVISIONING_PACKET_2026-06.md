# Product Preview Provisioning Packet

## Purpose

This packet makes ENV-09 executable without improvising in the Azure portal. It prepares the approval boundary, target controls, evidence, and command templates for creating AbarVa Product Preview.

It is intentionally non-mutating. Do not create the subscription, move management groups, assign RBAC, create budgets, create resources, run migrations, deploy release candidates, shift traffic, or load data from this packet without explicit approval.

Machine-readable companion: `docs/azure/PRODUCT_PREVIEW_PROVISIONING_PACKET_2026-06.json`.

Verifier: `npm run azure:product-preview-provisioning:verify`.

## Target

- Environment: Product Preview
- Subscription display name: `sub-abarva-product-preview-eus-001`
- Management group target: `abarva-product`
- Primary region: East US
- Monthly planning budget: `$500`
- Data allowed: synthetic, pilot-reference, client-approved-redacted
- Data disallowed: unapproved client-confidential data, PHI, PII, raw client private documents

PHI is not accepted. PII is not accepted.

## Role In The Product Delivery Model

Product Preview is the release-candidate proving ground. Product Dev can move quickly; Product Preview must prove that a release is production-like before it is promoted to Product Prod.

Use Product Preview to validate:

- pinned container images by digest
- migration replay and rollback plan
- context health checks
- signed-in browser QA
- ingestion receipts and citation proof for approved synthetic or redacted data
- ACA revision health
- absence of Vercel runtime headers
- release evidence for pilot demonstrations

## Approval Boundary

Explicit approval is required before:

- creating the Product Preview subscription
- moving the subscription into a management group
- assigning breakglass Owner
- assigning platform maintainer access
- assigning release operator access
- creating the budget
- applying Azure Policy assignments
- creating baseline resources
- deploying a release candidate
- running preview acceptance
- approving promotion to Product Prod

## Baseline Controls

Product Preview must inherit or receive:

- deny public blob access
- deny public Postgres
- deny public Key Vault
- require private endpoints for data services
- require tags
- require budget
- require diagnostic settings
- require purge protection
- require pinned release-candidate image digest
- require context health check
- require signed-in browser QA
- no PHI/PII

## Required Tags

Minimum tags:

- `Environment=Product Preview`
- `EnvironmentKey=product-preview`
- `Plane=control-plane`
- `Owner=AbarVa Platform`
- `CostCenter=product-development`
- `DataClassification=synthetic-or-client-approved-redacted`
- `ClientCode=abarva`
- `ManagedBy=manual-approved`
- `Repository=abarva-platform/abarva`
- `ReleaseLane=global-control-lane`
- `Criticality=high`
- `NoPhiPii=true`

## Budget

Product Preview requires a monthly budget before runtime workloads are created.

- Monthly budget: `$500`
- Alert thresholds: `50%`, `80%`, `100%`
- Budget increases require explicit approval.

## Planned Resource Families

Create only after approval:

- control-plane resource group
- Log Analytics workspace
- Key Vault
- Container Apps environment
- web Container App
- operator jobs
- ACR pull scope
- storage account for preview artifacts
- Postgres for preview release validation
- Azure AI Search for preview release validation
- Application Insights or managed Prometheus
- private DNS zones if private data services exist

## Command Templates

These are templates only. Do not run without approval.

```bash
az account subscription create \
  --display-name sub-abarva-product-preview-eus-001
```

```bash
az account management-group subscription add \
  --name abarva-product \
  --subscription "<PRODUCT_PREVIEW_SUBSCRIPTION_ID>"
```

```bash
az consumption budget create \
  --subscription "<PRODUCT_PREVIEW_SUBSCRIPTION_ID>" \
  --budget-name budget-product-preview-monthly \
  --amount 500 \
  --time-grain Monthly
```

## Evidence Required

Product Preview is not complete until the execution ledger has:

- approval record
- subscription id
- management group path
- role assignment export
- policy assignment export
- budget id
- budget alert recipients
- tag export
- diagnostic settings export
- pinned image digest
- ACA revision export
- health endpoint 200 proof
- proof that no Vercel runtime headers are present
- context health check report
- signed-in browser QA report
- accessibility smoke report
- rollback revision or digest
- execution ledger entry

## Rollback / Abandon Plan

If provisioning is approved but later abandoned:

1. Stop runtime workloads.
2. Export activity logs, budgets, role assignments, diagnostics, and resource inventory.
3. Remove timeboxed agent/operator access.
4. Restore prior ACA revision or pinned digest if a release candidate was deployed.
5. Delete empty resource groups after approval.
6. Mark the execution ledger entry as abandoned with reason and evidence.
