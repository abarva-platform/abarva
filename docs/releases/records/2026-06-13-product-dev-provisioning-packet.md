# 2026-06-13-product-dev-provisioning-packet — Product Dev Provisioning Packet

## Release ID

`2026-06-13-product-dev-provisioning-packet`

## Status

`candidate`

## Plain-English Summary

Adds the approval-ready provisioning packet for the future AbarVa Product Dev subscription. It records the target subscription name, allowed data boundary, required approval gates, baseline controls, required tags, budget planning value, command templates, and evidence checklist.

## Layer Impact

- `global-control-lane`: Prepares Product Dev subscription creation without mutating Azure.
- `internal-admin`: Defines the operator execution packet and evidence requirements.

## Client Applicability

- All clients: None directly; Product Dev stays synthetic/fixture-only and cannot hold real client data.
- Specific clients: None.
- Internal only: Applies to AbarVa product-development environment setup.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/azure/PRODUCT_DEV_PROVISIONING_PACKET_2026-06.md`
- `docs/azure/PRODUCT_DEV_PROVISIONING_PACKET_2026-06.json`
- `scripts/azure/verify-product-dev-provisioning-packet.mjs`
- `npm run azure:product-dev-provisioning:verify`
- Production-readiness CI gate verifies the packet.

## QA / Validation

- PASS — `npm run azure:product-dev-provisioning:verify`
- PASS — `npm run azure:environment-factory:verify`
- PASS — `npm run azure:environment-rbac:verify`
- PASS — `npm run azure:environment-cost-controls:verify`
- PASS — `npm run release:check`

## Rollout Plan

Merge to main. This is a non-mutating planning and governance slice. Actual subscription creation remains blocked until explicit approval.

## Rollback Plan

Revert this PR to remove the packet and verifier. No Azure rollback is required because no Azure changes are made.

## Audit Evidence

- PR diff and CI output.
- Verifier output from `npm run azure:product-dev-provisioning:verify`.
- This release record.

## Known Gaps

Product Dev is not provisioned by this slice. Subscription creation, RBAC assignment, budget creation, policy assignment, and baseline resource creation require explicit approval and a separate execution ledger entry.
