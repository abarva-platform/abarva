# 2026-06-13-product-prod-cutover-packet — Product Prod Cutover Packet

## Release ID

`2026-06-13-product-prod-cutover-packet`

## Status

`candidate`

## Plain-English Summary

Adds the non-mutating Product Prod public cutover packet for ENV-13. It defines the evidence, hard stops, approval gates, runtime smoke commands, and rollback proof required before and after any `app.abarva.ai` cutover to Product Prod.

## Layer Impact

- `global-control-lane`: Adds public runtime cutover governance for AbarVa's shared product/control plane.
- `internal-admin`: Adds verifier and CI wiring so DNS, traffic, and public cutover cannot be treated as informal steps.

## Client Applicability

- All clients: Indirectly, because the shared product/control plane hosts the app shell.
- Specific clients: None.
- Internal only: AbarVa platform, release, and operations users.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/azure/PRODUCT_PROD_CUTOVER_PACKET_2026-06.json`
- `docs/azure/PRODUCT_PROD_CUTOVER_PACKET_2026-06.md`
- `scripts/azure/verify-product-prod-cutover-packet.mjs`
- `package.json`
- `.github/workflows/production-readiness-gate.yml`

## QA / Validation

- Pass: `npm run azure:product-prod-cutover:verify`
- Pass: `npm run azure:product-prod-provisioning:verify`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass: `npx eslint scripts/azure/verify-product-prod-cutover-packet.mjs`

## Rollout Plan

Merge to `main`. No runtime rollout occurs from this PR. DNS, Front Door, traffic shifts, Container Apps revision changes, migrations, public cutover, and data actions remain blocked until explicit approval.

## Rollback Plan

Revert the PR to remove the cutover packet and CI verifier. No Azure resources, DNS, traffic, or data are changed by this PR.

## Audit Evidence

- PR URL
- CI production-readiness gate output
- Local verifier output
- Release record

## Known Gaps

This PR does not perform Product Prod cutover. It only defines the evidence and approval bar.
