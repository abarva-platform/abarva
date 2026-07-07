# Product Preview Provisioning Packet

Status: non-mutating scaffold

Product Preview is the AbarVa product/control-plane preproduction environment. It is not Client Preprod. It exists to prove a release candidate with synthetic, pilot-reference, or client-approved redacted data before anything is promoted to Product Prod.

Canonical source: `docs/azure/PRODUCT_PREVIEW_PROVISIONING_PACKET_2026-06.md` and `docs/azure/PRODUCT_PREVIEW_PROVISIONING_PACKET_2026-06.json`.

## Environment Separation

| Environment     | Purpose                      | Data boundary                                                        |
| --------------- | ---------------------------- | -------------------------------------------------------------------- |
| Product Dev     | Fast engineering integration | synthetic, fixture, engineering-test only                            |
| Product Preview | Release-candidate proof      | synthetic, pilot-reference, client-approved redacted                 |
| Product Prod    | Shared product control plane | approved product telemetry and reference/control-plane metadata only |

Client Preprod and Client Prod are separate client private data-plane environments and are not created by this packet.

## Required Assumptions

- Subscription: dedicated Product Preview subscription after explicit approval.
- Management group: product platform management group.
- Tags: Environment, EnvironmentKey, Plane, Owner, CostCenter, DataClassification, ClientCode, ManagedBy, Repository, ReleaseLane, Criticality, NoPhiPii.
- Budget: monthly budget and alerts before runtime workload deployment.
- RBAC: least privilege groups only; broad Owner/User Access Administrator assignments require approval.
- Policy: deny public blob, Postgres, and Key Vault access; require tags, diagnostic settings, private endpoints for data services, purge protection, and no PHI/PII.
- Logging: Log Analytics, activity logs, diagnostic settings, health endpoint evidence, release-candidate evidence.
- Key Vault: environment-scoped vault, managed identity access, no secrets in repo.
- Network: private data services by default; Container Apps VNet integration for private jobs.

## Preflight

Run `docs/environments/product-preview/preflight-checklist.md` before any approved Azure action.

## Dry-Run Validation

Run `npm run azure:product-preview-provisioning:verify` and `npm run azure:product-baseline-whatif:verify`. The what-if packet is validation-only and does not create Azure resources.

## Post-Provision Validation

Run `docs/environments/product-preview/post-provision-validation.md` only after an approved subscription exists. Evidence must be attached to the execution ledger.

## Explicit Non-Mutation Note

This packet creates no Azure subscription, no budget, no RBAC assignment, no policy assignment, no Key Vault, no network, no resource, no DNS, and no traffic shift.
