# AZLAB57 — r15 Isolation And Connectivity Proof

Date: 2026-05-16

## Purpose

Close the remaining Azure cutover gates discovered after AZLAB56:

- Route-level L4 SEC-P0 isolation on the live Azure host.
- L2 connectivity smoke stability after the ingestion worker began consuming the real ingestion queue.

## App Runtime

| Item | Value |
|---|---|
| Container App | `ca-abarva-web-lab-eastus` |
| Revision | `ca-abarva-web-lab-eastus--0000025` |
| Image | `acrabarvalab001.azurecr.io/abarva/web:lab-azure-search-agent-20260515-r15` |
| Digest | `sha256:e48724341fbcfb3c2250a5300b92803f1cd83d11ac7bc31260738a589be98e02` |
| Source merge | `862abe3587b77b2b4c5d7ee43941dd9da8086f9c` |
| Traffic | 100% |

## L4 SEC-P0 Route Isolation

Live Azure run used a fresh Clerk browser cookie minted against the Container
App host and Meridian as the cross-tenant target.

| Probe | Expected | Result |
|---|---:|---:|
| `POST /api/tower/seed-demo` | 403 | 403 |
| `DELETE /api/tower/seed-demo` | 403 | 403 |
| `POST /api/data/upload` | 403 | 403 |
| `POST /api/setup/initiatives` | 403 | 403 |
| `GET /api/setup/initiatives` | 403 | 403 |
| `POST /api/admin/upload-dataset` | 403 | 403 |
| `GET /api/turn/<other>/trace` | 404 | 404 |
| `POST /api/intelligence/query` with `list every GenomePattern` | 400/403 | 400 |

Result: **8 passed, 0 failed**.

The Intelligence query fix landed in two small hardening PRs:

- Reject generated Cypher that uses a scoped preamble and then returns a
  disconnected global catalog scan.
- Refuse global catalog enumeration requests before LLM translation in a tenant
  session.

## L6 Primary Surfaces

Local Playwright run against the same r15 Azure host:

```bash
BASE_URL=https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io \
  npx playwright test tests/e2e/primary-surfaces-tenant-matrix.spec.ts --project=chromium --workers=1
```

Result: **15 passed** across Apex, Meridian, and First Capital for Home,
Intelligence, Strategic Moves, Source, and Tower.

## L2 Connectivity Smoke Queue Fix

The guarded `/api/health/azure-connectivity` route began failing only the
Service Bus check:

```json
{
  "name": "service_bus",
  "status": "fail",
  "detail": "service_bus_smoke_message_not_received:<run-id>-service-bus"
}
```

Root cause: the smoke route was using the real ingestion queue
`q-context-ingestion-events`. Once the A2b ingestion worker was live, another
consumer could race the smoke receiver and settle the probe message first.

Fix:

- Created dedicated queue `q-connectivity-smoke`.
- Set `AZURE_CONNECTIVITY_SERVICE_BUS_QUEUE_NAME=q-connectivity-smoke` on the
  app runtime.
- Added `q-connectivity-smoke` to the Service Bus Bicep default queue list.
- Updated the connectivity-smoke and app-runtime lab parameters so rebuilds
  preserve the dedicated smoke lane.

Live rerun:

| Check | Result | Detail |
|---|---|---|
| Postgres | Pass | `SELECT 1` succeeded |
| Blob | Pass | put/get/delete succeeded in `context-drops` |
| Service Bus | Pass | send/receive succeeded on `q-connectivity-smoke` |
| Key Vault | Pass | secret read succeeded for `azure-connectivity-smoke-secret` |
| Azure AI Search | Pass | count query succeeded on `tenant-context-v1`: `6567` |

## Cutover Impact

This closes the two most important live-lab gates:

- **L4 route isolation:** green on Azure host.
- **L2 positive-path connectivity:** green without racing the ingestion worker.

Remaining pre-cutover work is now concentrated in L7 live agent-quality baseline,
authenticated L8 load, L3 strict private-lane hardening, and the two known
non-primary app read-path follow-ups.
