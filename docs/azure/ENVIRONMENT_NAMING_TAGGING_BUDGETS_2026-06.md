# AbarVa Environment Naming, Tagging, and Budget Baseline

## Purpose

This document defines the naming, tag, and budget-control baseline for AbarVa product-development environments and future client private data-plane environments.

It is intentionally non-mutating. It does not create subscriptions, rename resources, apply tags, create budgets, or change Azure billing settings. It defines the standard that future provisioning must follow.

Machine-readable companion: `docs/azure/ENVIRONMENT_NAMING_TAGGING_BUDGETS_2026-06.json`.

Verifier: `npm run azure:environment-cost-controls:verify`.

## Scope

Product environments:

- Product Dev
- Product Preview
- Product Prod

Client private data-plane pattern:

- Client Preprod
- Client Prod

## Naming Standard

Use canonical environment keys only:

- `product-dev`
- `product-preview`
- `product-prod`
- `client-preprod`
- `client-prod`

Subscription pattern:

- `sub-abarva-{environmentKey}-{regionCode}-{sequence}`

Client subscription pattern:

- `sub-abarva-{clientCode}-{environmentKey}-{regionCode}-{sequence}`

Resource group pattern:

- `rg-abarva-{plane}-{environmentKey}-{regionCode}-{sequence}`

Resource pattern:

- `{resourceAbbrev}-abarva-{plane}-{environmentKey}-{regionCode}-{sequence}`

Client code rule: use canonical short client codes only. Do not use legal/client display names in Azure resource names.

## Required Tags

Every subscription and resource group must have the required tags before workload provisioning:

- `Environment`
- `EnvironmentKey`
- `Plane`
- `Owner`
- `CostCenter`
- `DataClassification`
- `ClientCode`
- `ManagedBy`
- `Repository`
- `ReleaseLane`
- `Criticality`
- `CreatedBy`
- `CreatedAt`
- `Expiry`
- `NoPhiPii`

`NoPhiPii` must be `true`. PHI is not accepted. PII is not accepted.

## Budget Standard

Budgets must exist before runtime workloads are created.

Required budget controls:

- monthly budget per subscription
- alert thresholds at 50%, 80%, and 100%
- alert recipients configured
- cost owner tagged
- execution ledger entry recorded

Default monthly budget planning values:

| Environment     | Default monthly budget |
| --------------- | ---------------------: |
| Product Dev     |                   $500 |
| Product Preview |                 $500 |
| Product Prod    |                 $500 |
| Client Preprod  |                 $500 |
| Client Prod     |                 $500 |

Any budget increase requires explicit approval.

## Forbidden

- Untagged resource creation.
- Runtime workload without a budget.
- Real client legal name in resource name.
- Missing owner tag.
- Missing data classification tag.
- `NoPhiPii=false`.
- Manual resource creation without an execution ledger entry.

## Evidence Required

Every environment must retain:

- subscription name
- resource group name
- tag export
- budget id
- budget thresholds
- budget alert recipients
- cost owner
- execution ledger entry

## What This Does Not Do

This baseline does not mutate Azure. Actual Azure tagging, budget creation, and resource naming enforcement will happen in later provisioning/IaC slices after explicit approval where required.
