# Supabase Sunset Proof - 09 Post-Delete Cleanup

Date: 2026-06-07
Status: POST-DELETE CLEANUP PARTIAL - runtime clean, external Vercel/KV cleanup remains blocked

## Deletion record

| Field                           | Value                                              |
| ------------------------------- | -------------------------------------------------- |
| Supabase project name           | `abarva`                                           |
| Supabase project id             | `xtbymdryojmvoulaotce`                             |
| Deletion method                 | Supabase dashboard                                 |
| Deletion timestamp              | Reported complete by operator at 2026-06-07T05:06Z |
| Deleter/final approver          | External operator via Supabase dashboard           |
| Dashboard state before deletion | Project showed read-only mode                      |

## Pre-delete proof reported by operator

| Gate                        | Evidence                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| Fresh Azure DB proof        | `job-abarva-private-operator-eus-qmc6yd4`                                                           |
| Fresh drain parity          | `job-supa-drain-apply-eus-20oqn5j`                                                                  |
| Fresh Azure Search verify   | `job-a24-search-verify-eus-19ml4m7`                                                                 |
| Fresh Azure smoke/retrieval | `job-a24-azure-soak-eus-1kzuf2i`                                                                    |
| Native backup               | `/Users/anand/Downloads/abarva-supabase-native-pgdump-20260607-001/supabase-final.dump`             |
| Native backup SHA-256       | `302ccb962614ac9a1ac6ab672838c06d1299aa181a1f0b13be943bf63f77ac8b`                                  |
| Restore test                | Passed for AbarVa app/corpus data; excluded only Supabase-managed Vault extension objects           |
| Restore test counts         | `publicTables=341`, `clientsRows=9`, `enterpriseContextChunksRows=15847`, `corpusPatternsRows=8987` |

## Azure runtime cleanup performed

| Area                               | Result                                                                           |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| Azure Container App env vars       | PASS: active app has no Supabase env names                                       |
| Azure Container App secrets        | PASS: stale app secret `supabase-service-role-key` removed                       |
| Azure Container Apps jobs env vars | PASS: `SOURCE_DATABASE_URL` removed from Supabase/drain/final jobs               |
| Azure Container Apps jobs secrets  | PASS: `source-postgres-database-url` removed from Supabase/drain/final jobs      |
| Azure app/job config inventory     | PASS: no Supabase/source DB matches in app or job env/secret names after cleanup |

Jobs cleaned:

- `job-abarva-db-copy-lab-eastus`
- `job-supa-drain-ro-eus`
- `job-supa-drain-sum-eus`
- `job-supa-drain-apply-eus`
- `job-client-map-eus`
- `job-supa-map-apply-eus`
- `job-supa-natural-eus`
- `job-supa-recon-eus`
- `job-supa-final-eus`

## Key Vault cleanup attempt

Local Key Vault data-plane access is blocked by private-link policy. Cleanup was
attempted from the active Azure runtime using managed identity:

| Secret                         | Result                            |
| ------------------------------ | --------------------------------- |
| `source-postgres-database-url` | existed; delete failed with `403` |
| `supabase-service-role-key`    | existed; delete failed with `403` |

These Key Vault secrets are no longer projected into the app or jobs. They still
need removal by an identity/path with Key Vault delete permission from the
private network.

## Vercel cleanup status

Vercel env cleanup was not run from this agent because no Vercel CLI or Vercel
token/project identifiers are available in the environment. DNS and Vercel
production were not changed or removed.

## Code and runtime verification

| Check                                          | Result                                                                                                                                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run audit:runtime-supabase-imports:guard` | PASS                                                                                                                                                                                |
| Targeted `src/app` + `src/lib` scan            | PASS with expected guard/compatibility/comment hits only; no direct runtime Supabase SDK/env write path                                                                             |
| Public `/`                                     | PASS: HTTP 200                                                                                                                                                                      |
| `/api/health`                                  | PASS: HTTP 200, `ok=true`, `postgres=true`, `direct_postgres=true`, `azure_graph=postgres`                                                                                          |
| Signed-in QA                                   | PASS for Apex CDO and Meridian CDAO across Home, Intelligence/Sentinel, Moves, Source, Tower, Setup/Admin                                                                           |
| App log deny-list                              | PASS: active revision tail had no matches for `supabase.co`, `pooler.supabase.com`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`                                         |
| Recent job log deny-list samples               | PASS: no matches in sampled recent logs for `job-a24-azure-soak-eus-1kzuf2i`, `job-a24-search-verify-eus-19ml4m7`, `job-supa-drain-apply-eus-20oqn5j`, `job-supa-final-eus-dkfq3em` |

## Remaining status

- Supabase has been deleted externally through the dashboard.
- Azure private Postgres remains the only production data plane in the Azure
  runtime.
- Vercel env cleanup remains unverified from this agent.
- Key Vault Supabase-related source secrets remain present but unprojected; they
  require private-network delete permissions.
- DNS was not changed.
- Vercel production was not removed.
- Anthropic Sentinel/Source provider migration remains separate in #3246 and is
  not completed by this proof.
