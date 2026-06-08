# AbarVa Encryption Posture

Date: 2026-06-01
Backlog: T044
Status: posture inventory, not a certification claim
Audience: engineering, release control, customer security review

## Purpose

This document records the encryption posture AbarVa can describe from
verified repository evidence today. It separates current implementation,
platform-inherited controls, Azure lab evidence, target-state commitments, and
known hardening work.

It does not introduce runtime code, migrations, private data-plane
implementation, or a new compliance attestation.

## Scope

In scope:

- Shared SaaS control plane behavior documented in this repository.
- Azure/Postgres and Azure Blob data-plane adapter posture.
- Azure lab and pilot private-data-lane documents that already exist.
- Encryption in transit, encryption at rest, secrets, keys, and customer key
  custody.

Out of scope:

- SOC 2, ISO 27001, HIPAA, or other certification claims.
- A claim that every product route has completed Azure/Postgres cutover.
- A claim that managed-SaaS BYOK is generally available.
- Any new private client data-plane deployment.

## Current Verified Posture

| Area                          | Current posture                                                                                                                                                                                                      | Evidence                                                                                                                                                                                  | Boundary                                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Product data boundary         | AbarVa is designed to work on enterprise context and to reject suspected PHI, PII, direct identifiers, and regulated personal records before storage or indexing.                                                    | `docs/architecture/ABARVA_DATA_PROTECTION_CONTROLS_2026-05-14.md`, `docs/security/INFOSEC-ACCELERATOR.md`, `src/lib/security/sensitive-upload-guard.ts`                                   | This is a product and upload-control posture, not a certification.                                                   |
| Shared control plane          | The current application control plane is Azure Container Apps-hosted Next.js. It owns app routing, Clerk session handling, UI, release behavior, and orchestration.                                                  | `docs/architecture/adr/ADR-0001-control-plane-vs-data-plane.md`, `Dockerfile`, `docs/deployment/migrations.md`, `docs/build/azure-container-apps-cutover-2026-06-07/FINAL_DNS_CUTOVER.md` | Do not describe Vercel as the current production runtime.                                                            |
| Azure runtime path            | A Docker runtime path exists for Azure Container Apps and is the current production path.                                                                                                                            | `Dockerfile`, `docs/deployment/DOCKER_RUNTIME_PACKAGING.md`, `docs/build/azure-container-apps-cutover-2026-06-07/FINAL_DNS_CUTOVER.md`                                                    | Per-client private lanes still need customer-specific evidence before being represented as live.                     |
| Azure/Postgres reads          | Azure/Postgres read adapters exist and use direct `pg` connections from `ABARVA_AZURE_DATABASE_URL` or `DATABASE_URL`.                                                                                               | `src/lib/data-plane/postgresCompat.ts`, `src/lib/data-plane/read-adapters/azurePostgresReadAdapter.ts`                                                                                    | Several docs note parallel-run status; do not claim every app path reads Azure/Postgres.                             |
| Postgres transport encryption | Runtime Postgres config uses SSL for non-local connection strings unless `sslmode=disable` is explicitly present.                                                                                                    | `src/lib/data-plane/postgresCompat.ts`, `src/lib/data-plane/read-adapters/azurePostgresReadAdapter.ts`                                                                                    | The current client configuration uses `rejectUnauthorized: false`; strict CA validation remains a hardening item.    |
| Azure Blob object storage     | The object storage adapter targets Azure Blob Storage through a connection string, account key, or `DefaultAzureCredential`.                                                                                         | `src/lib/data-plane/objectStorage.ts`                                                                                                                                                     | Encryption at rest is inherited from Azure Storage account configuration; the adapter does not itself configure CMK. |
| Azure lab secret projection   | The Azure lab proved Key Vault projection of `DATABASE_URL` into a Container App and direct Azure Postgres connectivity.                                                                                             | `docs/architecture/azure/AZLAB20-app-parallel-runtime-smoke.md`                                                                                                                           | The lab document is synthetic/no-client-data and explicitly not full cutover proof.                                  |
| Azure full-stack lab          | The Azure lab has real services through the documented layers, including Key Vault, private Postgres, Blob Storage, Service Bus, Event Grid, Azure AI Search, Log Analytics, App Insights, and the ingestion worker. | `docs/architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md`                                                                                                                                 | The same document marks multiple gates as partial and lists missing pilot gates.                                     |
| Pilot private data lane       | Pilot private lanes should provision private storage, queues, database, Key Vault secrets, private endpoints, managed identity RBAC, and per-client evidence boundaries.                                             | `docs/architecture/azure/PILOT-PRIVATE-DATA-LANE-RUNBOOK-2026-05-22.md`                                                                                                                   | This is a runbook for the next pilot lane, not evidence that a named client lane is live.                            |

## Encryption in Transit

### Shared Control Plane

The repository does not implement custom TLS termination for the Azure
Container Apps-hosted Next.js control plane. TLS for the public app is
platform-inherited from Azure managed ingress and the bound managed
certificate. Application code should assume that transport security at the
edge is a hosting-platform responsibility, while route authorization and
client scoping remain application responsibilities.

The repo evidence for the Azure control plane is `Dockerfile`,
`docs/deployment/migrations.md`,
`docs/build/azure-container-apps-cutover-2026-06-07/FINAL_DNS_CUTOVER.md`, and
`docs/architecture/adr/ADR-0001-control-plane-vs-data-plane.md`.

### Data Plane

For Postgres access, the Azure/Postgres code paths configure SSL for non-local
connection strings unless the connection string explicitly disables SSL. This
is visible in `src/lib/data-plane/postgresCompat.ts` and
`src/lib/data-plane/read-adapters/azurePostgresReadAdapter.ts`.

