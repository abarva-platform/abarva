# ADR-0012 - CMK/BYOK Readiness

## Status

Accepted

## Date

2026-06-03

## Context

AbarVa already documents Azure Key Vault as the managed secrets service for the lab and private data-plane posture:

- `docs/architecture/azure/AZLAB9-scale-test-foundation-baseline.md` records the live lab Key Vault, private endpoint, RBAC authorization, soft delete, and purge protection posture.
- `docs/architecture/azure/AZLAB7-private-data-plane-design.md` defines the customer-owned Private Data Plane where the customer operates Key Vault and AbarVa has zero standing access.
- `docs/security/INFOSEC-ACCELERATOR.md` honestly marks managed-SaaS customer-managed keys as planned while stating that in-VPC/private-data-plane deployments give the customer key custody by design.

The missing architecture decision was not whether to build CMK/BYOK immediately. The backlog item explicitly says: do not build until asked; know the path. The decision needed is the readiness boundary: what must be true before AbarVa claims CMK/BYOK support, and which Azure services carry the design.

## Decision

AbarVa will treat CMK/BYOK as an enterprise readiness posture with two distinct lanes:

1. **Customer-owned Private Data Plane lane.** The customer owns the Azure subscription, Key Vault, keys, logs, resource group, and RBAC assignments. AbarVa can provide templates, images, and support, but does not receive standing Key Vault access. This is the first acceptable path for strict key-custody customers.
2. **Managed SaaS BYOK lane.** AbarVa may later support customer-managed keys in the AbarVa-managed Azure tenancy, but it must not be claimed as implemented until the services using customer content are actually bound to customer-managed keys, the key lifecycle is tested, and support procedures exist.

The implementation path and acceptance gates live in `docs/architecture/azure/CMK_BYOK_READINESS_PLAN.md`.

## Consequences

- Security, sales, and implementation teams can answer CMK/BYOK questions without overclaiming.
- Customer-owned Private Data Plane remains the default answer for customers that require key custody from day one.
- Managed SaaS BYOK remains a planned capability until the documented gates pass.
- Any future runtime implementation must prove key creation, rotation, disable, restore, purge-protection, private endpoint access, diagnostic logging, and rollback behavior before the status can change from planned to supported.
- Release records and security posture docs must continue to distinguish Microsoft-managed encryption at rest from customer-managed key custody.

## Alternatives

- **Build managed SaaS BYOK immediately.** Rejected for now because the current backlog asks for a readiness path, not implementation, and because premature BYOK implementation would touch storage, database, search, backup, support, and incident-response behavior.
- **Claim BYOK through the existing private data-plane design only.** Rejected because in-VPC key custody is valid but does not cover managed SaaS BYOK. The distinction must remain explicit.
- **Defer all documentation until a customer demands BYOK.** Rejected because enterprise security reviews ask this early; AbarVa needs a truthful path before a questionnaire forces a rushed answer.

## References

- `docs/architecture/azure/CMK_BYOK_READINESS_PLAN.md`
- `docs/architecture/azure/AZLAB9-scale-test-foundation-baseline.md`
- `docs/architecture/azure/AZLAB7-private-data-plane-design.md`
- `docs/security/INFOSEC-ACCELERATOR.md`
