# Supabase Sunset Proof - 01 Freeze Proof

Date: 2026-06-07
Status: HOLD - freeze not yet proven
Scope: Production Supabase sunset after Azure-only Container Apps cutover

## Gate verdict

Supabase is **not sunset-ready**. This freeze gate remains blocked until the
production runtime has no Supabase environment variables, production write paths
to Supabase are blocked, code-level write paths are proven absent, and Supabase
project logs show zero app-originated writes after the freeze timestamp.

## Required freeze evidence

| Control                                                 | Required evidence                                                                                                                                                                        | Current evidence                                                                                                                                                                                 | Status                                                  |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Freeze timestamp marked                                 | UTC timestamp, operator, and change ticket for the start of the write freeze                                                                                                             | Not recorded in this proof pack                                                                                                                                                                  | BLOCKED                                                 |
| Supabase env vars removed from Azure production runtime | Azure Container Apps revision/env dump showing no `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Supabase pooler host, or Supabase direct URL | 2026-06-07 revision `ca-abarva-web-lab-eastus--0000049` env-name proof shows no Supabase env vars projected                                                                                      | PASS for Azure runtime env names                        |
| Production write paths disabled or blocked              | Runtime guard, network egress rule, or service-role removal proving app writes to Supabase cannot succeed                                                                                | Command-level boot guard deployed on revision `0000049`; log event `supabase_boot_guard_passed`; stale Container Apps secret `supabase-service-role-key` remains configured but is not projected | PARTIAL                                                 |
| No app module can write to Supabase                     | Runtime import census plus write-path audit showing no production module imports Supabase clients or calls Supabase mutation helpers                                                     | 2026-06-07 local code proof passed; see "Code-level write-path evidence" below                                                                                                                   | PASS for code-level direct Supabase SDK/env write proof |
| Supabase logs show zero writes after freeze             | Supabase database/API log export filtered after freeze timestamp, with app identities and user agents identified                                                                         | Not recorded in this proof pack                                                                                                                                                                  | BLOCKED                                                 |

## Freeze timestamp

Freeze timestamp: `PENDING`
Operator: `PENDING`
Approval/change record: `PENDING`

Do not fill this field until the operator has frozen production writes and
captured logs without printing secrets.

## Code-level write-path evidence

Captured from branch `cursor/supabase-sunset-proof-96c4` on 2026-06-07 at
`02:23 UTC`.

| Check                                          | Result | Notes                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run audit:runtime-supabase-imports:guard` | PASS   | Guard allowed exactly one compatibility helper, `src/lib/supabase-server.ts`, with `filesWithImportMatches=1` and `importMatches=1`.                                                                                                                                                                                             |
| Narrow runtime Supabase reference scan         | PASS   | `rg` over `src/app` and `src/lib`, excluding tests/mocks/specs, found no direct `@supabase`, `supabase-js`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `createClient`, `createServiceRoleClient`, or `createServerSupabase` runtime usage. Matches were limited to `src/lib/supabase-server.ts` plus two comments. |
| `src/lib/supabase-server.ts` review            | PASS   | `getServerSupabase()` is a compatibility alias that returns `getAzureReadFluentClient()` and explicitly does not create or depend on a Supabase client, URL, anon key, service-role key, or JWT.                                                                                                                                 |

This proves the shipped `src/app` and `src/lib` runtime has no direct Supabase
SDK/env write path. It does **not** replace production runtime freeze proof:
operators still need to remove production Supabase env vars, block service-role
credentials, and capture Supabase logs showing zero app-originated writes after
the freeze timestamp.

## Commands to capture evidence

Run from an approved operator shell. Do not print secret values.

```bash
# Azure Container Apps production env-name proof. Print names only, not values.
az containerapp show \
  --resource-group <production-resource-group> \
  --name <production-container-app-name> \
  --query "properties.template.containers[].env[].name" \
  --output table

# Runtime code proof.
npm run audit:runtime-supabase-imports:guard

# App log deny-list proof for the freeze window.
az monitor log-analytics query \
  --workspace <workspace-id> \
  --analytics-query "<query filtering production app logs after freeze timestamp for supabase.co, pooler.supabase.com, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY>"
```

## Evidence to attach before marking PASS

- Azure production revision ID.
- Freeze timestamp in UTC.
- Env-name output showing no Supabase runtime env vars.
- Runtime import/write audit output.
- Supabase log export query and result showing zero app-originated writes after
  the freeze.
- Confirmation that no secrets were printed in captured logs.

## Blockers

## 2026-06-07 Azure runtime freeze-related evidence

- Revision `ca-abarva-web-lab-eastus--0000049` is active with 100% traffic.
- No Supabase env names are projected into the app container.
- Boot guard passed at startup:
  `{"event":"supabase_boot_guard_passed","dataPlane":"azure-postgres"}`.
- Azure runtime env probe showed:
  `hasDatabaseUrl=true`, `hasSupabaseEnv=false`,
  `dataPlane="azure-postgres"`, `hasAnthropic=true`.
- Azure-runtime Postgres proof connected to Azure private address
  `10.43.1.4/32`.

This does not complete the freeze gate because signed-in QA fails and Supabase
project logs after a formal freeze timestamp have not been captured.

## Blockers

1. Freeze timestamp is not recorded.
2. Supabase project logs after freeze are not attached.
3. Stale Container Apps secret name `supabase-service-role-key` remains in app
   configuration, although it is not projected as an env var.
4. Signed-in QA fails on most surfaces because the active image still contains
   old bundled code that expects Supabase env vars.
5. Production runtime credential/network blocking proof beyond env removal and
   boot guard is not attached.