Hardening boundary: both code paths currently set `rejectUnauthorized: false`
when SSL is enabled. That still requests encrypted transport, but it does not
strictly validate the server certificate chain. Before customer-private
production lanes, strict certificate validation or an explicitly documented
managed-service exception should be decided and tested.

For Azure Blob access, the object storage adapter creates HTTPS Azure Blob
clients from account configuration in `src/lib/data-plane/objectStorage.ts`.
The adapter does not override Azure transport policy.

## Encryption at Rest

### Shared SaaS

The repository documents managed cloud storage and database encryption as
inherited provider controls. `docs/security/INFOSEC-ACCELERATOR.md` describes
Azure Storage and Postgres encryption at rest as the default current posture,
with customer-managed keys in managed SaaS as planned rather than generally
available.

This document should not be used to claim that every managed-SaaS customer has
BYOK or CMK today.

### Azure Data Plane

The Azure lab and pilot lane documents establish the intended data-plane
posture:

- Azure Postgres for client-scoped relational records.
- Azure Blob Storage or ADLS Gen2 for landed and processed evidence.
- Key Vault for secrets and key custody.
- Private endpoints and private DNS for customer/private data lanes.
- Managed identities and scoped RBAC for runtime access.

The strongest current evidence is lab and runbook evidence, not a named client
production deployment. The live lab is explicitly synthetic/no-client-data in
`docs/architecture/azure/AZLAB20-app-parallel-runtime-smoke.md` and
`docs/architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md`.

## Secrets and Key Custody

Current repository posture:

- Server-only secrets are environment-driven and must not be committed.
- The Docker runtime packaging document requires secrets to come from a vault
  or platform-managed environment injection.
- The Azure lab proved Key Vault projection into Container Apps for
  `DATABASE_URL`.
- Pilot private-data-lane setup requires Key Vault secrets and scoped managed
  identity access.

Customer key custody posture:

- In private data-plane mode, customer-controlled Azure infrastructure and Key
  Vault are the target boundary for client data.
- Managed-SaaS BYOK is documented as planned or target-state, not as broadly
  shipped.
- Key revocation, rotation, and CMK behavior should be validated per customer
  lane before being sold as an implemented control.

## Client Applicability

| Client posture               | Encryption statement that is safe today                                                                                                                                                                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public demo or synthetic lab | Synthetic data only; lab resources demonstrate Key Vault projection, Azure/Postgres connectivity, private-resource checks, and partial Azure gates.                                                                                                                        |
| Shared SaaS pilot            | Control plane is Azure Container Apps-hosted; client-scoped persistence should flow through Azure/Postgres data-plane adapters; cloud-provider encryption controls are inherited; managed-SaaS BYOK is not generally available unless separately provisioned and verified. |
| Customer private data lane   | Target posture is customer-owned Azure data plane with private endpoints, customer Key Vault, scoped managed identities, and customer-controlled retention/logging; treat each lane as requiring its own evidence pack.                                                    |

## Required Evidence Before Stronger Claims

Before AbarVa claims customer-private production encryption posture for a
specific client, collect:

1. Azure resource inventory for that client lane.
2. Private endpoint and public-network-denial evidence for Postgres, Blob,
   Service Bus, Key Vault, and Search as applicable.
3. Key Vault secret and key access policy or RBAC export.
4. Managed identity role assignment export scoped to specific resources.
5. Postgres SSL/certificate validation decision and test output.
6. Storage encryption configuration, including whether CMK is enabled.
7. Backup, restore, key rotation, and key revocation drill evidence.
8. Cross-client isolation evidence using `clients` and `client_id` scoped data.

## Open Hardening Items

| Item                                            | Why it matters                                                                                                  | Status                                                                                    |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Strict Postgres certificate validation decision | Encrypted transport without strict server certificate validation leaves ambiguity in customer security reviews. | Open hardening item.                                                                      |
| Managed-SaaS BYOK evidence                      | Buyers may ask whether AbarVa-managed SaaS supports customer-managed keys.                                      | Planned/target-state unless separately implemented and evidenced.                         |
| Per-client encryption evidence pack             | Encryption posture must be provable per customer lane, not only described globally.                             | Required before private client launch.                                                    |
| Negative public-path tests                      | Private data resources should fail from public clients by network or firewall policy, not only by auth failure. | Listed as a missing L2 gate in `docs/architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md`. |
| Authenticated Azure product smoke               | Azure runtime proof does not yet prove every authenticated client flow.                                         | Listed as missing in `docs/architecture/azure/AZLAB20-app-parallel-runtime-smoke.md`.     |

## References

- `AGENTS.md`
- `Dockerfile`
- `Dockerfile`
- `docs/build/azure-container-apps-cutover-2026-06-07/FINAL_DNS_CUTOVER.md`
- `docs/architecture/adr/ADR-0001-control-plane-vs-data-plane.md`
- `docs/architecture/ABARVA_DATA_PROTECTION_CONTROLS_2026-05-14.md`
- `docs/architecture/ABARVA_PRIVATE_DATA_PLANE_MODEL.md`
- `docs/architecture/azure/AZLAB20-app-parallel-runtime-smoke.md`
- `docs/architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md`
- `docs/architecture/azure/PILOT-PRIVATE-DATA-LANE-RUNBOOK-2026-05-22.md`
- `docs/deployment/DOCKER_RUNTIME_PACKAGING.md`
- `docs/deployment/migrations.md`
- `docs/security/INFOSEC-ACCELERATOR.md`
- `src/lib/data-plane/objectStorage.ts`
- `src/lib/data-plane/postgresCompat.ts`
- `src/lib/data-plane/read-adapters/azurePostgresReadAdapter.ts`
- `src/lib/security/sensitive-upload-guard.ts`
