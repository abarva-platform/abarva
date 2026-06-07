# Azure Container Apps Cutover Proof - 2026-06-07

Status: MERGED-MAIN AZURE RUNTIME SMOKE PASSED; DNS/VERCEL/SUPABASE SUNSET STILL HELD

## Guardrails observed

- No secrets printed.
- Supabase was not paused.
- Supabase was not deleted.
- DNS was not changed.
- Vercel production was not removed.
- Azure DB proof ran from Azure Container Apps runtime, not local `DATABASE_URL`.

## Source state

| Field                             | Value                                                                  |
| --------------------------------- | ---------------------------------------------------------------------- |
| Main commit                       | `43839a41c71217f61ea165eff3071f70df5f4af7`                             |
| Main commit title                 | `fix(build): include enterprise context template manifests`            |
| Merged PRs referenced by operator | `#3242`, `#3244`                                                       |
| Image                             | `acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260607-43839a41` |
| ACR build                         | PASS                                                                   |

## Runtime refresh

| Resource          | Result                                                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web app           | `ca-abarva-web-lab-eastus--0000051`, healthy, 100% traffic                                                                                                                                                          |
| Boot guard        | PASS: `supabase_boot_guard_passed`, `dataPlane=azure-postgres`                                                                                                                                                      |
| Supabase env vars | No `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` projected                                                                                                            |
| Jobs refreshed    | `job-supa-drain-apply-eus`, `job-supa-recon-eus`, `job-a24-search-canon-eus`, `job-a24-search-rebuild-eus`, `job-a24-search-verify-eus`, `job-a24-search-count-eus`, `job-a24-azure-soak-eus`, `job-supa-final-eus` |

## Public/runtime proof

| Check                  | Evidence                                                                                                                                                                                                                                     | Status |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Public `/`             | HTTP 200                                                                                                                                                                                                                                     | PASS   |
| `/api/health`          | HTTP 200, `ok=true`, `postgres=true`, `direct_postgres=true`, `azure_graph=postgres`                                                                                                                                                         | PASS   |
| Azure runtime DB proof | Container Apps exec against revision `0000051` connected to `abarva_control` as `abarvaadmin` at `10.43.1.4/32`                                                                                                                              | PASS   |
| Key counts             | `clients=9`, `enterprise_context_records=3503`, `enterprise_context_facts=38640`, `enterprise_context_chunks=21967`, `corpus_patterns=9026`, `genome_patterns=43436`, `intelligence_graph_edges=93743`, `source_events=42`, `engagements=53` | PASS   |
| Anthropic proof        | Azure runtime Anthropic request succeeded with `provider=anthropic`, `requestedModel=claude-opus-4-7`, `responseModel=claude-opus-4-7`, `matched=true`                                                                                       | PASS   |
| App log deny-list      | Revision `0000051` tail had no matches for `supabase.co`, `pooler.supabase.com`, `NEXT_PUBLIC_SUPABASE_URL`, or `SUPABASE_SERVICE_ROLE_KEY`                                                                                                  | PASS   |

## Signed-in QA

Authentication used Azure app demo-ticket flow; ticket values were not printed.

| User          | Surface               | Status | Final URL                        | Verdict |
| ------------- | --------------------- | -----: | -------------------------------- | ------- |
| Apex CDO      | Home                  |    200 | `/responsible-ai/acknowledgment` | PASS    |
| Apex CDO      | Intelligence/Sentinel |    200 | `/intelligence`                  | PASS    |
| Apex CDO      | Moves                 |    200 | `/responsible-ai/acknowledgment` | PASS    |
| Apex CDO      | Source                |    200 | `/responsible-ai/acknowledgment` | PASS    |
| Apex CDO      | Tower                 |    200 | `/responsible-ai/acknowledgment` | PASS    |
| Apex CDO      | Setup/Admin           |    200 | `/responsible-ai/acknowledgment` | PASS    |
| Meridian CDAO | Home                  |    200 | `/responsible-ai/acknowledgment` | PASS    |
| Meridian CDAO | Intelligence/Sentinel |    200 | `/intelligence`                  | PASS    |
| Meridian CDAO | Moves                 |    200 | `/responsible-ai/acknowledgment` | PASS    |
| Meridian CDAO | Source                |    200 | `/responsible-ai/acknowledgment` | PASS    |
| Meridian CDAO | Tower                 |    200 | `/responsible-ai/acknowledgment` | PASS    |
| Meridian CDAO | Setup/Admin           |    200 | `/responsible-ai/acknowledgment` | PASS    |

Note: most product routes still land on the Responsible AI acknowledgment gate.
This is sufficient for signed-in HTTP/auth smoke, but deeper post-ack product QA
should run before DNS cutover.

## Data-plane jobs

| Step                       | Execution                           | Result                                                                                                                                                                                                    |
| -------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drain apply                | `job-supa-drain-apply-eus-bcvp371`  | Succeeded; tracked tables were parity or Azure-ahead                                                                                                                                                      |
| Search verify              | `job-a24-search-verify-eus-v4xv4gp` | Succeeded; observed counts matched expected tenant Search counts                                                                                                                                          |
| Azure-only smoke/retrieval | `job-a24-azure-soak-eus-rtthqal`    | Succeeded; runtime smoke `9 pass / 0 fail`; retrieval smoke passed for six tenants                                                                                                                        |
| Supabase final export      | `job-supa-final-eus-0k0143f`        | Failed overall; export progressed, but final manifest could not be re-read due Container Apps exec 404 during evidence capture. Prior fixed-root manifest exists from the same backup root and prior run. |

## Search verification

`job-a24-search-verify-eus-v4xv4gp` emitted:

```json
{
  "event": "azure_search_backfill_verified",
  "observed": {
    "apex-retail": 6497,
    "first-capital": 400,
    "lakeshore-holdings": 6576,
    "meridian-health": 4376,
    "northstar-clinical": 878,
    "skyharbor-air": 3240
  }
}
```

`job-a24-azure-soak-eus-rtthqal` also returned three retrieval hits for each of
these tenants: Apex, Meridian, First Capital, Lakeshore, SkyHarbor, Northstar.

## Remaining blockers

- No DNS change until the team approves based on merged-main evidence.
- No Vercel removal until an actual 24-72 hour Azure-only soak passes.
- Supabase is not sunset-ready:
  - no formal freeze timestamp and Supabase zero-read/write log export,
  - no native `pg_dump` plus restore-test,
  - `supa-final` did not complete successfully,
  - Morgan Street/Northshore golden retrieval remains unmapped,
  - no pause QA because Supabase was not paused,
  - no deletion approval.
