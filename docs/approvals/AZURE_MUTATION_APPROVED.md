# Azure Mutation Approval - Product Dev And Product Preview

Status: approved for time-boxed Product Dev and Product Preview execution.

This file authorizes real Azure mutation only for the narrow Product Dev and
Product Preview scopes below. It does not authorize Product Prod, client private
planes, DNS, production traffic shifts, client production data actions, PHI/PII
exceptions, or secret disclosure.

## Required Approval Fields

| Field | Approved value |
| --- | --- |
| Approver name | Anand Sundaram |
| Approval timestamp | 2026-06-15T01:59:22Z |
| Approved time window | 2026-06-14 21:00 CDT through 2026-06-15 05:00 CDT |
| Tenant ID | f5151b70-963c-4124-a888-20a50e8c2e2c |
| Subscription IDs or creation authority | Explicit authority to create or select one Product Dev subscription named `sub-abarva-product-dev-eus-001` and one Product Preview subscription named `sub-abarva-product-preview-eus-001` under the active AbarVa tenant using billing scope `/providers/Microsoft.Billing/billingAccounts/ac56b3df-ea85-52a5-4587-7fc9522dba86:869e137c-c409-49e6-a7d6-02d1ad72d2b5_2019-05-31/billingProfiles/Q3QL-OZWI-BG7-PGB/invoiceSections/be7322e1-97d0-45a3-8f63-bc2facceaa6b`. Current bootstrap context subscription: `701a8554-a166-46e9-bf13-743bc50e3b20` / `abarva-lab-sub`. |
| Approved environments | Product Dev and Product Preview only |
| Approved commands | `az account show`; `az account list`; `az account alias create`; `az account set`; `az provider show`; `az provider register` only for Product Dev/Product Preview required providers; `az deployment sub what-if`; `az deployment sub create`; `az deployment group what-if`; `az deployment group create`; `az group create`; `az resource tag`; `az tag create` only for Product Dev/Product Preview subscription tags; `az policy assignment create` only for approved Product Dev/Product Preview baseline policies; `az role assignment create` only for approved least-privilege Product Dev/Product Preview groups and Anand break-glass ownership; `az consumption budget create`; exact `az rest --method put` only for Product Dev/Product Preview subscription budgets; `az monitor diagnostic-settings create`; `az keyvault create`; `az resource list`; `az group show`; `az policy assignment list`; `az role assignment list`; `az consumption budget list`; `az monitor diagnostic-settings list`; `az keyvault show`; `az containerapp show`; `az containerapp env show` |
| Approved spend ceiling | Product Dev monthly budget ceiling: USD 500. Product Preview monthly budget ceiling: USD 500. One-time provisioning ceiling: stop if any command or estimate indicates non-routine one-time charges outside normal Azure resource consumption. |
| Rollback owner | Anand Sundaram |
| Evidence location | `docs/build/azure/2026-06-14-product-dev-execution/`; `docs/build/azure/2026-06-15-product-dev-finish/`; `docs/build/azure/2026-06-15-product-preview-execution/` |

## Required Safety Statements

- I understand this approval permits real Azure mutation only for Product Dev
  and Product Preview and only for the command scope listed above.
- I understand this approval does not permit DNS changes, production traffic
  shifts, Product Prod, client preprod/prod private planes, client production
  data actions, PHI/PII exceptions, or secret value disclosure.
- I understand every execution must write an evidence bundle and update the
  environment execution ledger.
- I understand the operator must stop when an unlisted command or environment is
  needed.

## Explicit Exclusions

- No Product Prod subscription creation.
- No Client Preprod subscription creation.
- No Client Prod subscription creation.
- No DNS, certificate, or public traffic cutover changes.
- No production app traffic shifts.
- No broad persistent Owner/User Access Administrator grants to agents.
- No client production data action.
- No PHI or PII.
- No secret values in repo, chat, PRs, logs, or evidence bundles.

## Product Dev Boundaries

- Environment key: `product-dev`.
- Subscription display name: `sub-abarva-product-dev-eus-001`.
- Region: `eastus`.
- Data boundary: synthetic, fixture, and engineering-test data only.
- Required budget: USD 500 monthly with 50%, 80%, and 100% alert thresholds.
- Required tags: follow `docs/azure/ENVIRONMENT_NAMING_TAGGING_BUDGETS_2026-06.json`.
- Required RBAC: follow `docs/azure/ENVIRONMENT_IDENTITY_RBAC_MODEL_2026-06.json`.
- Required execution evidence: subscription, tags, policy, RBAC, budget,
  diagnostic settings, what-if output, and final execution summary.

## Product Preview Boundaries

- Environment key: `product-preview`.
- Subscription display name: `sub-abarva-product-preview-eus-001`.
- Region: `eastus`.
- Data boundary: synthetic, pilot-reference, and client-approved redacted data
  only.
- Required budget: USD 500 monthly with 50%, 80%, 100%, and forecasted 100%
  alert thresholds to `admin@abarva.ai` and `alerts@abarva.ai`.
- Required tags: follow `docs/azure/ENVIRONMENT_NAMING_TAGGING_BUDGETS_2026-06.json`.
- Required RBAC: follow `docs/azure/ENVIRONMENT_IDENTITY_RBAC_MODEL_2026-06.json`.
- Required execution evidence: subscription, tags, policy/RBAC exports, budget,
  diagnostic settings, what-if output, runtime smoke proof, and final execution
  summary.

## Approval Addendum - Provider Registration

During execution the newly created Product Dev subscription rejected Key Vault
creation because `Microsoft.KeyVault` was not yet registered. This approval
authorizes `az provider register` only for Product Dev required providers and
only in subscription `58eef48c-3ed6-48e6-9af4-de1848ad3401`.

## Approval Addendum - Modern Azure Tag and Budget APIs

During execution the approved `az resource tag` command could not tag
subscription scope, and the approved `az consumption budget create` command was
rejected by Azure's current budget API. This approval authorizes:

- `az tag create` only for subscription
  `/subscriptions/58eef48c-3ed6-48e6-9af4-de1848ad3401`.
- Exact `az rest --method put` only for Cost Management budget
  `budget-abarva-product-dev-monthly` at subscription
  `/subscriptions/58eef48c-3ed6-48e6-9af4-de1848ad3401`, amount USD 500,
  monthly, with threshold notifications to `admin@abarva.ai`.

## Approval Addendum - Product Preview Replication

Anand approved replicating the Product Dev pattern for Product Preview in this
thread on 2026-06-14 CDT. This addendum authorizes:

- Creating or selecting one Product Preview subscription named
  `sub-abarva-product-preview-eus-001` using the billing scope listed above.
- Applying Product Preview subscription tags.
- Creating the Product Preview USD 500 monthly budget with actual 50%, actual
  80%, actual 100%, and forecasted 100% alerts to `admin@abarva.ai` and
  `alerts@abarva.ai`.
- Registering only the required Product Preview providers.
- Creating Product Preview control-plane and observability resource groups,
  secured placeholder Key Vault, Log Analytics, Application Insights, action
  group, managed identity, Container Apps environment, and scale-to-zero smoke
  app.
- Running only validation/export/read commands needed to prove Product Preview
  setup.

This addendum does not authorize Product Prod, client private-plane resources,
DNS, traffic shifts, secret copying, real app release candidate deployment, or
client data loading.
