# AZLAB28 - Azure Isolation Probe Target

Date: 2026-05-15  
Scope: L4 multi-tenant isolation gate for the Azure lab  
Posture: workflow wiring only; live Azure probe run waits on Azure-host-scoped Clerk session secret

## Executive Read

AZLAB28 wires the existing SEC-P0 cross-tenant API probe suite to the Azure lab. The suite already proves that an Apex session cannot pass Meridian identifiers into the 8 hardened routes. This update lets the same workflow target `azure-lab` in addition to `staging` and `production`.

This is the first L4 bridge from "we have an Azure stack" to "we can prove tenant isolation against the Azure-hosted app."

## Artifact

Workflow:

```text
.github/workflows/sec-p0-post-deploy.yml
```

Manual run:

```bash
gh workflow run sec-p0-post-deploy.yml -f environment=azure-lab
```

Probe script:

```text
tests/security/sec-p0-cross-tenant-probes.sh
```

## Azure Lab Secrets

The Azure target resolves from separate repository secrets:

| Secret | Purpose |
|---|---|
| `AZURE_LAB_BASE_URL` | Azure Container Apps app URL. |
| `AZURE_LAB_APEX_SESSION` | `__session` cookie value for an Apex user, minted against the Azure host. |
| `AZURE_LAB_MERIDIAN_CLIENT_ID` | Meridian client UUID in the Azure lab database. |
| `AZURE_LAB_MERIDIAN_CLIENT_KEY` | Optional; defaults to `meridian-health`. |
| `AZURE_LAB_KNOWN_MERIDIAN_TURN_ID` | Optional known Meridian turn for the trace isolation probe. |

Important: do not reuse an `app.abarva.ai` cookie against the Azure host. Browser cookies are host-scoped, so the Azure lab needs its own authenticated session cookie once the Clerk/Azure FQDN flow is validated.

## What It Proves

| Route | Expected result |
|---|---|
| `POST /api/tower/seed-demo` with Meridian clientId from Apex session | `403 forbidden_cross_tenant` |
| `DELETE /api/tower/seed-demo` with Meridian clientId from Apex session | `403 forbidden_cross_tenant` |
| `POST /api/data/upload` with Meridian clientId from Apex session | `403 forbidden_cross_tenant` |
| `POST /api/setup/initiatives` with Meridian tenantKey from Apex session | `403 forbidden_cross_tenant` |
| `GET /api/setup/initiatives` with Meridian tenantKey from Apex session | `403 forbidden_cross_tenant` |
| `POST /api/admin/upload-dataset` with Meridian clientId from Apex session | `403 forbidden_cross_tenant` |
| `GET /api/turn/<meridian>/trace` from Apex session | `404` |
| `POST /api/intelligence/query` without caller tenant scope | `400` or `403` |

## Current Status

The workflow wiring is complete. The actual Azure run is intentionally deferred until the Azure app has an authenticated Clerk session minted against the Container Apps host and the `AZURE_LAB_*` repository secrets are loaded.

That sequencing matters: a failed probe with an expired or wrong-host cookie produces `401`, which is an auth setup issue, not a tenant-isolation result.

## Next Gates

| Gate | Next action |
|---|---|
| L4 positive run | Load Azure lab secrets and run `environment=azure-lab`. |
| L4 SQL layer | Run the RLS regression workflow against Azure Postgres once tenant DB roles are pinned. |
| L4 broker layer | Add an integration assertion that Azure `/api/intelligence` responses contain no tenant-B segment or graph IDs. |

