# Azure Mutation Approval Template

Status: template only. This file does not authorize Azure mutation.

To authorize real Azure subscription creation or resource changes, copy this template to `docs/approvals/AZURE_MUTATION_APPROVED.md`, fill every required field, commit it in a dedicated approval PR, and keep the approval time-boxed.

Do not create `AZURE_MUTATION_APPROVED.md` with placeholders.

## Required Approval Fields

| Field                                  | Required value                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| Approver name                          | `<human approver>`                                                               |
| Approval timestamp                     | `<YYYY-MM-DDTHH:MM:SSZ>`                                                         |
| Approved time window                   | `<start and end with timezone>`                                                  |
| Azure tenant ID                        | `<tenant id>`                                                                    |
| Subscription IDs or creation authority | `<subscription ids or explicit subscription creation authority>`                 |
| Approved environments                  | `<product-dev only, product-preview, product-prod, client-preprod, client-prod>` |
| Approved commands                      | `<exact command prefixes or exact commands>`                                     |
| Approved spend ceiling                 | `<monthly and one-time ceiling>`                                                 |
| Rollback owner                         | `<human owner>`                                                                  |
| Evidence location                      | `<docs/build/... or execution ledger path>`                                      |

## Required Safety Statements

- I understand this approval permits real Azure mutation only for the approved
  environments and commands listed above.
- I understand this approval does not permit DNS changes, production traffic
  shifts, broad Owner grants, client production data actions, PHI/PII
  exceptions, or secret value disclosure unless explicitly listed above.
- I understand every execution must write an evidence bundle and update the
  environment execution ledger.
- I understand the operator must stop when an unlisted command or environment is
  needed.

## Recommended First Approval Scope

The first approval should be deliberately narrow:

- Environment: Product Dev only.
- Commands: subscription vending, management group placement, baseline policy
  assignment, budget creation, least-privilege RBAC, deployment what-if, and
  read-only evidence export.
- Exclusions: Product Preview, Product Prod, client planes, DNS, traffic shifts,
  production data, secrets, and client-prod resources.
