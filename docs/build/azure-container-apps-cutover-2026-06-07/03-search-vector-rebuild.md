# Azure Container Apps Cutover - Search / Vector Rebuild Checkpoint

Date: 2026-06-07
Status: PASS - search verify succeeded on merged-main image
Job: `job-a24-search-canon-eus`

## Written checkpoint

Azure Search/vector rebuild is allowed after this checkpoint because the index
is rebuilt from Azure Postgres source rows and prior evidence shows the job can
verify per-tenant document counts.

## Guardrails

- Do not print secrets.
- Do not use Supabase as the rebuild source.
- Use Azure Container Apps job/runtime only.
- Record job execution name, result, source row count, expected counts,
  observed counts, and mismatches.

## Planned operation

Start `job-a24-search-canon-eus`, which:

1. Deletes `tenant-context-v1` if present.
2. Recreates Azure Search index contracts.
3. Reads `enterprise_context_chunks` from Key Vault-backed Azure Postgres
   `DATABASE_URL` inside Azure Container Apps.
4. Uploads canonical tenant documents.
5. Verifies per-tenant Azure Search document counts.

## Execution record

| Field           | Value                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------- |
| Execution       | `job-a24-search-verify-eus-zxesl2t`                                                            |
| Status          | Succeeded                                                                                      |
| Source rows     | Prior rebuild evidence from `job-a24-search-canon-eus-ac5kk3z`: 21,967                         |
| Expected counts | Apex 6,497; First Capital 400; Lakeshore 6,576; Meridian 4,376; Northstar 878; SkyHarbor 3,240 |
| Observed counts | Apex 6,497; First Capital 400; Lakeshore 6,576; Meridian 4,376; Northstar 878; SkyHarbor 3,240 |
| Mismatches      | None observed in verify output                                                                 |

## Current operator attempt

`az containerapp job start --resource-group rg-abarva-controlplane-lab-eastus
--name job-a24-search-canon-eus` failed with `AuthorizationFailed` because the
operator identity does not have `Microsoft.App/jobs/start/action`.

After the operator role refresh and candidate image update,
`job-a24-search-verify-eus-zxesl2t` succeeded. After #3242/#3244 were merged,
merged-main execution `job-a24-search-verify-eus-v4xv4gp` also succeeded and
emitted the same observed counts:

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

The Azure-only smoke job also ran retrieval against `tenant-context-v1` and
returned three hits for each tenant: Apex, Meridian, First Capital, Lakeshore,
SkyHarbor, and Northstar.
