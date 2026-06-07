# Supabase Sunset Proof - 05 Azure-Only Runtime Soak

Date: 2026-06-07  
Status: HOLD - 24-72 hour production soak not complete  
Scope: Production app served only by Azure Container Apps with Azure Postgres

## Gate verdict

Supabase is **not sunset-ready** until production has served the app from Azure
Container Apps only for an approved 24-72 hour soak window, with no Supabase
runtime env vars, no Supabase strings in application logs, zero Supabase
production app reads/writes, and confirmed Azure Postgres production traffic.

## Soak window

| Field                               | Value     |
| ----------------------------------- | --------- |
| Soak start UTC                      | `PENDING` |
| Soak end UTC                        | `PENDING` |
| Duration                            | `PENDING` |
| Azure Container Apps production app | `PENDING` |
| Revision(s)                         | `PENDING` |
| Azure Postgres database             | `PENDING` |
| Operator                            | `PENDING` |

## Required soak controls

| Control                                        | Required evidence                                                                                                          | Current evidence                                                 | Status  |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------- |
| Azure Container Apps only                      | Routing/DNS/deployment proof that production traffic is served by Azure Container Apps for the full window                 | Not attached                                                     | BLOCKED |
| No Supabase env vars                           | Env-name proof for each production revision in the soak window                                                             | 2026-06-06 lab evidence exists; production evidence not attached | PARTIAL |
| No Supabase strings in app logs                | Log query over full soak for `supabase.co`, `pooler.supabase.com`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Not attached                                                     | BLOCKED |
| Supabase logs show zero app reads/writes       | Supabase log export filtered to production app identities/user agents over the full window                                 | Not attached                                                     | BLOCKED |
| Azure Postgres receives production app traffic | Azure Postgres connection/query metrics and app log correlation over the soak window                                       | Not attached                                                     | BLOCKED |
| Core app smoke passes during soak              | Home, Intelligence/Sentinel, Nexus/Moves, Source, Tower, Setup/Admin QA evidence                                           | Not attached                                                     | BLOCKED |

## Known prior evidence

`docs/releases/records/2026-06-06-azure-search-canonical-rebuild.md` records a
lab Azure-only runtime/retrieval smoke execution:

- Azure lab runtime revision: `ca-abarva-web-lab-eastus--0000048`
- Removed lab env names: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PINECONE_INDEX`,
  `PINECONE_API_KEY`, `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`
- Azure-only smoke execution: `job-a24-azure-soak-eus-nmvq83t`
- Runtime smoke status: `pass`, summary `9 pass / 0 fail`

This prior evidence is not a substitute for the production 24-72 hour soak.

## Local execution attempt

Captured from branch `cursor/supabase-sunset-proof-96c4` on 2026-06-07 at
`02:24 UTC`.

| Check                         | Result                                  | Impact                                                                                              |
| ----------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Azure CLI (`az account show`) | NOT AVAILABLE (`az: command not found`) | Cannot query Container Apps production revisions, env names, or Azure Monitor logs from this shell. |
| `DATABASE_URL`                | NOT AVAILABLE                           | Cannot run `npm run azure:cutover:runtime-smoke` against production Azure Postgres from this shell. |
| `ABARVA_AZURE_DATABASE_URL`   | NOT AVAILABLE                           | Cannot substitute the Azure Postgres candidate URL for local smoke.                                 |
| Azure Search env vars         | NOT AVAILABLE                           | Cannot couple runtime soak with retrieval smoke from this shell.                                    |

No production soak was started or claimed from this environment.

## 2026-06-07 Azure runtime attempt

| Control                               | Result                                                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Guarded Azure revision                | PASS: `ca-abarva-web-lab-eastus--0000049` healthy with 100% traffic                                       |
| Public home                           | PASS: HTTP 200                                                                                            |
| Azure runtime DB proof                | PASS: connected to `abarva_control` at `10.43.1.4/32`                                                     |
| Signed-in QA                          | FAIL: only Intelligence/Sentinel passed; Home, Moves, Source, Tower, Setup/Admin returned HTTP 500        |
| App log deny-list                     | FAIL: logs contain `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in old-image error messages |
| Supabase project zero-read/write logs | NOT CAPTURED                                                                                              |
| Duration                              | NOT A SOAK: this was a smoke attempt, not a 24-72 hour soak                                               |

The Azure-only soak cannot start until signed-in QA passes and the app log
deny-list is clean.

## Log deny-list

The soak fails if production app logs contain any of the following during the
soak window:

- `supabase.co`
- `pooler.supabase.com`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The soak also fails if Supabase project logs show production app reads or writes
during the window.

## Command patterns

Do not print secret values.

```bash
# Env-name check for each production revision.
az containerapp revision list \
  --resource-group <production-resource-group> \
  --name <production-container-app-name> \
  --query "[].{name:name,active:properties.active,trafficWeight:properties.trafficWeight}" \
  --output table

# Runtime smoke from Azure-only environment.
npm run azure:cutover:runtime-smoke

# Log deny-list query. Replace placeholders with approved workspace/query.
az monitor log-analytics query \
  --workspace <workspace-id> \
  --analytics-query "<full soak query for supabase.co/pooler.supabase.com/NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY>"
```

## Blockers

1. No production soak start/end timestamps are recorded.
2. No production app routing proof is attached.
3. No production app log deny-list proof is attached.
4. No Supabase zero-read/write soak proof is attached.
5. No Azure Postgres production traffic proof is attached.
6. This shell still has no direct production data-plane environment variables;
   Azure DB proof was correctly gathered from Azure runtime instead.
7. 2026-06-07 signed-in QA failed and app logs contain denied Supabase env-name
   strings from the active image.
