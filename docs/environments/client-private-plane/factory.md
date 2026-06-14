# Client Private-Plane Factory

Status: non-mutating scaffold

This factory describes how AbarVa creates isolated client private data-plane environments. It is separate from Product Dev, Product Preview, and Product Prod.

Canonical source: `docs/azure/CLIENT_PRIVATE_PLANE_FACTORY_2026-06.md` and `docs/azure/CLIENT_PRIVATE_PLANE_FACTORY_2026-06.json`.

## Environment Model

Each client receives two distinct private-plane environments:

- Client Preprod: validation, ingestion rehearsal, retrieval proof, acceptance testing.
- Client Prod: production client private data plane and runtime evidence.

## Boundary

The AbarVa product/control plane contains shared product code, routing metadata, release orchestration, and approved product telemetry. The client private data plane contains client-approved context, source evidence, artifacts, indexes, private databases, private storage, and client-scoped runtime jobs.

## Required Controls

- Sensitive data boundary: no PHI; no PII unless a future contract and governance update explicitly allows it.
- Evidence boundary: source files, parsed records, facts, chunks, artifacts, and traces stay tenant/client scoped.
- Model routing boundary: agent calls must use validated context bundles; no ungoverned context reaches Claude/OpenAI.
- Identity/RBAC: client-scoped roles, least privilege, breakglass documented, broad RBAC approval required.
- Network: private endpoints for data services; private worker path for ingestion and migrations.
- Logging/audit: activity logs, diagnostic settings, immutable or retained audit store, context bundle traces.
- Key Vault: client-environment-scoped secrets and managed identity access.
- Retention: client-specific retention and deletion plan before Client Prod.
- Parameterization: client code, environment key, region, budget, tags, RBAC group ids, policy bundle, retention policy.

## Non-Mutating Flow

This factory creates no subscriptions, budgets, policies, networks, private endpoints, data services, or client data. Actual execution requires `docs/approvals/AZURE_MUTATION_APPROVED.md`.
