# Product Dev Provisioning Packet

## Purpose

This packet makes ENV-06 executable without improvising in the Azure portal. It prepares the exact approval boundary, inputs, controls, evidence, and command templates for creating AbarVa Product Dev.

It is intentionally non-mutating. Do not create the subscription, move management groups, assign RBAC, create budgets, create resources, or run deployment jobs from this packet without explicit approval.

Machine-readable companion: `docs/azure/PRODUCT_DEV_PROVISIONING_PACKET_2026-06.json`.

Verifier: `npm run azure:product-dev-provisioning:verify`.

## Target

- Environment: Product Dev
- Subscription display name: `sub-abarva-product-dev-eus-001`
- Management group target: `abarva-product`
- Primary region: East US
- Monthly planning budget: `$500`
- Data allowed: synthetic, fixture, engineering-test
- Data disallowed: client-confidential, PHI, PII, raw client private documents

PHI is not accepted. PII is not accepted.

## Approval Boundary

Explicit approval is required before:

- creating the Product Dev subscription
- moving the subscription into a management group
- assigning breakglass Owner
- assigning platform maintainer access
- creating the budget
- applying Azure Policy assignments
- creating baseline resources

## Baseline Controls

Product Dev must inherit or receive:

- deny public blob access
- deny public Postgres
- deny public Key Vault
- require private endpoints for data services
- require tags
- require budget
- require diagnostic settings
- require purge protection
- no PHI/PII

## Required Tags

Minimum tags:

- `Environment=Product Dev`
- `EnvironmentKey=product-dev`
- `Plane=control-plane`
- `Owner=AbarVa Platform`
- `CostCenter=product-development`
- `DataClassification=synthetic`
- `ClientCode=abarva`
- `ManagedBy=manual-approved`
- `Repository=abarva-platform/abarva`
- `ReleaseLane=global-control-lane`
- `Criticality=medium`
- `NoPhiPii=true`

## Budget

Product Dev requires a monthly budget before runtime workloads are created.

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
- ACR or pull scope
- storage account for synthetic artifacts
- Postgres for synthetic dev if needed
- Azure AI Search for synthetic dev if needed

## Command Templates

These are templates only. Do not run without approval.

```bash
az account subscription create \
  --display-name sub-abarva-product-dev-eus-001
```

```bash
az account management-group subscription add \
  --name abarva-product \
  --subscription "<PRODUCT_DEV_SUBSCRIPTION_ID>"
```

```bash
az consumption budget create \
  --subscription "<PRODUCT_DEV_SUBSCRIPTION_ID>" \
  --budget-name budget-product-dev-monthly \
  --amount 500 \
  --time-grain Monthly
```

## Evidence Required

Product Dev is not complete until the execution ledger has:

- approval record
- subscription id
- management group path
- role assignment export
- policy assignment export
- budget id
- budget alert recipients
- tag export
- diagnostic settings export
- connectivity smoke if private data services exist
- rollback/abandon plan

## Rollback / Abandon Plan

If provisioning is approved but later abandoned:

1. Stop runtime workloads.
2. Export activity logs, budgets, role assignments, and resource inventory.
3. Remove timeboxed agent/operator access.
4. Delete empty resource groups after approval.
5. Mark the execution ledger entry as abandoned with reason and evidence.
