# ADR-0001 - Control Plane vs Data Plane

## Status

Accepted

## Date

2026-06-01

## Context

AbarVa runs a multi-tenant Next.js application while keeping client facts, evidence, retrieval state, and tenant-scoped records behind data-plane adapters. The repository already separates route/auth concerns from data access concerns:

- `src/lib/auth/tenant-access.ts` gates tenant-scoped route access.
- `src/lib/data-plane/read-adapters/resolveDataPlane.ts` resolves the active read adapter.
- `src/lib/data-plane/read-adapters/azurePostgresReadAdapter.ts` contains the Azure/Postgres read path.
- `src/lib/data-plane/write-adapters/azurePostgresWriteAdapter.ts` contains the Azure/Postgres write path.
- `docs/architecture/ABARVA_PRIVATE_DATA_PLANE_MODEL.md` describes shared SaaS and private data-plane deployment modes.
- `docs/architecture/ABARVA_PLANES_ARCHITECTURE.md` defines app, agent, context, knowledge/evidence, data, model gateway, tool, and governance planes.

The architecture needs a stable decision so new features do not collapse tenant routing, auth, retrieval, and storage into one undifferentiated app layer.

## Decision

AbarVa keeps the Vercel-hosted application as the shared control plane and routes client-owned or client-scoped data through the Azure/Postgres data-plane adapters.

The control plane owns app routing, Clerk session handling, tenant access checks, UI composition, release governance, and agent orchestration. The data plane owns client-scoped facts, records, evidence, retrieval chunks, and write/read persistence behind adapter contracts.

Runtime code must not bypass the data-plane adapters for new data-backed features.

## Consequences

- Tenant access can be audited at route, adapter, and database boundaries.
- Data-backed pages can move from compatibility adapters to Azure/Postgres without changing product surfaces.
- Private data-plane deployment remains possible because app code depends on adapter contracts rather than direct storage clients.
- New work must identify whether it changes control-plane behavior, client-data behavior, or both.
- Some compatibility-era names may remain in tests, shims, migrations, or docs, but new runtime dependencies should follow the Azure/Postgres adapter path.

## Alternatives

- Put all runtime reads directly in page components. Rejected because it makes tenant isolation and private data-plane cutover harder to audit.
- Keep storage-provider calls scattered across feature modules. Rejected because provider migration would require broad product-surface rewrites.
- Use one global data path for all clients with no adapter boundary. Rejected because it weakens private data-plane and per-client deployment options.

## References

- `AGENTS.md`
- `src/lib/auth/tenant-access.ts`
- `src/lib/data-plane/read-adapters/resolveDataPlane.ts`
- `src/lib/data-plane/read-adapters/azurePostgresReadAdapter.ts`
- `src/lib/data-plane/write-adapters/azurePostgresWriteAdapter.ts`
- `docs/architecture/ABARVA_PRIVATE_DATA_PLANE_MODEL.md`
- `docs/architecture/ABARVA_PLANES_ARCHITECTURE.md`
