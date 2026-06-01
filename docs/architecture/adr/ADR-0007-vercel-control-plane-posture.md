# ADR-0007 - Vercel Control Plane with Azure Client Data Plane

## Status

Accepted

## Date

2026-06-01

## Context

ADR-0001 records the control-plane/data-plane split: the Vercel-hosted
application remains the shared control plane while client-owned or
client-scoped data flows through Azure/Postgres data-plane adapters.

The repository now contains several adjacent facts that need one durable
decision:

- `vercel.ts` configures Vercel as the Next.js deployment control surface.
- `docs/deployment/migrations.md` documents production Vercel build behavior
  and migration safety.
- `Dockerfile` and `docs/deployment/DOCKER_RUNTIME_PACKAGING.md` prove a
  non-Vercel container runtime path for Azure Container Apps and other hosts.
- `docs/architecture/azure/AZLAB20-app-parallel-runtime-smoke.md` proves the
  real Next.js runtime can boot in Azure Container Apps and reach Azure
  Postgres through Key Vault-projected `DATABASE_URL`.
- `docs/architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md` records that the
  Azure lab has real services live, but several pilot and production gates
  remain partial.
- `src/lib/data-plane/postgresCompat.ts` and the Azure read/write adapters
  provide the runtime boundary for Azure/Postgres data access.

The risk is architectural drift in either direction. If the team treats
Vercel as the data plane, client data residency and private-lane controls
become hard to defend. If the team prematurely moves the whole control plane
to Azure before parity gates are complete, production reliability and release
control can regress without improving client data custody.

## Decision

AbarVa keeps Vercel as the shared SaaS control plane for the current product
posture, while Azure remains the target and active implementation path for
client-scoped data planes.

The Vercel control plane owns:

1. Next.js application routing and rendering.
2. Clerk session handling and public/authenticated app entry.
3. Shared UI, agent orchestration, release previews, production deploys, and
   control-plane cron behavior.
4. Release governance and deployment safety, including the Vercel build
   wrapper documented in `docs/deployment/migrations.md`.

The Azure client data plane owns:

1. Client-scoped facts, records, evidence, retrieval chunks, and audit rows
   that belong behind adapter contracts.
2. Azure/Postgres read and write paths.
3. Azure Blob or ADLS evidence storage where configured.
4. Private endpoints, Key Vault, managed identity, retention, backup, and
   per-client evidence packs for private data lanes.

New runtime work must not persist client-private payload data directly in the
Vercel control plane. It must route client-scoped persistence through the
data-plane adapter layer and preserve `clients` / `client_id` vocabulary for
new schema-facing documentation and code.

The existence of `Dockerfile` and the Azure Container Apps lab is treated as
portability and future cutover evidence. It is not, by itself, a decision to
replace Vercel as the current production control plane.

## Consequences

- Product and release teams can keep using Vercel previews and production
  deploys while Azure data-plane readiness matures.
- Customer security conversations can describe a clear split: shared SaaS
  control plane on Vercel, client data plane on Azure where required.
- Azure private-data-lane work can advance without forcing an all-at-once
  control-plane migration.
- The team must keep claims precise: Azure lab success is not full production
  parity, and Vercel control-plane hosting is not customer key custody.
- Any future decision to move the control plane to Azure must pass the Azure
  full-stack gates, including private connectivity, security, isolation,
  authenticated product smoke, resilience, audit, observability, and rollback
  evidence.
- Release records for changes touching this boundary should classify whether
  the work is `global-control-lane`, `client-data-lane`, or both.

## Alternatives

- Move the entire app control plane to Azure immediately. Rejected because the
  Azure lab documents still mark important gates as partial and do not prove
  full authenticated product parity.
- Keep all client data in the Vercel-hosted control plane. Rejected because it
  weakens the client data residency, private endpoint, customer Key Vault, and
  private-lane story.
- Maintain Vercel and Azure as two independent full-stack products. Rejected
  because duplicated control planes would increase release risk and make
  audit evidence harder to interpret.
- Treat Docker packaging as the production control-plane migration. Rejected
  because packaging proves portability, not operational parity.

## References

- `AGENTS.md`
- `Dockerfile`
- `vercel.ts`
- `docs/architecture/adr/ADR-0001-control-plane-vs-data-plane.md`
- `docs/architecture/ABARVA_PRIVATE_DATA_PLANE_MODEL.md`
- `docs/architecture/azure/AZLAB20-app-parallel-runtime-smoke.md`
- `docs/architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md`
- `docs/architecture/azure/PILOT-PRIVATE-DATA-LANE-RUNBOOK-2026-05-22.md`
- `docs/deployment/DOCKER_RUNTIME_PACKAGING.md`
- `docs/deployment/migrations.md`
- `docs/security/encryption-posture.md`
- `src/lib/data-plane/postgresCompat.ts`
- `src/lib/data-plane/read-adapters/azurePostgresReadAdapter.ts`
- `src/lib/data-plane/write-adapters/azurePostgresWriteAdapter.ts`
