# Azure Container Apps Cutover - Merged Main Runtime Proof

Date: 2026-06-07
Status: MERGED-MAIN RUNTIME REPRODUCIBLE; DNS/VERCEL/SUPABASE SUNSET HELD

## Source

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Main commit   | `43839a41c71217f61ea165eff3071f70df5f4af7`                             |
| Image         | `acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260607-43839a41` |
| Web revision  | `ca-abarva-web-lab-eastus--0000051`                                    |
| Runtime state | Healthy, 100% traffic                                                  |

## Runtime proof

| Check                      | Result                                                                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Boot guard                 | PASS: `supabase_boot_guard_passed`, `dataPlane=azure-postgres`                                                                          |
| Public `/`                 | PASS: HTTP 200                                                                                                                          |
| `/api/health`              | PASS: HTTP 200, `ok=true`, `postgres=true`, `direct_postgres=true`, `azure_graph=postgres`                                              |
| Azure DB proof             | PASS: Container Apps runtime connected to `abarva_control` at `10.43.1.4/32`                                                            |
| Signed-in QA               | PASS for Apex CDO and Meridian CDAO across Home, Intelligence/Sentinel, Moves, Source, Tower, Setup/Admin                               |
| Supabase app log deny-list | PASS: revision log tail had no `supabase.co`, `pooler.supabase.com`, `NEXT_PUBLIC_SUPABASE_URL`, or `SUPABASE_SERVICE_ROLE_KEY` matches |
| Anthropic proof            | PASS: runtime request used `claude-opus-4-7` and returned the expected proof token                                                      |

## Job proof

| Step                       | Execution                           | Result                                                                                                                                        |
| -------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Drain apply                | `job-supa-drain-apply-eus-bcvp371`  | Succeeded; tracked tables were parity or Azure-ahead                                                                                          |
| Search verify              | `job-a24-search-verify-eus-v4xv4gp` | Succeeded; observed tenant-context counts matched expected counts                                                                             |
| Azure-only smoke/retrieval | `job-a24-azure-soak-eus-rtthqal`    | Succeeded; runtime smoke `9 pass / 0 fail`; retrieval smoke passed for six tenants                                                            |
| Supabase final export      | `job-supa-final-eus-0k0143f`        | Failed overall after emitting export/checksum progress; final manifest re-read was blocked by Container Apps exec 404 during evidence capture |

## Non-actions

- No DNS change.
- No Vercel removal.
- No Supabase pause.
- No Supabase delete.
- No sunset-ready claim.

## Remaining gates

- Run and record the required 24-72 hour Azure-only soak.
- Capture Supabase project zero-read/write logs for the soak window.
- Complete final backup with native `pg_dump` or document an approved restore-tested alternative.
- Run restore-test evidence.
- Run pause QA only after explicit pause approval.
- Record explicit deletion approval before any delete.
