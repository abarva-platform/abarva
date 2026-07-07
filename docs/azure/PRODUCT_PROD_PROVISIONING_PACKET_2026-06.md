# Product Prod Provisioning Packet

## Purpose

This packet makes ENV-12 executable without improvising in the Azure portal. It prepares the approval boundary, target controls, evidence, and command templates for creating AbarVa Product Prod.

It is intentionally non-mutating. Do not create the subscription, move management groups, assign RBAC, create budgets, create resources, run migrations, promote a release candidate, shift traffic, or load data from this packet without explicit approval.

Machine-readable companion: `docs/azure/PRODUCT_PROD_PROVISIONING_PACKET_2026-06.json`.

Verifier: `npm run azure:product-prod-provisioning:verify`.

## Target

- Environment: Product Prod
- Subscription display name: `sub-abarva-product-prod-eus-001`
- Management group target: `abarva-product`
- Primary region: East US
- Monthly planning budget: `$500`
- Data allowed: synthetic, approved product telemetry, approved reference data
- Data disallowed: unapproved client-confidential data, client private production data, PHI, PII, raw client private documents

PHI is not accepted. PII is not accepted. Client private production data belongs in client private planes, not Product Prod.

## Role In The Product Delivery Model

Product Prod is the stable product/control-plane runtime. It receives only approved release candidates from Product Preview.

Use Product Prod to operate:

- the stable AbarVa product/control plane
- tenant routing and shared application services
- approved product telemetry and operational monitoring
- synthetic or approved reference data needed for product behavior
- public domain `app.abarva.ai` only after an explicit cutover approval

Product Prod is not the place for pilot client private data. Pilot client data belongs in that client's preprod/prod private-plane subscriptions.

## Approval Boundary

Explicit approval is required before:

- creating the Product Prod subscription
- moving the subscription into a management group
- assigning breakglass Owner
- assigning platform maintainer access
- assigning release operator access
- creating the budget
- applying Azure Policy assignments
- creating baseline resources
- approving a Product Preview release candidate
- promoting a pinned image digest to Product Prod
- running Product Prod smoke
- approving public cutover

## Baseline Controls

Product Prod must inherit or receive:

- deny public blob access
- deny public Postgres
- deny public Key Vault
- require private endpoints for data services
- require tags
- require budget
- require diagnostic settings
- require purge protection
- require pinned release-candidate image digest
- require Product Preview E2E report
- require context health check
- require signed-in browser QA
- require rollback rehearsal
- no PHI/PII
- no client private data

## Required Tags

Minimum tags:

- `Environment=Product Prod`
- `EnvironmentKey=product-prod`
- `Plane=control-plane`
- `Owner=AbarVa Platform`
- `CostCenter=product-development`
- `DataClassification=synthetic-or-approved-product-reference`
- `ClientCode=abarva`
- `ManagedBy=manual-approved`
- `Repository=abarva-platform/abarva`
- `ReleaseLane=global-control-lane`
- `Criticality=critical`
- `NoPhiPii=true`
- `NoClientPrivateData=true`

## Budget

Product Prod requires a monthly budget before runtime workloads are created.

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
- storage account for product artifacts
- Postgres for product control plane
- Azure AI Search for product reference validation
- Application Insights or managed Prometheus
- private DNS zones if private data services exist

## Promotion Prerequisites

Product Prod promotion is blocked until the execution ledger has:

- Product Preview release candidate approval
- pinned image digest
- migration replay green
- Product Preview E2E rehearsal green or explicitly waived
- context health check green or no-go exception
- signed-in browser QA green
- security and license checks green
- rollback command recorded
- explicit public cutover approval

## Command Templates

These are templates only. Do not run without approval.

```bash
az account subscription create \
  --display-name sub-abarva-product-prod-eus-001
```

```bash
az account management-group subscription add \
  --name abarva-product \
  --subscription "<PRODUCT_PROD_SUBSCRIPTION_ID>"
```

```bash
az consumption budget create \
  --subscription "<PRODUCT_PROD_SUBSCRIPTION_ID>" \
  --budget-name budget-product-prod-monthly \
  --amount 500 \
  --time-grain Monthly
```

## Evidence Required

Product Prod is not complete until the execution ledger has:

- approval record
- subscription id
- management group path
- role assignment export
- policy assignment export
- budget id
- budget alert recipients
- tag export
- diagnostic settings export
- Preview release candidate evidence
- pinned image digest
- ACA revision export
- health endpoint 200 proof
- proof that no Vercel runtime headers are present
- proof that no Supabase runtime dependency is present
- context health check report
- signed-in browser QA report
- accessibility smoke report
- rollback revision or digest
- rollback rehearsal evidence
- execution ledger entry

## Rollback / Abandon Plan

If provisioning is approved but later abandoned:

1. Stop runtime workloads.
2. Export activity logs, budgets, role assignments, diagnostics, and resource inventory.
3. Remove timeboxed agent/operator access.
4. Restore prior ACA revision or pinned digest if a release candidate was promoted.
5. Delete empty resource groups after approval.
6. Mark the execution ledger entry as abandoned with reason and evidence.
