# Azure Private Operator Runner

This runbook is the supported way for Codex, Cursor, Claude Code, and other automation agents to run diagnostics or approved data-plane jobs against private Azure Postgres.

The Azure Postgres hostname `pg-abarva-context-lab-001.postgres.database.azure.com` resolves only inside the private Azure network. Local laptops and Cursor Cloud should not try to connect to it directly. They should use the Azure Container Apps job below, which runs inside the configured Container Apps environment with managed identity and Key Vault secret references.

## Current Lab Runner

| Setting                    | Value                                                    |
| -------------------------- | -------------------------------------------------------- |
| Subscription               | `abarva-lab-sub`                                         |
| Resource group             | `rg-abarva-controlplane-lab-eastus`                      |
| Container Apps job         | `job-abarva-private-operator-eus`                        |
| Container Apps environment | `cae-abarva-scale-lab-eastus`                            |
| Managed identity           | `id-abarva-scale-runtime-lab-eastus`                     |
| Key Vault                  | `kv-abarva-lab-001`                                      |
| Database secret reference  | `azure-postgres-control-database-url`                    |
| Parameter file             | `infra/azure/parameters/private-operator.lab.bicepparam` |

## Deploy Or Refresh The Runner

```bash
az deployment sub create \
  --name az-private-operator-runner-$(date +%Y%m%d%H%M%S) \
  --location eastus \
  --template-file infra/azure/database-migration-foundation.bicep \
  --parameters infra/azure/parameters/private-operator.lab.bicepparam
```

The committed parameter file uses a read-only smoke command. It proves private DNS, Key Vault secret projection, managed identity access, and Azure Postgres connectivity without mutating data.

## Start A Run

Use the shared wrapper for application-backed operator jobs. It submits the ACA Job with start-time container overrides, polls the execution, captures logs, extracts proof bundles, and restores the runner to an idle command after completion.

```bash
npm run ops:aca-job -- \
  --image acrabarvalab001.azurecr.io/abarva/web@sha256:<digest> \
  --script semantic2:l3-dossiers:self-test \
  --out-dir /tmp/abarva-operator-selftest-$(date -u +%Y%m%dT%H%M%SZ)
```

For the Semantic2 L3 proof lane:

```bash
npm run ops:semantic2:l3-dossiers:proof -- \
  --image acrabarvalab001.azurecr.io/abarva/web@sha256:<digest> \
  --out-dir /tmp/abarva-l3-dossier-proof-$(date -u +%Y%m%dT%H%M%SZ)
```

The wrapper refuses mutable image tags by default. Use `ALLOW_MUTABLE_ACA_IMAGE=true` only for a documented non-production exception.

The raw Azure CLI path remains useful for read-only smoke runs and break-glass investigation:

```bash
az containerapp job start \
  --resource-group rg-abarva-controlplane-lab-eastus \
  --name job-abarva-private-operator-eus
```

## List Executions

```bash
az containerapp job execution list \
  --resource-group rg-abarva-controlplane-lab-eastus \
  --name job-abarva-private-operator-eus \
  --output table
```

## Read Logs

Replace `<execution-name>` with the execution returned by the start or list command.

```bash
az containerapp job logs show \
  --resource-group rg-abarva-controlplane-lab-eastus \
  --name job-abarva-private-operator-eus \
  --execution <execution-name> \
  --container db-migrate \
  --tail 200
```

## Current Proof

Execution `job-abarva-private-operator-eus-xdaykbk` succeeded on 2026-06-06.

It proved:

- Private DNS resolved `pg-abarva-context-lab-001.postgres.database.azure.com` to `10.43.1.4`.
- The job connected to database `abarva_control` as `abarvaadmin`.
- The server address was `10.43.1.4/32`.
- The Azure private data plane currently contained:
  - `corpus_patterns`: 39
  - `corpus_pattern_content`: 39
  - `knowledge_sources`: 20
  - `knowledge_chunks`: 0
  - `enterprise_context_records`: table not present
  - `enterprise_context_chunks`: 9,360
  - `genome_patterns`: 52
  - `intelligence_graph_edges`: 268

## Agent Handoff

Cursor and Claude Code should use this runner for private Azure Postgres work:

1. Do not use local `psql`, Prisma, or Node clients against the private Azure Postgres hostname from a public network.
2. Do use `npm run ops:aca-job -- --image <digest-pinned-image> --script <npm-script>` for application-backed data-build, proof, and reconciliation jobs.
3. Use direct `az containerapp job start` and `az containerapp job logs show` only for the static read-only smoke command or a documented break-glass case.
4. For data-copy, corpus-drain, migration, or destructive commands, create a separate reviewed parameter file or one-time command and record the run as release evidence.
5. Do not print connection strings or Key Vault secret values in logs.
6. Keep `DATABASE_URL` compatibility only inside the job container. Runtime corpus code should prefer `ABARVA_AZURE_DATABASE_URL` and fail closed on legacy Supabase unless `ALLOW_LEGACY_SUPABASE_CORPUS=1` is intentionally set.

## Why This Exists

Supabase was reachable from public networks, so older local workflows could write corpus rows there accidentally. Azure Postgres is intentionally private. The correct operating model is:

- Repo code chooses Azure first.
- Operators run private data-plane jobs from Azure-hosted compute.
- Logs prove what ran, where it ran, and which database received the work.
- Cursor, Claude Code, and Codex all follow the same runbook.

## Supabase Drain Before Shutdown

Before deleting or pausing Supabase, run the controlled drain tooling:

```bash
az deployment sub create \
  --name az-supabase-drain-dry-run-$(date +%Y%m%d%H%M%S) \
  --location eastus \
  --template-file infra/azure/database-migration-foundation.bicep \
  --parameters infra/azure/parameters/supabase-drain-dry-run.lab.bicepparam

az containerapp job start \
  --resource-group rg-abarva-controlplane-lab-eastus \
  --name job-abarva-supabase-drain-dry-run-eus
```

The drain script defaults to read-only mode. It requires `SOURCE_DATABASE_URL` to point at the legacy Supabase Postgres source and `TARGET_DATABASE_URL` to point at Azure Postgres. It only copies rows when run with `--apply`, and that apply step must not happen until the dry-run evidence is reviewed.
