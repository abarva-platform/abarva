# 2026-06-13-product-preview-provisioning-packet — Product Preview Provisioning Packet

## Release ID

`2026-06-13-product-preview-provisioning-packet`

## Status

`candidate`

## Plain-English Summary

Adds a non-mutating execution packet for AbarVa Product Preview. The packet defines the approval gates, budget, tags, controls, evidence, and command templates needed before creating or using the Product Preview subscription.

No Azure resources are created by this change. No subscription, RBAC, budget, DNS, deployment, migration, traffic shift, or data load is performed.

## Layer Impact

- `global-control-lane`: Adds product-environment governance documentation and CI verification for the Product Preview operating model.
- `internal-admin`: Gives AbarVa operators an executable checklist for future approved provisioning.

## Client Applicability

- All clients: Indirectly, because Product Preview becomes the AbarVa release-candidate proving ground before Product Prod.
- Specific clients: None.
- Internal only: Yes, this is an AbarVa product-development environment packet.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/azure/PRODUCT_PREVIEW_PROVISIONING_PACKET_2026-06.md`
- `docs/azure/PRODUCT_PREVIEW_PROVISIONING_PACKET_2026-06.json`
- `scripts/azure/verify-product-preview-provisioning-packet.mjs`
- `npm run azure:product-preview-provisioning:verify`
- Production-readiness gate wiring for the verifier.

## QA / Validation

- PASS — `npm run azure:product-preview-provisioning:verify`
- PASS — `npm run azure:environment-factory:verify`
- PASS — `npm run azure:environment-rbac:verify`
- PASS — `npm run azure:environment-cost-controls:verify`
- PASS — `npm run audit:architecture-rules`
- PASS — `npm run release:check`

## Rollout Plan

Merge to `main`. The change is documentation and CI guardrail only. Actual Product Preview provisioning requires a separate explicit approval and execution ledger entry.

## Rollback Plan

Revert the PR. Since this is non-mutating, rollback only removes the packet and CI verifier.

## Audit Evidence

- PR URL.
- CI run showing the product-preview provisioning verifier and production-readiness gate passing.
- Release record.

## Known Gaps

The Product Preview subscription and resources are not created by this PR. Provisioning remains approval-gated.
