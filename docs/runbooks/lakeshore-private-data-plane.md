# Lakeshore Holdings Private Data Plane Runbook

## Purpose

Stand up the Lakeshore Holdings pilot lane as a single-client private data plane inside the existing AbarVa Azure subscription. The tenant identity is:

| Field                  | Value                            |
| ---------------------- | -------------------------------- |
| Display name           | Lakeshore Holdings               |
| App client key         | `lakeshore`                      |
| Broker / substrate key | `lakeshore-holdings`             |
| Industry code          | `DIVERSIFIED`                    |
| Demo email domain      | `lakeshore-holdings.example.com` |

This runbook supports the Lakeshore standup brief at `docs/build/CODEX-LAKESHORE-STANDUP-BRIEF-2026-06-03.md`.

## What Gets Created

The Bicep deployment uses `infra/azure/client-tenant-foundation.bicep` with `infra/azure/parameters/lakeshore.pilot.bicepparam`.

It creates five resource groups:

| Resource group                              | Purpose                                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| `rg-abarva-lakeshore-pilot-control-eastus`  | Control-plane support resources and search                                    |
| `rg-abarva-lakeshore-pilot-data-eastus`     | Private landing-zone storage, queues, VNet, malware scanning, audit container |
| `rg-abarva-lakeshore-pilot-obs-eastus`      | Log Analytics, Application Insights, action group                             |
| `rg-abarva-lakeshore-pilot-security-eastus` | Key Vault and managed identity                                                |
| `rg-abarva-lakeshore-pilot-db-eastus2`      | Azure Database for PostgreSQL Flexible Server                                 |

The Postgres extension allowlist includes `VECTOR` so the context lane can support embedding-backed retrieval once the parser loads chunks.

## Preflight

1. Sign in to Azure CLI with the target subscription selected.
2. Generate a one-time administrator password:

```bash
export POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD="$(openssl rand -base64 36)"
```

Do not commit or paste this value into a PR.

3. Validate the templates:

```bash
az bicep build --file infra/azure/client-tenant-foundation.bicep
az bicep build-params --file infra/azure/parameters/lakeshore.pilot.bicepparam
```

## What-If

```bash
scripts/lakeshore/deploy-private-data-plane.sh what-if
```

Review the planned resource groups, Key Vault name, Postgres server name, storage account, Service Bus namespace, search service, immutable audit container, and Defender malware scanning configuration before deploy.

## Deploy

```bash
scripts/lakeshore/deploy-private-data-plane.sh deploy
```

Capture the deployment outputs in the release evidence:

```bash
az deployment sub show \
  --name "<deployment-name>" \
  --query "properties.outputs"
```

## Post-Deploy Wiring

1. Insert the `clients` row with `tenant_key='lakeshore'`, display name `Lakeshore Holdings`, and `industry_code='DIVERSIFIED'`.
2. Register the private data-plane secret references in the tenant routing registry so app key `lakeshore` resolves to broker/substrate key `lakeshore-holdings`.
3. Provision the Clerk organization and first admin user:
   - Org display name: `Lakeshore Holdings`
   - Admin email: `admin@lakeshore-holdings.example.com`
   - `publicMetadata.clientId`: `lakeshore`
   - Role: client admin / data-load steward
4. Load context only through the governed Data Loads workflow. Do not side-load seed rows into operational stores.

## Customer-Owned Subscription Variant

For a customer-owned subscription, keep the same parameter shape but change the deployment subscription and confirm:

- customer subscription ID and tenant ID,
- private DNS / VNet peering approval path,
- Key Vault ownership and break-glass principal,
- data retention and deletion policy,
- export package location for the one-time offline synthetic-data review bundle.

## Teardown

Teardown is intentionally guarded:

```bash
CONFIRM=delete-lakeshore-pilot scripts/lakeshore/teardown-private-data-plane.sh
```

Before teardown, export the deployment outputs, audit-log evidence, and any one-time offline review bundle requested by the client.
