# 2026-06-13-product-prod-provisioning-packet — Product Prod Provisioning Packet

## Release ID

`2026-06-13-product-prod-provisioning-packet`

## Status

`candidate`

## Plain-English Summary

Adds the non-mutating Product Prod provisioning packet for the three-environment AbarVa product development model. The packet defines the target subscription, approval gates, budget, no-PHI/no-PII/no-client-private-data boundary, promotion prerequisites, rollback expectations, and evidence that must exist before Product Prod can be considered ready.

## Layer Impact

- `global-control-lane`: Adds Product Prod environment governance for AbarVa's shared product/control plane.
- `internal-admin`: Adds verifier and CI wiring so operators cannot silently drift the Product Prod provisioning contract.

## Client Applicability

- All clients: None directly. This is an AbarVa product/control-plane planning and governance artifact.
- Specific clients: None.
- Internal only: AbarVa platform, release, and operations users.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/azure/PRODUCT_PROD_PROVISIONING_PACKET_2026-06.json`
- `docs/azure/PRODUCT_PROD_PROVISIONING_PACKET_2026-06.md`
- `scripts/azure/verify-product-prod-provisioning-packet.mjs`
- `package.json`
- `.github/workflows/production-readiness-gate.yml`

## QA / Validation

- Pass: `npm run azure:product-prod-provisioning:verify`
- Pass: `npm run azure:product-preview-e2e-rehearsal:verify`
- Pass: `npm run audit:architecture-rules`
- Pass: `npx eslint scripts/azure/verify-product-prod-provisioning-packet.mjs`
- Pass: `npm run release:check`

## Rollout Plan

Merge to `main`. No runtime rollout occurs from this PR. Product Prod subscription creation, RBAC, budgets, resources, release promotion, migrations, traffic, DNS, and data actions remain blocked until explicit approval.

## Rollback Plan

Revert the PR to remove the Product Prod packet and CI verifier. No Azure resources or data are created by this change.

## Audit Evidence

- PR URL
- CI production-readiness gate output
- Local verifier output
- Release record

## Known Gaps

The Product Prod subscription and resources are not created by this PR. That execution requires explicit approval and evidence capture.
