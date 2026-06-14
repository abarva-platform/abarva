# 2026-06-14-product-dev-azure-approval-packet — Product Dev Azure approval packet

## Release ID

`2026-06-14-product-dev-azure-approval-packet`

## Status

`candidate`

## Plain-English Summary

Adds a narrow, human-reviewable approval packet for the first real Azure
environment execution step: Product Dev only. This is not an approval and does
not create or change Azure resources.

## Layer Impact

- `internal-admin`: Gives the founder/platform lane a clear packet to review
  before allowing Azure mutation.
- `global-control-lane`: Keeps the Product Dev environment setup path aligned
  with the product/control-plane model.

## Client Applicability

- All clients: No runtime client impact.
- Specific clients: None.
- Internal only: AbarVa environment setup operators.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/azure/PRODUCT_DEV_APPROVAL_REQUEST_2026-06.md`
- `docs/azure/PRODUCT_DEV_APPROVAL_REQUEST_2026-06.json`
- `docs/approvals/AZURE_MUTATION_APPROVAL_TEMPLATE.md`
- `scripts/azure/verify-product-dev-approval-request.mjs`
- `npm run azure:product-dev-approval:verify`
- Master tracker references to the next approval packet.

## QA / Validation

- PASS: `npm run azure:product-dev-approval:verify`
- PASS: `npm run azure:environment-backlog:verify`
- PASS: `npm run release:check`
- NOT RUN: Azure mutation, subscription creation, policy assignment, RBAC
  assignment, budget creation, DNS change, and traffic shift were intentionally
  not run.

## Rollout Plan

Merge to main as repo-only documentation and validation scaffolding. No Azure
deployment, subscription creation, policy assignment, RBAC assignment, budget
creation, DNS change, secret change, or traffic shift is performed.

## Rollback Plan

Revert the PR to remove the approval request packet and verifier. No runtime or
Azure-resource rollback is needed because this change is non-mutating.

## Audit Evidence

- PR URL.
- CI checks.
- Validation command output from the PR.

## Known Gaps

Actual Product Dev subscription creation remains human-gated and requires a
fully populated `docs/approvals/AZURE_MUTATION_APPROVED.md` in a separate
approval PR.
