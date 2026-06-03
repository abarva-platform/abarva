# Client Tenant IaC Manifest

Date: 2026-06-03

Status: candidate scaffold

## Purpose

Provide a reproducible Azure IaC entrypoint for standing up a single-client
preview or pilot lane. The scaffold composes the existing foundation modules
instead of creating a second, divergent Azure pattern.

## Backlog Coverage

| Row | Status | Evidence |
| --- | --- | --- |
| T029 | In progress | `infra/azure/client-tenant-foundation.bicep`, example params, verifier, and runbook are present. Full Done requires Azure `what-if` and at least one successful client-lane deployment or dry-run evidence against the target subscription. |

## Deployment Units

| Unit | Existing Module |
| --- | --- |
| Base foundation | `infra/azure/foundation.bicep` |
| Private Postgres | `infra/azure/postgres-foundation.bicep` |
| Ingestion queues and Blob events | `infra/azure/event-ingestion-foundation.bicep` |
| Azure AI Search | `infra/azure/search-foundation.bicep` |
| Container Apps runtime | `infra/azure/app-runtime-foundation.bicep` |

## Single-Client Controls

- `clientKey` is required and carried into names and tags.
- `clientIsolation=single-client` is applied in tags.
- Resource groups are client-scoped.
- Private data-plane storage and database names are client-scoped.
- The example parameter file is explicitly non-secret and preview-only.

## Local Evidence

Run:

```bash
npm run azure:client-tenant-iac:verify
az bicep build --file infra/azure/client-tenant-foundation.bicep
```

`az bicep build` is optional when Azure CLI is unavailable locally, but must be
captured before live deploy.

## Remaining Work Before Done

- Run Azure `what-if` against the selected subscription.
- Capture the reviewed what-if output in release evidence.
- Deploy or dry-run a real client-specific parameter file outside the repo.
- Run connectivity, resource parity, and security audit scripts after deploy.
- Wire Clerk organization/SSO separately.
