# AbarVa Azure Lab Database Migration + Parallel Run Foundation

Status: implemented and verified for lab execution on 2026-05-15  
Subscription: `abarva-lab-sub` / `701a8554-a166-46e9-bf13-743bc50e3b20`  
Data posture: synthetic/no-client-data only

## Purpose

This stage turns the private Azure Postgres lane from an empty managed database into a migration target that can run the current AbarVa Supabase/Postgres schema in parallel with the existing hosted database.

The goal is not an immediate cutover. The goal is a controlled parallel run:

1. Keep the current production/demo database as source of truth.
2. Apply the same schema to Azure Postgres.
3. Load synthetic tenant packs into Azure.
4. Run read-only parity checks for Home, Intelligence, Moves, Source, Tower, and agent retrieval.
5. Cut traffic only after parity, latency, and security gates are clean.

## What This Adds

| Capability | Artifact | Why it matters |
|---|---|---|
| Supabase compatibility bootstrap | `src/scripts/bootstrap-azure-postgres-compat.ts` | Creates the roles and helper functions Supabase migrations expect: `anon`, `authenticated`, `service_role`, `auth.jwt()`, `auth.role()`, `auth.uid()`, and `storage.foldername`. |
| Azure migration job | `infra/azure/database-migration-foundation.bicep` + `database-migration-job.bicep` | Runs schema migration from the same ACR app image inside the private Container Apps environment. |
| Key Vault DB URI writer | `scripts/azure/set-postgres-database-url-secrets.mjs` | Builds URL-encoded Azure Postgres connection strings from Key Vault-held admin credentials without printing secrets. |
| Lab params | `infra/azure/parameters/database-migration.lab.bicepparam` | Points the migration job at `abarva_control` first. |
| Migration-capable image | `Dockerfile` runtime copies `src/scripts`, `scripts`, and `supabase/migrations` | Lets the same built artifact run both the web app and one-off operational jobs. |
| Azure extension allow-list | `postgresAllowedExtensions = 'PGCRYPTO,UUID-OSSP'` | Lets the current schema create the extensions it already expects on Supabase. |
| Controlled destructive bypass | `run-migrations.ts --allow-destructive` | Allows historical destructive-looking migrations only for empty-database bootstrap; normal migration runs remain protected. |
| Azure schema verifier | `src/scripts/verify-azure-postgres-schema.ts` | Runs inside Container Apps to prove the private Azure Postgres schema state without opening the database publicly. |

## Why Compatibility Bootstrap Is Required

The current migrations were authored for Supabase Postgres. They use database roles, auth helper functions, storage helper functions, and extension assumptions that plain Azure Database for PostgreSQL does not ship by default.

The bootstrap is intentionally minimal. It makes the schema portable and lets the migration run. It is not a final identity design.

Compatibility bridges added for the lab:

- Supabase roles: `anon`, `authenticated`, `service_role`
- Supabase auth helpers: `auth.jwt()`, `auth.role()`, `auth.uid()`
- Supabase Storage surface: `storage.buckets`, `storage.objects`, `storage.foldername(text)`
- Historical text/UUID tolerance for older migrations that compare legacy text IDs to UUID client/program IDs
- Text overloads for tenant helper functions such as `can_read_tenant_by_id(text)`

## Clerk Decision

Clerk remains useful for the current SaaS/demo control-plane lane because it is already wired through the app and demo roster.

For enterprise Azure deployments, Clerk should not be a hard dependency. The target identity posture is:

| Lane | Recommended identity |
|---|---|
| AbarVa SaaS demo / founder demos | Clerk remains acceptable. |
| AbarVa-managed SaaS with enterprise SSO | Clerk or direct OIDC/SAML can front the session, but the app must receive normalized `tenant_key`, `role`, and `sub` claims. |
| Client private data plane / client VPC | Customer Entra ID or approved customer IdP should be supported directly. |

The durable app contract is not "Clerk." The durable contract is a verified identity context with `sub`, `tenant_key`, `role`, optional `person_id`, and optional `client_id`.

## Parallel Run Model

```mermaid
flowchart LR
  PROD["Current Supabase/Postgres source of truth"] --> EXPORT["Controlled export: schema + seed packs"]
  EXPORT --> AZPG["Azure Postgres: abarva_control"]
  AZPG --> APP2["Azure Container App parallel runtime"]
  APP1["Current app runtime"] --> PROD
  APP2 --> CHECKS["Parity checks: routes, agents, retrieval, RLS"]
  CHECKS --> DECIDE["Cutover decision after gates pass"]
```

## Migration Execution Order

1. Set Key Vault database URI secrets:

   ```bash
   set -a
   source /Users/anand/Projects/nexus/.env.azure.local
   set +a
   node scripts/azure/set-postgres-database-url-secrets.mjs
   ```

2. Deploy the migration job:

   ```bash
   az deployment sub create \
     --name azlab18-db-migration-job-$(date +%Y%m%d%H%M%S) \
     --location eastus \
     --template-file infra/azure/database-migration-foundation.bicep \
     --parameters infra/azure/parameters/database-migration.lab.bicepparam
   ```

3. Start the manual job:

   ```bash
   az containerapp job start \
     --resource-group rg-abarva-controlplane-lab-eastus \
     --name job-abarva-db-migrate-lab-eastus
   ```

## Verified Run

The migration job completed successfully from the private Container Apps environment on 2026-05-15.

| Proof point | Value |
|---|---:|
| Applied migrations | 149 |
| Public base tables | 234 |
| Storage buckets | 2 |
| Clients seeded by migrations | 3 |
| Engagements seeded by migrations | 3 |
| `enterprise_context_chunks` | 0 |
| `enterprise_graph_nodes` | 0 |
| `enterprise_graph_edges` | 0 |
| `source_events` | 0 |
| `gate_criteria` | 0 |

Interpretation: Azure Postgres now has schema parity and migration-history parity. It does not yet have tenant setup-pack parity. Context chunks, graph rows, Source events, and gate criteria remain empty until the Day-1 synthetic seed/export harness is run.

## Gates Before Parallel Runtime Reads From Azure Postgres

| Gate | Required proof |
|---|---|
| Schema migration | `schema_migrations` count equals repo migration count. |
| Supabase compatibility | RLS policies compile; `auth.jwt()` and role functions exist. |
| Tenant seed parity | Apex, Meridian, and First Capital setup pack counts match current source. |
| Graph parity | `enterprise_graph_nodes`, `enterprise_graph_edges`, and context relationship counts match by tenant. |
| Route smoke | `/api/health`, `/home`, `/intelligence`, `/source`, `/strategic-moves`, `/tower` render against Azure DB. |
| Isolation probe | SEC-P0 curl suite returns 403/404 for cross-tenant probes. |
| Performance | Container Apps to Azure Postgres p50/p95 recorded for core queries. |

## What Still Comes After This

| Next item | Why |
|---|---|
| Seed-copy/export harness | Schema parity is first; data-copy parity is next. |
| Config switch for Azure Postgres runtime | Container App currently still projects `DATABASE_URL` from the old `database-url` secret; parallel app revision should point to `azure-postgres-control-database-url`. |
| Entra ID/OIDC auth adapter | Removes Clerk as enterprise hard dependency. |
| Graph projection job | Rebuild Cosmos Gremlin from Postgres edge tables instead of treating graph as hand-seeded. |
| Search index contracts | AI Search needs deterministic tenant indexes before retrieval parity. |
