# AZLAB36 - L1 Bicep What-If Gate

Date: 2026-05-15  
Status: wired, build-validated locally  
Layer: L1 infrastructure / IaC

## Why This Exists

AZLAB33 verifies live resource parity: what exists in Azure right now. This slice adds the other half of L1: a repeatable Bicep build and `what-if` gate that shows what the repo would change before anyone deploys.

That matters for enterprise readiness because a private-data-lane environment must be rebuildable from source, not just hand-curated in the portal.

## Artifacts

| Artifact | Purpose |
|---|---|
| `.github/workflows/azure-l1-bicep-whatif.yml` | Manual GitHub Actions workflow for Bicep build plus subscription-scope what-if. |
| `infra/azure/*.bicep` | Deployable lab modules covered by the workflow. |
| `infra/azure/parameters/*.lab.bicepparam` | Lab parameter files used by the what-if run. |

## Modules Covered

| Module option | Template | Parameters | Location |
|---|---|---|---|
| `foundation` | `infra/azure/foundation.bicep` | `infra/azure/parameters/foundation.lab.bicepparam` | `eastus` |
| `postgres` | `infra/azure/postgres-foundation.bicep` | `infra/azure/parameters/postgres.lab.bicepparam` | `eastus2` |
| `registry-cost` | `infra/azure/registry-cost-foundation.bicep` | `infra/azure/parameters/registry-cost.lab.bicepparam` | `eastus` |
| `event-ingestion` | `infra/azure/event-ingestion-foundation.bicep` | `infra/azure/parameters/event-ingestion.lab.bicepparam` | `eastus` |
| `search` | `infra/azure/search-foundation.bicep` | `infra/azure/parameters/search.lab.bicepparam` | `eastus` |
| `app-runtime` | `infra/azure/app-runtime-foundation.bicep` | `infra/azure/parameters/app-runtime.lab.bicepparam` | `eastus` |
| `graph` | `infra/azure/graph-foundation.bicep` | `infra/azure/parameters/graph-foundation.lab.bicepparam` | `eastus` |
| `all` | Runs every module above | Mixed | Mixed |

## How To Run

Build-only validation:

```bash
gh workflow run azure-l1-bicep-whatif.yml \
  -f module=all \
  -f build_only=true
```

Live what-if:

```bash
gh workflow run azure-l1-bicep-whatif.yml \
  -f module=foundation \
  -f build_only=false
```

Required workflow secrets:

| Secret | Purpose |
|---|---|
| `AZURE_LAB_CLIENT_ID` | Federated GitHub Actions service principal. |
| `AZURE_LAB_TENANT_ID` | Entra tenant for the lab subscription. |
| `AZURE_POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD` | Required only for `postgres` / `all` what-if because the Postgres parameter file reads a secure environment variable. |
| `AZURE_LAB_NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Optional app-runtime public env projection. |
| `AZURE_LAB_NEXT_PUBLIC_SUPABASE_URL` | Optional app-runtime public env projection. |
| `AZURE_LAB_NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional app-runtime public env projection. |
| `AZURE_LAB_PINECONE_INDEX` | Optional app-runtime env projection. |
| `AZURE_LAB_NEXUS_COMPOSER_MODEL` | Optional app-runtime env projection. |

## Local Validation

The deployable modules were build-validated locally with:

```bash
for f in \
  infra/azure/foundation.bicep \
  infra/azure/postgres-foundation.bicep \
  infra/azure/registry-cost-foundation.bicep \
  infra/azure/event-ingestion-foundation.bicep \
  infra/azure/search-foundation.bicep \
  infra/azure/app-runtime-foundation.bicep \
  infra/azure/graph-foundation.bicep; do
  az bicep build --file "$f" --outfile "/tmp/$(basename "$f").json"
done
```

Result: all seven modules compile with Azure CLI 2.85.0.

## Current Limit

This is a manual workflow. It does not yet create a disposable ephemeral resource group and tear it down after one hour. That is the next L1 maturity step once the foundation what-if is stable in GitHub Actions.

## Next L1 Controls

| Next control | Why |
|---|---|
| Run `foundation` what-if through GitHub OIDC | Proves the action identity and subscription permissions are correct. |
| Add strict expected-change parsing | Distinguishes acceptable drift from risky deletes/recreates. |
| Add ephemeral RG deploy/teardown | Proves clean-environment deployment, not only plan generation. |
