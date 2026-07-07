# AbarVa Subscription Vending Runbook

## Purpose

This runbook describes how AbarVa will create the three product-development subscriptions and future client private data-plane subscriptions without turning subscription creation into an improvised one-off exercise.

This runbook is deliberately non-mutating. It defines the execution order, approval gates, evidence requirements, and ledger entries. Actual Azure subscription creation remains a human-approved action.

## Subscription Creation Order

1. Product Dev
2. Product Preview
3. Product Prod
4. First Client Preprod
5. First Client Prod
6. Repeat Client Preprod and Client Prod for each later client

Product subscriptions come first because they establish the promotion path and shared governance baseline. Client subscriptions come later, when the first client private data plane is ready to be provisioned.

## Required Inputs Before Creation

Each subscription creation request must have:

- environment key from `docs/azure/ENVIRONMENT_FACTORY_MANIFEST_2026-06.json`
- subscription display name
- billing scope or enrollment account
- management group target
- Azure region set
- owner and breakglass contacts
- budget amount and alert recipients
- required tags
- policy assignment bundle
- network boundary decision
- data classification boundary
- rollback/abandon plan

## Human Approval Gates

Agents may prepare evidence, generate commands, validate manifests, and draft reports. Agents must pause for explicit human approval before:

- creating a subscription
- moving a subscription into a management group
- assigning broad Owner/User Access Administrator roles
- disabling public network access on a live dependency
- deleting or moving resources
- changing DNS
- deploying to Product Prod or Client Prod
- loading real client production data

## Product Environment Steps

For each product environment:

1. Create subscription after human approval.
2. Assign management group.
3. Apply Azure Policy baseline.
4. Create budget and alerts.
5. Create diagnostic settings and Log Analytics linkage.
6. Provision baseline Key Vault, identity, networking, observability, ACR/ACA where applicable.
7. Run resource parity verifier.
8. Run connectivity smoke from an ACA job if private data-plane services exist.
9. Record evidence in the execution ledger.

## Client Environment Steps

For each client:

1. Create Client Preprod subscription first.
2. Apply policy, budget, identity, network, observability baseline.
3. Provision private data plane.
4. Run dry-run ingestion against client-approved or synthetic reference data.
5. Produce ingestion receipt and retrieval proof.
6. Only after Client Preprod is proven, request approval for Client Prod.
7. Repeat baseline, provisioning, migration, retrieval proof, and rollback evidence in Client Prod.

## Evidence Packet Per Subscription

Each subscription must produce:

- Azure subscription id
- management group path
- policy assignment list
- budget id and alert recipients
- tag compliance report
- private endpoint report
- diagnostic settings report
- Key Vault purge-protection proof
- Postgres public-network-disabled proof when Postgres exists
- Blob public-access-disabled proof when Blob exists
- Azure AI Search public-network-disabled proof when Search exists
- Container Apps job connectivity smoke proof when applicable
- rollback/abandon decision record

## Execution Ledger

Use `docs/azure/ENVIRONMENT_EXECUTION_LEDGER_TEMPLATE_2026-06.json` as the template for every subscription event. The ledger is the audit trail for what was planned, approved, run, verified, and intentionally deferred.

No subscription is considered factory-complete unless its ledger entry has status `verified`.

## Agent Operating Rule

Agents can continue automatically through read-only checks, manifest validation, report generation, and command generation. Agents must stop at human approval gates listed above.
