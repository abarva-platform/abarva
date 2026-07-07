# Client Prod Template

Status: scaffold-ready, not executed

Client Prod is the production private data-plane for a specific client. It is isolated from AbarVa product/control-plane subscriptions and from Client Preprod.

## Required Parameters

- client code and approved client display name
- environment key: `client-prod`
- approved region and data residency stance
- production budget owner and thresholds
- client-prod RBAC groups
- breakglass owner
- policy assignment bundle
- Key Vault and managed identity model
- private endpoint/private DNS design
- retention, deletion, backup, restore, and audit policy

## Required Evidence Before Use

- client signoff
- production readiness checklist
- security readiness checklist
- data boundary validation
- RBAC validation
- budget validation
- monitoring validation
- incident response readiness
- restore/rollback criteria
- no-go criteria
- final signoff table

## Non-Mutation Rule

This template does not create subscriptions or deploy resources. Actual Client Prod actions require explicit approval and must be recorded in the execution ledger.
