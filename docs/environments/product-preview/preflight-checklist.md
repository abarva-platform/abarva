# Product Preview Preflight Checklist

Status: non-mutating scaffold

Use this checklist before Product Preview subscription creation or baseline deployment. Product Preview is an AbarVa product/control-plane environment, not a client private data plane.

## Required Before Any Azure Mutation

- `docs/approvals/AZURE_MUTATION_APPROVED.md` exists and names Product Preview.
- The approval file includes tenant, approved environment, approved commands, time window, approver name, and rollback owner.
- Billing scope and management group are known but not hardcoded in repo.
- Budget owner and alert recipients are approved.
- RBAC groups are approved and least-privilege.
- Policy bundle is approved.
- Tags match the naming/tagging/budget model.
- No PHI and no PII are accepted.
- No client raw private documents are included.
- Rollback owner is named.

## Validation-Only Commands

- `npm run azure:environment-factory:verify`
- `npm run azure:environment-vending:verify`
- `npm run azure:environment-rbac:verify`
- `npm run azure:environment-cost-controls:verify`
- `npm run azure:product-preview-provisioning:verify`
- `npm run azure:product-baseline-whatif:verify`
- `npm run azure:environment-backlog:verify`

## Evidence To Capture

Capture the verifier output, the approval reference, and the planned Product Preview ledger entry. If no approval file exists, stop in non-mutating mode.
